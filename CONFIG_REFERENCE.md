# Configuration Templates & Examples

## 🔧 Server Configuration (.env)

### Development
```env
PORT=3000
CLOUD_DB_URL=http://localhost:8000/api
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=debug
```

### Production (Raspberry Pi)
```env
PORT=3000
CLOUD_DB_URL=https://api.yourdomain.com/api
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=error
MAX_UPLOAD_SIZE=52428800
SESSION_SECRET=your-secret-key-here
```

## 🗺️ Server Configuration

### Customize Server Ports

```javascript
// In server.js, change:
const PORT = process.env.PORT || 3000;

// To:
const PORT = process.env.PORT || 5000; // Custom port
```

### Increase File Upload Limit

```javascript
// In server.js, find:
const upload = multer({ storage });

// Change to:
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100 MB instead of 50 MB
  }
});
```

### Enable Production Logging

```javascript
// Add to server.js after app initialization:
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
```

## 🎨 Customize UI Themes

### Change Teacher Dashboard Colors

```css
/* In teacher-app/src/App.css, replace color scheme:

Current (Purple):
#667eea (Primary)
#764ba2 (Secondary)

To Blue:
#3498db (Primary)
#2980b9 (Secondary)

To Green:
#27ae60 (Primary)
#229954 (Secondary)

To Orange:
#e67e22 (Primary)
#d35400 (Secondary)
*/

.app-header {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}

.btn-primary {
  background: #3498db;
}

.btn-primary:hover {
  background: #2980b9;
}
```

### Change Student App Colors

```css
/* student-app/src/App.css */
.join-card {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
}

.poll-option-btn {
  background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
}
```

## 🗄️ Database Backup & Restore

### Backup Database

```bash
#!/bin/bash
# save as: backup-db.sh

BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Backup SQLite database
cp server/db/classroom.db $BACKUP_DIR/classroom_$TIMESTAMP.db

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$TIMESTAMP.tar.gz server/uploads/

echo "Backup created: $BACKUP_DIR/classroom_$TIMESTAMP.db"
```

### Restore Database

```bash
#!/bin/bash
# Restore from backup
# Usage: ./restore-db.sh <backup-file>

if [ -z "$1" ]; then
  echo "Usage: ./restore-db.sh <backup-file>"
  exit 1
fi

# Stop service
sudo systemctl stop classroom

# Restore database
cp "$1" server/db/classroom.db

# Start service
sudo systemctl start classroom

echo "Database restored from $1"
```

## 📊 Advanced Database Queries

### Get Class Summary

```sql
SELECT 
  c.id,
  c.class_name,
  c.start_time,
  c.end_time,
  COUNT(DISTINCT pr.student_id) as total_students,
  COUNT(DISTINCT p.id) as total_polls,
  COUNT(pr.id) as total_responses
FROM classes c
LEFT JOIN polls p ON c.id = p.class_id
LEFT JOIN poll_responses pr ON p.id = pr.poll_id
WHERE c.id = 1
GROUP BY c.id;
```

### Get Poll Statistics

```sql
SELECT 
  p.id,
  p.question,
  pr.answer,
  COUNT(*) as response_count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM poll_responses WHERE poll_id = p.id), 1) as percentage
FROM polls p
LEFT JOIN poll_responses pr ON p.id = pr.poll_id
WHERE p.class_id = 1
GROUP BY p.id, pr.answer;
```

### Get Sync Queue Status

```sql
-- Check pending syncs
SELECT table_name, COUNT(*) as count FROM sync_queue 
WHERE synced = 0 
GROUP BY table_name;

-- Get oldest unsync'd record
SELECT * FROM sync_queue 
WHERE synced = 0 
ORDER BY created_at ASC 
LIMIT 1;
```

## 🔌 Socket.io Events Customization

### Add Custom Room

```javascript
// In server.js:
socket.on('join-study-group', (data) => {
  socket.join(`study-group-${data.group_id}`);
  io.to(`study-group-${data.group_id}`).emit('member-joined', {
    user: data.user_name
  });
});
```

### Add Message Broadcasting

```javascript
// In server.js:
socket.on('send-message', (data) => {
  const message = {
    sender: data.sender_name,
    text: data.text,
    timestamp: new Date()
  };
  
  // Broadcast to class
  io.to('students-room').emit('message-received', message);
  
  // Store in database
  db.run('INSERT INTO messages (class_id, sender, text) VALUES (?, ?, ?)',
    [activeClass.id, data.sender_name, data.text]);
});
```

## 🛠️ Custom Middleware

### Add Rate Limiting

```javascript
// Install: npm install express-rate-limit
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);
```

### Add Request Logging

```javascript
const fs = require('fs');
const path = require('path');

const logStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

app.use((req, res, next) => {
  const log = `${new Date().toISOString()} - ${req.method} ${req.path}\n`;
  logStream.write(log);
  next();
});
```

## 📱 Responsive Breakpoints

### Update Media Queries for Different Devices

```css
/* Small phones (320px - 480px) */
@media (max-width: 480px) {
  .section { padding: 10px; }
  .poll-option-btn { font-size: 14px; }
}

/* Medium phones (481px - 768px) */
@media (max-width: 768px) {
  .students-grid { grid-template-columns: 1fr; }
  .button-group { flex-direction: column; }
}

/* Tablets (769px - 1024px) */
@media (max-width: 1024px) {
  .app-content { padding: 20px; }
  .tab-btn { min-width: 80px; }
}

/* Desktops (1025px+) */
@media (min-width: 1025px) {
  .app-content { max-width: 1400px; }
  .students-grid { grid-template-columns: repeat(4, 1fr); }
}
```

## 🔒 Security Enhancements

### Add Request Validation

```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/create-poll',
  body('question').notEmpty().trim().escape(),
  body('options').isArray().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process poll
  }
);
```

### Add HTTPS

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/key.pem'),
  cert: fs.readFileSync('path/to/cert.pem')
};

https.createServer(options, app).listen(443);
```

## 📈 Performance Optimization

### Enable Compression

```javascript
const compression = require('compression');
app.use(compression());
```

### Add Caching Headers

```javascript
app.use((req, res, next) => {
  if (req.path.includes('/uploads/')) {
    res.set('Cache-Control', 'public, max-age=3600');
  } else if (req.path.includes('/api/')) {
    res.set('Cache-Control', 'no-cache');
  }
  next();
});
```

### Database Connection Pool

```javascript
// For PostgreSQL (future upgrade):
const { Pool } = require('pg');
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## 🧪 Testing Helpers

### Create Test Data Script

```javascript
// save as: test-data.js
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./server/db/classroom.db');

// Create test class
db.run(`INSERT INTO classes (class_name, teacher_id, start_time, status)
  VALUES ('Test Class', 'teacher-1', datetime('now'), 'active')`);

// Create test poll
db.run(`INSERT INTO polls (class_id, question, options, closed)
  VALUES (1, 'Test Question?', '[\"Yes\", \"No\"]', 0)`);

console.log('Test data created');
```

### Run Tests

```bash
# Create test data
node test-data.js

# Query results
sqlite3 server/db/classroom.db "SELECT * FROM classes;"
sqlite3 server/db/classroom.db "SELECT * FROM polls;"
```

## 🚀 Deployment Checklist

### Pre-Deployment
```
☐ Update .env for production
☐ Run npm install --production
☐ Test all features locally
☐ Backup existing database
☐ Review error logs
☐ Update firewall rules
☐ Configure SSL certificate
```

### Deployment
```
☐ SSH to Raspberry Pi
☐ Stop existing service: sudo systemctl stop classroom
☐ Pull latest code: git pull
☐ Install dependencies: npm install
☐ Start service: sudo systemctl start classroom
☐ Verify service: sudo systemctl status classroom
☐ Check logs: sudo journalctl -u classroom -f
```

### Post-Deployment
```
☐ Test all features
☐ Monitor system resources
☐ Check database integrity
☐ Verify cloud sync (if applicable)
☐ Set up backup cron job
☐ Monitor error logs
☐ Test with actual students
```

---

**Last Updated**: October 29, 2025

For more information, see:
- README.md - Main documentation
- DEPLOYMENT.md - Detailed deployment guide
- ARCHITECTURE.md - Technical architecture
