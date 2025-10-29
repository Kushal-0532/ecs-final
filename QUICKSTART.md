# Getting Started - Quick Setup Guide

## 🚀 Quick Start (5 minutes)

### Option 1: Local Development (All on One Machine)

#### Terminal 1 - Start Server
```bash
cd server
npm install
npm start
```
**Output**: Server running on `http://localhost:3000`

#### Terminal 2 - Start Teacher App
```bash
cd teacher-app
npm install
npm start
```
**Output**: Opens browser on `http://localhost:3000`

#### Terminal 3 - Start Student App
```bash
cd student-app
npm install
npm start
```
**Output**: Opens browser on `http://localhost:3000` (different port, typically 3002)

### Option 2: Raspberry Pi Setup

#### Step 1: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs sqlite3
```

#### Step 2: Setup Server
```bash
cd server
npm install
npm start
```

#### Step 3: Access from Other Devices
- Find Raspberry Pi IP: `hostname -I` or `ifconfig`
- Open teacher app: Students use this IP to connect

## 📱 Using the Apps

### Teacher Workflow
```
1. Login/Start → Enter class name → Click "Start Class"
2. Upload PPT → Share file with students
3. Create Poll → Set question & options → Send
4. View Results → See live poll statistics
5. Add Notes → Transcribe class content
6. End Class → Data syncs to cloud
```

### Student Workflow
```
1. Enter name → Get Student ID
2. Enter Server IP → Join Class
3. Answer Polls → Click options when poll arrives
4. View PPT → See shared presentations
5. Read Notes → Review transcriptions
```

## 🔧 Configuration

### Server (.env)
```
PORT=3000
CLOUD_DB_URL=http://your-backend.com/api
ENVIRONMENT=production
```

### Cloud Sync Service
```bash
# Run separately to sync data
cd server
node service.js
```

## 📊 Live Test

### Simulated Class Session

**Teacher Dashboard:**
- Class: "Demo Class"
- Upload: sample.pdf
- Poll: "Favorite Color?" → Red/Blue/Green
- Result: 5 students answer

**Student Experience:**
- See poll question
- Click answer
- View presentation
- Read notes

## ⚡ Key Features in Action

| Feature | Teacher | Student |
|---------|---------|---------|
| **Class Control** | Start/End class | Join/Leave |
| **PPT Sharing** | Upload & share | View slides |
| **Polls** | Create & view results | Answer & submit |
| **Transcription** | Add notes | Read notes |
| **Live Stats** | See connections | Real-time updates |
| **Cloud Sync** | Auto backup | N/A |

## 🎓 Example Poll Flow

### Teacher Creates:
```
Question: "What is 5+3?"
Options: 
  - 8
  - 7
  - 9
```

### Students Answer:
- Student 1 → "8" ✓
- Student 2 → "8" ✓
- Student 3 → "7" ✗

### Results Display:
```
8 ████████████ 2 votes
7 ████ 1 vote
9 0 votes
Total: 3 responses
```

## 🔌 Default Ports

| Service | Port | URL |
|---------|------|-----|
| Server | 3000 | http://localhost:3000 |
| Teacher App | 3000 (dev) | http://localhost:3000 |
| Student App | 3002 (dev) | http://localhost:3002 |

## 💾 Database Initialization

Automatically created on first run:
- `server/db/classroom.db` - SQLite database
- `server/uploads/` - Uploaded files
- `server/archives/` - Archived data

## 📊 Sample Data Queries

### Get all polls from a class:
```javascript
// In Node.js
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./db/classroom.db');

db.all('SELECT * FROM polls WHERE class_id = ?', [1], (err, rows) => {
  console.log(rows);
});
```

### Export class data:
```bash
sqlite3 db/classroom.db ".dump classes" > export.sql
```

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` in that directory |
| Port 3000 already in use | Change `PORT` in `.env` |
| Cannot connect to server | Check firewall, verify IP/port |
| No poll results | Check database has poll_responses table |
| Files not uploading | Check `uploads/` directory permissions |

## 📝 Logging & Debugging

### Enable Verbose Logging:
```bash
DEBUG=* npm start
```

### Check Server Logs:
```bash
# Live logs
pm2 logs classroom

# SQLite queries
sqlite3 db/classroom.db ".log stdout"
```

## 🔄 Data Flow Diagram

```
[Teacher App] ──✉──────────┐
                           ↓
            ┌──────────────────────────────┐
            │  Raspberry Pi Server         │
            │  (Node.js + Socket.io)       │
            │  ┌──────────────────────┐   │
            │  │ SQLite Database      │   │
            │  └──────────────────────┘   │
            └──────────────────────────────┘
                           ↑
[Student App] ─────✉──────┘

[Internet] → [Cloud DB] (if connected)
                ↑
            [service.js]
```

## 🎯 Next Steps

1. ✅ Start all three services
2. ✅ Open teacher dashboard
3. ✅ Open student dashboard(s)
4. ✅ Create first poll
5. ✅ Answer from student app
6. ✅ Verify results in real-time

## 📞 Support Resources

- **Documentation**: See `README.md`
- **Issues**: Check troubleshooting section
- **Examples**: Test with sample data
- **Logs**: Check console output for errors

---

**Ready?** Start with Option 1 above and test locally first! 🚀
