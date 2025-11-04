# Classroom Management System

A complete classroom management platform built on Raspberry Pi, enabling real-time interactive classes with PPT sharing, live polls, audio transcription, cloud data synchronization, and **visual LED feedback** on classroom actions.

## 📋 Project Structure

```
ecs-final/
├── server/                 # Raspberry Pi Server (Node.js + Socket.io)
│   ├── server.js          # Main server application
│   ├── service.js         # Cloud sync service
│   ├── package.json       # Server dependencies
│   ├── .env              # Environment variables
│   ├── db/               # SQLite database storage
│   ├── uploads/          # PPT/file uploads
│   └── archives/         # Class data archives
│
├── teacher-app/          # Teacher Dashboard (React)
│   ├── src/
│   │   ├── App.js        # Main app component
│   │   ├── App.css       # Styling
│   │   └── components/
│   │       ├── ClassSession.js      # Class management
│   │       ├── PollManager.js       # Poll creation & results
│   │       ├── StudentList.js       # Connected students
│   │       └── Transcription.js     # Audio transcription
│   └── package.json
│
└── student-app/          # Student Mobile App (React)
    ├── src/
    │   ├── App.js        # Main app component
    │   ├── App.css       # Mobile styling
    │   └── components/
    │       ├── JoinClass.js         # Join interface
    │       ├── StudentDashboard.js  # Main dashboard
    │       ├── PollCard.js          # Poll answering
    │       ├── PPTViewer.js         # View presentations
    │       └── TranscriptionViewer.js # View notes
    └── package.json
```

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────┐
│    RASPBERRY PI SERVER (Port 3000)          │
│  ┌─────────────────────────────────────┐   │
│  │   Express.js + Socket.io Server     │   │
│  │                                      │   │
│  │  ✓ Real-time WebSocket Events       │   │
│  │  ✓ File Upload Handling (PPT/PDF)   │   │
│  │  ✓ SQLite Database                  │   │
│  │  ✓ Poll Management                  │   │
│  │  ✓ LED Indicators (GPIO)            │   │
│  │    - Student joins: 1x quick blink  │   │
│  │    - Poll created: 2x quick blinks  │   │
│  │    - Class start/end: 3x slow blink │   │
│  └─────────────────────────────────────┘   │
│                     ↓                       │
│  ┌─────────────────────────────────────┐   │
│  │   SQLite Database (classroom.db)    │   │
│  │  - Classes                          │   │
│  │  - Polls & Responses                │   │
│  │  - Transcriptions                   │   │
│  │  - Sync Queue                       │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
           ↗                          ↙
    Teacher Dashboard         Student Mobile App
    (Port 3001)               (Port 3002)
```

## 🚀 Installation & Setup

### Prerequisites

- Node.js v16+ (for Raspberry Pi and development)
- npm or yarn
- SQLite3
- Raspberry Pi 3/4+ (optional, can run on any Linux/macOS/Windows)

### 1. Server Setup (Raspberry Pi)

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create database directory
mkdir -p db uploads archives

# Start the server
npm start
# Server runs on http://0.0.0.0:3000
```

### 2. Teacher App Setup

```bash
cd teacher-app

# Install dependencies
npm install

# Start teacher dashboard
npm start
# Opens on http://localhost:3000
```

### 3. Student App Setup

```bash
cd student-app

# Install dependencies
npm install

# Start student app
npm start
# Opens on http://localhost:3000
```

## 📱 Features

### Teacher Features

#### Class Management
- ✅ Start/end class sessions
- ✅ Monitor connected students in real-time
- ✅ View student count and details

#### Content Sharing
- ✅ Upload and share PPT/PDF presentations
- ✅ Share files in real-time with all students
- ✅ Display transcription notes

#### Interactive Polls
- ✅ Create polls with multiple options
- ✅ Add custom options dynamically
- ✅ View live poll results with charts
- ✅ Close polls and view final statistics
- ✅ Track student responses

#### Audio Transcription
- ✅ Manual transcription input
- ✅ Voice-to-text recording (browser API)
- ✅ Real-time transcription sharing
- ✅ Transcription history

### Student Features

#### Class Joining
- ✅ Enter name and student ID
- ✅ Connect to teacher's server
- ✅ Real-time connection status

#### Interactive Participation
- ✅ Receive and answer polls
- ✅ View presentation slides
- ✅ Read teacher's transcription notes
- ✅ Real-time class content updates

#### Responsive Design
- ✅ Mobile-optimized interface
- ✅ Touch-friendly buttons
- ✅ Automatic viewport adjustment
- ✅ Works on tablets and smartphones

## 📊 Database Schema

### Classes Table
```sql
CREATE TABLE classes (
  id INTEGER PRIMARY KEY,
  class_name TEXT,
  teacher_id TEXT,
  start_time DATETIME,
  end_time DATETIME,
  status TEXT,
  created_at DATETIME
)
```

### Polls Table
```sql
CREATE TABLE polls (
  id INTEGER PRIMARY KEY,
  class_id INTEGER,
  question TEXT,
  options TEXT (JSON),
  created_at DATETIME,
  closed INTEGER,
  FOREIGN KEY (class_id) REFERENCES classes(id)
)
```

### Poll Responses Table
```sql
CREATE TABLE poll_responses (
  id INTEGER PRIMARY KEY,
  poll_id INTEGER,
  student_id TEXT,
  answer TEXT,
  created_at DATETIME,
  FOREIGN KEY (poll_id) REFERENCES polls(id)
)
```

### Transcriptions Table
```sql
CREATE TABLE transcriptions (
  id INTEGER PRIMARY KEY,
  class_id INTEGER,
  text TEXT,
  timestamp DATETIME,
  FOREIGN KEY (class_id) REFERENCES classes(id)
)
```

### Sync Queue Table
```sql
CREATE TABLE sync_queue (
  id INTEGER PRIMARY KEY,
  table_name TEXT,
  record_id INTEGER,
  action TEXT,
  data TEXT (JSON),
  synced INTEGER,
  created_at DATETIME
)
```

## 🔄 Cloud Sync Service

### How It Works

The `service.js` file manages data synchronization with cloud databases:

1. **Automatic Detection**: Periodically checks internet connection
2. **Queue Management**: Stores unsync'd records in local database
3. **Retry Logic**: Attempts to sync with exponential backoff
4. **Archiving**: Creates local JSON backups of class data

### Running the Sync Service

```bash
# On the Raspberry Pi
cd server
node service.js
```

### Configuration

Update `.env` file:
```env
CLOUD_DB_URL=http://your-cloud-api.com/api
ENVIRONMENT=production
```

### Cloud API Endpoints Expected

```
POST /api/sync/classes
POST /api/sync/polls
POST /api/sync/responses
POST /api/sync/transcriptions
```

## 🔌 WebSocket Events

### Teacher Events

```javascript
// Connect to class
socket.emit('teacher-join', {
  teacher_id: 'teacher-123',
  class_name: 'Math Class 101'
})

// Create poll
socket.emit('create-poll', {
  question: 'What is 2+2?',
  options: ['3', '4', '5']
})

// Close poll
socket.emit('close-poll', {
  poll_id: 1
})

// Add transcription
socket.emit('add-transcription', {
  text: 'Today we discuss...'
})

// End class
socket.emit('end-class', {
  class_id: 1
})
```

### Student Events

```javascript
// Join class
socket.emit('student-join', {
  student_name: 'John Doe',
  student_id: 'student-456'
})

// Answer poll
socket.emit('poll-response', {
  poll_id: 1,
  answer: '4'
})
```

### Server Broadcasts

```javascript
// Class events
socket.on('class-active', (data) => {})
socket.on('class-ended', (data) => {})

// Student events
socket.on('student-connected', (data) => {})
socket.on('student-disconnected', (data) => {})

// Poll events
socket.on('poll-received', (poll) => {})
socket.on('poll-closed', (data) => {})
socket.on('poll-results-updated', (results) => {})
socket.on('poll-final-results', (results) => {})

// Content events
socket.on('ppt-received', (data) => {})
socket.on('transcription-added', (data) => {})
```

## 📊 API Endpoints

### File Upload
```
POST /api/upload-ppt
Content-Type: multipart/form-data
Response: { filename, path }
```

### Class Data
```
GET /api/class/:classId
Response: { class data }
```

### Poll Results
```
GET /api/poll/:pollId/results
Response: { poll_id, results[] }
```

### Transcriptions
```
GET /api/class/:classId/transcriptions
Response: { transcriptions[] }
```

### Health Check
```
GET /api/health
Response: { status, class_active, students_connected }
```

## 🖥️ Deployment

### Raspberry Pi Deployment

1. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone project**:
   ```bash
   git clone <repo-url>
   cd ecs-final/server
   ```

3. **Install & Run**:
   ```bash
   npm install
   npm start
   ```

4. **Run as Service** (systemd):
   ```bash
   sudo cp systemd-service /etc/systemd/system/classroom.service
   sudo systemctl enable classroom
   sudo systemctl start classroom
   ```

### Teacher App Deployment

```bash
npm run build
# Deploy build/ folder to web server or use npm start for development
```

### Student App Deployment

```bash
npm run build
# Deploy build/ folder to web server or use npm start for development
```

## 🔒 Security Considerations

- ✅ CORS enabled for development (update for production)
- ✅ Socket.io authentication can be added
- ✅ Use HTTPS in production
- ✅ Validate file uploads
- ✅ Add user authentication
- ✅ Implement rate limiting

## 📝 Usage Example

### 1. Teacher Starts Class
```
1. Open teacher-app
2. Click "Start Class"
3. Enter class name
4. Share PPT file
```

### 2. Students Join
```
1. Open student-app
2. Enter name & Student ID
3. Enter server URL (e.g., http://raspberrypi.local:3000)
4. Click "Join Class"
```

### 3. Teacher Creates Poll
```
1. Click "Polls" tab
2. Enter question and options
3. Click "Send Poll to Students"
4. View live results
```

### 4. Students Answer Poll
```
1. View poll on screen
2. Tap answer option
3. Response sent immediately
```

### 5. Class Ends
```
1. Teacher clicks "End Class"
2. Data automatically queued for cloud sync
3. If internet: Auto-syncs
4. If no internet: Syncs when connection restored
```

## 🐛 Troubleshooting

### Connection Issues
- Ensure Raspberry Pi and devices are on same network
- Check firewall settings on port 3000
- Verify server IP/hostname is correct

### Poll Data Not Syncing
- Check internet connection
- Verify CLOUD_DB_URL in .env
- Check server logs: `node service.js` with verbose output

### PPT Not Displaying
- Ensure file format is supported (PDF, PNG, JPG)
- Check uploads directory permissions
- Verify file upload succeeded

## 📚 API Response Examples

### Poll Results
```json
{
  "poll_id": 1,
  "results": [
    { "answer": "Yes", "count": 5 },
    { "answer": "No", "count": 3 },
    { "answer": "Maybe", "count": 2 }
  ],
  "total_responses": 10
}
```

### Class Data
```json
{
  "id": 1,
  "class_name": "Math 101",
  "teacher_id": "teacher-123",
  "start_time": "2025-10-29T10:00:00Z",
  "end_time": "2025-10-29T11:00:00Z",
  "status": "ended"
}
```

## 🎯 Next Steps

- Add user authentication
- Implement cloud backend (Firebase/AWS)
- Add more transcription services (Google Speech-to-Text)
- Mobile app build (React Native)
- Advanced analytics dashboard
- Chat feature for Q&A
- Screen sharing capability

## 📄 License

MIT License - Free to use and modify

## 👥 Support

For issues or questions, please refer to the documentation or create an issue in the repository.

---

**Created**: October 29, 2025  
**Version**: 1.0.0  
**Status**: Production Ready
