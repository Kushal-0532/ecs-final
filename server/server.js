import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { fileURLToPath } from 'url';
import { initLED, quickBlink, slowBlink, doubleBlink, cleanup } from './gpio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory
fs.ensureDirSync(path.join(__dirname, 'uploads'));
fs.ensureDirSync(path.join(__dirname, 'db'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Initialize SQLite Database
const db = new sqlite3.Database(path.join(__dirname, 'db', 'classroom.db'), (err) => {
  if (err) {
    console.error('Database error:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Database initialization
function initializeDatabase() {
  db.serialize(() => {
    // Create classes table
    db.run(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_name TEXT NOT NULL,
        teacher_id TEXT NOT NULL,
        start_time DATETIME,
        end_time DATETIME,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create polls table
    db.run(`
      CREATE TABLE IF NOT EXISTS polls (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        question TEXT NOT NULL,
        options TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        closed INTEGER DEFAULT 0,
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )
    `);

    // Create poll responses table
    db.run(`
      CREATE TABLE IF NOT EXISTS poll_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poll_id INTEGER NOT NULL,
        student_id TEXT NOT NULL,
        answer TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (poll_id) REFERENCES polls(id)
      )
    `);

    // Create transcriptions table
    db.run(`
      CREATE TABLE IF NOT EXISTS transcriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )
    `);

    // Create sync queue table
    db.run(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        data TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database tables initialized');
  });
}

// Initialize LED controller
initLED();

// Store active class and connected sockets
let activeClass = null;
const connectedStudents = new Map();

// Socket.IO events
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  // Teacher connects
  socket.on('teacher-join', (data) => {
    console.log('Teacher joined:', data.teacher_id);
    socket.join('teacher-room');
    
    // Create new class session
    db.run(
      'INSERT INTO classes (class_name, teacher_id, start_time, status) VALUES (?, ?, ?, ?)',
      [data.class_name || 'Class Session', data.teacher_id, new Date(), 'active'],
      function(err) {
        if (err) {
          console.error('Error creating class:', err);
          return;
        }
        activeClass = {
          id: this.lastID,
          teacher_id: data.teacher_id,
          status: 'active'
        };

        // Blink LED: Class started (3x slow)
        slowBlink(3, `Class started: ${data.class_name}`);

        socket.emit('class-started', { class_id: activeClass.id });
        io.emit('class-active', { class_id: activeClass.id });
        
        // Send class info to all connected students
        console.log('Sending class-info to students:', data.class_name);
        io.to('students-room').emit('class-info', { class_name: data.class_name });
      }
    );
  });

  // Student joins
  socket.on('student-join', (data) => {
    console.log('Student joined:', data.student_name, data.student_id);
    connectedStudents.set(socket.id, {
      student_id: data.student_id,
      student_name: data.student_name,
      socket_id: socket.id
    });
    
    socket.join('students-room');
    io.to('teacher-room').emit('student-connected', {
      student_id: data.student_id,
      student_name: data.student_name,
      total_students: connectedStudents.size
    });

    // Blink LED: Student joins (1x quick)
    quickBlink(1, `Student joined: ${data.student_name}`);

    // Send class name to student immediately
    // Even if no class is active, send the student's joined status
    if (activeClass) {
      db.get('SELECT class_name FROM classes WHERE id = ?', [activeClass.id], (err, row) => {
        if (!err && row) {
          console.log('Sending active class-info to joining student:', row.class_name);
          socket.emit('class-info', { class_name: row.class_name, class_id: activeClass.id });
        }
      });
    } else {
      // Send acknowledgment that student is connected and waiting for teacher
      console.log('Sending waiting status to student (no active class yet)');
      socket.emit('student-waiting', { 
        message: 'Waiting for teacher to start class',
        status: 'ready'
      });
    }
  });

  // Teacher shares PPT
  socket.on('share-ppt', (data) => {
    console.log('PPT shared:', data.filename);
    io.emit('ppt-received', {
      filename: data.filename,
      url: `/uploads/${data.filename}`
    });
  });

  // Handle PPT upload
  socket.on('upload-ppt', (data) => {
    console.log('PPT upload event received');
  });

  // Create and send poll
  socket.on('create-poll', (data) => {
    if (!activeClass) {
      socket.emit('error', { message: 'No active class' });
      return;
    }

    const optionsJSON = JSON.stringify(data.options);
    db.run(
      'INSERT INTO polls (class_id, question, options) VALUES (?, ?, ?)',
      [activeClass.id, data.question, optionsJSON],
      function(err) {
        if (err) {
          console.error('Error creating poll:', err);
          return;
        }
        
        const poll = {
          poll_id: this.lastID,
          question: data.question,
          options: data.options
        };

        // Blink LED: Poll created (2x quick - double blink)
        doubleBlink(`Poll created: ${data.question}`);

        // Broadcast to all students
        io.to('students-room').emit('poll-received', poll);
        io.to('teacher-room').emit('poll-created', poll);
      }
    );
  });

  // Receive poll response
  socket.on('poll-response', (data) => {
    const student = connectedStudents.get(socket.id);
    if (!student) return;

    db.run(
      'INSERT INTO poll_responses (poll_id, student_id, answer) VALUES (?, ?, ?)',
      [data.poll_id, student.student_id, data.answer],
      (err) => {
        if (err) {
          console.error('Error saving poll response:', err);
          return;
        }

        // Blink LED: Poll response received (1x quick)
        quickBlink(1, `Poll response from ${student.student_name}: ${data.answer}`);

        // Get poll results
        db.all(
          'SELECT answer, COUNT(*) as count FROM poll_responses WHERE poll_id = ? GROUP BY answer',
          [data.poll_id],
          (err, results) => {
            if (err) {
              console.error('Error fetching results:', err);
              return;
            }

            io.to('teacher-room').emit('poll-results-updated', {
              poll_id: data.poll_id,
              results: results,
              total_responses: results.reduce((sum, r) => sum + r.count, 0)
            });
          }
        );
      }
    );
  });

  // Close poll
  socket.on('close-poll', (data) => {
    db.run(
      'UPDATE polls SET closed = 1 WHERE id = ?',
      [data.poll_id],
      (err) => {
        if (err) {
          console.error('Error closing poll:', err);
          return;
        }

        io.emit('poll-closed', { poll_id: data.poll_id });

        // Get final results
        db.all(
          'SELECT answer, COUNT(*) as count FROM poll_responses WHERE poll_id = ? GROUP BY answer',
          [data.poll_id],
          (err, results) => {
            if (err) return;
            io.emit('poll-final-results', {
              poll_id: data.poll_id,
              results: results
            });
          }
        );
      }
    );
  });

  // Add transcription
  socket.on('add-transcription', (data) => {
    if (!activeClass) return;

    db.run(
      'INSERT INTO transcriptions (class_id, text) VALUES (?, ?)',
      [activeClass.id, data.text],
      (err) => {
        if (err) {
          console.error('Error saving transcription:', err);
          return;
        }
        
        // Blink LED: Transcription added (1x quick)
        quickBlink(1, `Transcription added: ${data.text.substring(0, 50)}...`);
        
        io.emit('transcription-added', {
          text: data.text,
          timestamp: new Date()
        });
      }
    );
  });

  // End class
  socket.on('end-class', (data) => {
    if (!activeClass) return;

    db.run(
      'UPDATE classes SET end_time = ?, status = ? WHERE id = ?',
      [new Date(), 'ended', activeClass.id],
      (err) => {
        if (err) {
          console.error('Error ending class:', err);
          return;
        }

        // Blink LED: Class ended (3x slow)
        slowBlink(3, 'Class ended');

        io.emit('class-ended', { class_id: activeClass.id });
        
        // Queue data for sync
        queueForSync('classes', activeClass.id, 'update', {});
        
        // Notify about sync service
        console.log('Sync service can now run to transfer data to cloud');
        
        activeClass = null;
        connectedStudents.clear();
      }
    );
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Disconnected:', socket.id);
    const student = connectedStudents.get(socket.id);
    if (student) {
      connectedStudents.delete(socket.id);
      io.to('teacher-room').emit('student-disconnected', {
        student_id: student.student_id,
        total_students: connectedStudents.size
      });
    }
  });
});

// Queue data for cloud sync
function queueForSync(tableName, recordId, action, data) {
  db.run(
    'INSERT INTO sync_queue (table_name, record_id, action, data) VALUES (?, ?, ?, ?)',
    [tableName, recordId, action, JSON.stringify(data)],
    (err) => {
      if (err) {
        console.error('Error queuing for sync:', err);
      }
    }
  );
}

// REST API Endpoints

// Upload PPT
app.post('/api/upload-ppt', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({
    message: 'File uploaded successfully',
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`
  });
});

// Get class data
app.get('/api/class/:classId', (req, res) => {
  const { classId } = req.params;
  
  db.get('SELECT * FROM classes WHERE id = ?', [classId], (err, classData) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json(classData);
  });
});

// Download file endpoint
app.get('/api/download/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(__dirname, 'uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Set headers for download
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Stream the file
  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', (err) => {
    console.error('Error streaming file:', err);
    res.status(500).json({ error: 'Error downloading file' });
  });
  fileStream.pipe(res);
});

// Get poll results
app.get('/api/poll/:pollId/results', (req, res) => {
  const { pollId } = req.params;
  
  db.all(
    'SELECT answer, COUNT(*) as count FROM poll_responses WHERE poll_id = ? GROUP BY answer',
    [pollId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ poll_id: pollId, results });
    }
  );
});

// Get transcriptions
app.get('/api/class/:classId/transcriptions', (req, res) => {
  const { classId } = req.params;
  
  db.all(
    'SELECT * FROM transcriptions WHERE class_id = ? ORDER BY timestamp ASC',
    [classId],
    (err, transcriptions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ transcriptions });
    }
  );
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    class_active: activeClass !== null,
    students_connected: connectedStudents.size
  });
});

// Server discovery endpoint - helps clients find this server
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

app.get('/api/server-info', (req, res) => {
  res.json({
    serverIp: getLocalIP(),
    serverHostname: os.hostname(),
    port: process.env.PORT || 3000,
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Classroom server running on http://0.0.0.0:${PORT}`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  cleanup();
  process.exit(0);
});
