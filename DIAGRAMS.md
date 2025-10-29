# System Diagrams & Visual Guides

## 🔄 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                      CLASSROOM SESSION                              │
└─────────────────────────────────────────────────────────────────────┘

         TEACHER                SERVER (Pi)              STUDENT
           APP                  (Port 3000)               APP
            │                        │                     │
            │    Teacher Join        │                     │
            ├───────────────────────→│                     │
            │                        ├─→ Create Class     │
            │                        ├─→ Start Session    │
            │   ←───────────────────┤                     │
            │   Class Started       │                     │
            │                        │                    │
            │   PPT Upload          │                     │
            ├───────────────────────→│                     │
            │                        ├─→ Save File        │
            │                        ├─→ Broadcast PPT    │
            │                        │                ────→│
            │                        │                     ├─ PPT Received
            │   Create Poll         │                     │
            ├───────────────────────→│                     │
            │                        ├─→ Save Poll        │
            │                        ├─→ Broadcast Poll   │
            │                        │                ────→│
            │                        │                     ├─ Poll Received
            │                        │   Student Join     │
            │                        │←────────────────────┤
            │                        │                     │
            │ Update               │ Poll Response      │
            │ Live Results ←────────│←────────────────────┤
            │                        │                     │
            │ View Stats            │ Broadcast Update    │
            │                        │──────────→ (Store)  │
            │                        │                     │
            │   Add Transcription   │                     │
            ├───────────────────────→│                     │
            │                        ├─→ Save Note        │
            │                        ├─→ Broadcast        │
            │                        │                ────→│
            │                        │                     ├─ Note Received
            │                        │                     │
            │   End Class           │                     │
            ├───────────────────────→│                     │
            │                        ├─→ Close Session    │
            │                        ├─→ Queue for Sync   │
            │                        ├─→ Broadcast        │
            │                        │                ────→│
            │   ←───────────────────┤                     │
            │   Session Ended       │                     │ Disconnect
            │                        │                     │
            │                        │ Check Internet      │
            │                        ├─→ Sync to Cloud    │
            │                        │   (If Available)    │
            │                        │                     │
```

## 📊 Class Session Timeline

```
Timeline:
─────────────────────────────────────────────────────────────────────→ Time

T=0:00   Teacher starts class
         └─→ Database: Create class record
             Socket: Notify all connected

T=0:30   Teacher uploads PPT (Chapter1.pdf)
         └─→ File System: Save file
             Database: Log upload
             Socket: Broadcast to students

T=1:00   Teacher creates first poll
         ┌─ Question: "Understand Chapter?"
         ├─ Options: [Yes, Mostly, No]
         └─→ Database: Insert poll
             Socket: Send to all students

T=1:15   Students answer poll
         Student1: Yes     ─→ Database: log response
         Student2: Mostly  ─→ Database: log response
         Student3: No      ─→ Database: log response
         └─→ Teacher sees live results

T=2:00   Teacher closes poll
         └─→ Database: Mark poll closed
             Socket: Show final results

T=2:30   Teacher adds transcription
         "Important: Focus on Theorem 5"
         └─→ Database: Save transcription
             Socket: Broadcast to students

T=3:00   More PPT, polls, notes...
         └─→ Repeat cycle

T=9:00   Teacher ends class
         └─→ Database: Mark class ended
             Queue System: Add all records to sync_queue
             Service: Check internet connection
             
T=9:01   If Internet: Sync starts
         └─→ Service: POST to cloud API
             Database: Mark synced=1
             Logs: Backup created

T=9:02   If No Internet: Queue stored
         └─→ Service: Retry every 60 seconds
             Until: Internet connection restored
```

## 🏗️ System Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Teacher Dashboard          │         Student App                │
│  ├─ React Components        │  ├─ React Components             │
│  ├─ Socket.io Client        │  ├─ Socket.io Client             │
│  ├─ Charts & Stats          │  ├─ Poll Interface               │
│  └─ CSS Styling             │  └─ Mobile Responsive UI         │
└──────────┬──────────────────┴──────────────────┬────────────────┘
           │                                     │
           └─→ Socket.io Events / REST API ←─────┘
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Express.js Server (Node.js)                                    │
│  ├─ Socket.io Server                                            │
│  │  ├─ Connection Handling                                      │
│  │  ├─ Event Broadcasting                                       │
│  │  └─ Room Management                                          │
│  ├─ REST API Routes                                             │
│  │  ├─ /api/upload-ppt                                          │
│  │  ├─ /api/class/:id                                           │
│  │  └─ /api/poll/:id/results                                    │
│  └─ Business Logic                                              │
│     ├─ Poll Management                                          │
│     ├─ File Upload                                              │
│     └─ Data Validation                                          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────┤
│  SQLite Database                  │    File System              │
│  ├─ classes                       │  ├─ uploads/               │
│  ├─ polls                         │  ├─ db/                    │
│  ├─ poll_responses               │  └─ archives/              │
│  ├─ transcriptions                │                            │
│  └─ sync_queue                    │    Cloud Sync Service      │
│                                   │  ├─ Internet Detection     │
│                                   │  ├─ Queue Management       │
│                                   │  └─ Retry Logic            │
└─────────────────────────────────────────────────────────────────┘
                        │
                        ↓ (if internet available)
┌─────────────────────────────────────────────────────────────────┐
│                  CLOUD LAYER (Optional)                         │
├─────────────────────────────────────────────────────────────────┤
│  Cloud API Endpoint                                             │
│  ├─ POST /sync/classes                                          │
│  ├─ POST /sync/polls                                            │
│  ├─ POST /sync/responses                                        │
│  └─ POST /sync/transcriptions                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔌 WebSocket Event Flow

```
CLIENT                          SERVER                      OTHER CLIENTS
(Teacher/Student)              (Node.js)                    (Broadcast)
                                 │
         Connect                 │
    ─────────────────────→        │
                                  ├─→ 'connection' event
                                  │
         Emit Event               │
    ─────────────────────→        │
       (student-join)             ├─→ Process Event
                                  │   (Validate, Store DB)
                                  │
                                  ├─→ Emit Response
                                  │   (Back to sender)
                                  │
                                  ├─→ Broadcast Event
                                  │   (To other clients)
                                  │
                        ←─────────┼─────────→
                        (Only to     (To all
                         sender)   or selected)
                        
         Response Received
    ←────────────────────
       (Acknowledgment)
```

## 📱 Component Hierarchy (Teacher App)

```
App (Root)
├─ Header
│  ├─ Title
│  └─ Status Indicator
├─ Tab Navigation
│  ├─ Session
│  ├─ Polls
│  ├─ Students
│  └─ Transcription
└─ Content Area
   ├─ When tab = 'session'
   │  └─ ClassSession
   │     ├─ Start Class Form
   │     ├─ Active Session (if running)
   │     └─ PPT Upload
   ├─ When tab = 'polls'
   │  └─ PollManager
   │     ├─ Create Poll Form
   │     │  ├─ Question Input
   │     │  └─ Options List
   │     └─ Active Poll
   │        ├─ Poll Results Chart
   │        └─ Close Button
   ├─ When tab = 'students'
   │  └─ StudentList
   │     └─ Student Grid
   │        └─ Student Card (×n)
   └─ When tab = 'transcription'
      └─ Transcription
         ├─ Input Area
         │  ├─ Text Input
         │  ├─ Add Button
         │  └─ Voice Button
         └─ History Viewer
```

## 📱 Component Hierarchy (Student App)

```
App (Root)
├─ If not in class
│  └─ JoinClass
│     ├─ Name Input
│     ├─ Student ID Input
│     ├─ Server URL Input
│     └─ Join Button
└─ If in class
   ├─ StudentDashboard
   │  ├─ Header
   │  │  ├─ Title
   │  │  ├─ Status
   │  │  └─ Student Name
   │  ├─ Tab Navigation
   │  │  ├─ Class
   │  │  ├─ Presentation
   │  │  └─ Notes
   │  └─ Content Area
   │     ├─ Class Tab
   │     │  ├─ If poll active
   │     │  │  └─ PollCard
   │     │  │     ├─ Question
   │     │  │     └─ Options (buttons)
   │     │  └─ Else
   │     │     └─ Waiting Message
   │     ├─ PPT Tab
   │     │  └─ PPTViewer
   │     │     └─ Image/PDF Display
   │     └─ Notes Tab
   │        └─ TranscriptionViewer
   │           └─ Notes List
```

## 🔄 Poll Lifecycle

```
CREATION PHASE
──────────────
Teacher inputs question & options
         ↓
User clicks "Send Poll"
         ↓
Validate input (question, ≥2 options)
         ↓
Insert into database
         ↓
Broadcast to all students
         ↓
Students receive poll

ANSWERING PHASE
───────────────
Student sees poll question
         ↓
Student taps an option
         ↓
Send poll_response event
         ↓
Server stores in database
         ↓
Calculate results
         ↓
Send results update to teacher
         ↓
Teacher sees live results chart

CLOSING PHASE
─────────────
Teacher clicks "Close Poll"
         ↓
Mark poll as closed
         ↓
Broadcast poll-closed event
         ↓
Calculate final results
         ↓
Display final statistics
         ↓
Poll data persisted in database

SYNC PHASE
──────────
Queue poll data for sync
         ↓
Service detects internet
         ↓
POST to cloud API
         ↓
Mark synced in queue
         ↓
Archive locally
```

## 🔐 Security & Data Flow

```
INPUT VALIDATION
─────────────────
User Input → Validate → Sanitize → Store/Process
    ↓          ↓           ↓          ↓
  Bad      Return       Escape      Database
  Data     Error        HTML         (Safe)

FILE UPLOAD
───────────
File Select → Validate Type/Size → Save → Broadcast URL
    ↓             ↓                 ↓        ↓
  Choose      Check MIME        Filesystem  Students

DATABASE QUERIES
────────────────
User Action → Build Query → Parameterized → Execute
    ↓            ↓              ↓              ↓
  Poll      "SELECT *"      SQL Injection   Results
 Answer     FROM responses  Prevention     Returned
            WHERE poll = ?
```

## 📊 Database Query Examples

```
GET SINGLE CLASS
────────────────
Query: SELECT * FROM classes WHERE id = 1

Result: 
┌─────┬──────────────┬────────────┬──────────┬──────────┬────────┐
│ id  │ class_name   │ teacher_id │ start    │ end      │ status │
├─────┼──────────────┼────────────┼──────────┼──────────┼────────┤
│ 1   │ Math 101     │ teacher-1  │ 10:00 AM │ 11:00 AM │ ended  │
└─────┴──────────────┴────────────┴──────────┴──────────┴────────┘


GET POLL RESULTS
────────────────
Query: SELECT answer, COUNT(*) FROM poll_responses 
       WHERE poll_id = 2 GROUP BY answer

Result:
┌────────┬───────┐
│ answer │ count │
├────────┼───────┤
│ Yes    │   15  │
│ No     │    8  │
│ Maybe  │    5  │
└────────┴───────┘


GET CLASS SUMMARY
─────────────────
Query: SELECT c.*, COUNT(DISTINCT pr.student_id) as total_responses
       FROM classes c
       LEFT JOIN polls p ON c.id = p.class_id
       LEFT JOIN poll_responses pr ON p.id = pr.poll_id
       WHERE c.id = 1

Result: Class with student response count
```

## 🚀 Deployment Architecture

```
DEVELOPMENT
───────────
Localhost (127.0.0.1)
├─ :3000 → Server
├─ :3001 → Teacher App
└─ :3002 → Student App


PRODUCTION - SINGLE PI
──────────────────────
Raspberry Pi (192.168.1.100)
│
├─ Port 3000 (Server)
│  ├─ Socket.io Server
│  ├─ REST API
│  └─ SQLite Database
│
├─ Port 3001 (Teacher App) - Optional
│  └─ Served via Nginx/Express
│
└─ Port 3002 (Student App) - Optional
   └─ Served via Nginx/Express


PRODUCTION - DISTRIBUTED
────────────────────────
Cloud Provider (AWS/Azure/GCP)
│
├─ API Server (Load Balanced)
│  ├─ Multiple instances
│  ├─ PostgreSQL Database
│  └─ Cloud Storage (S3)
│
├─ Teacher App (CDN)
│  └─ Static hosting
│
└─ Student App (CDN)
   └─ Static hosting

Local Device
│
└─ Raspberry Pi (Fallback/Hybrid Mode)
   ├─ Local database
   ├─ Offline capability
   └─ Sync to cloud
```

---

**Visual Guide Complete!** 📊

These diagrams help visualize:
- ✅ Complete data flow
- ✅ System architecture
- ✅ Component relationships
- ✅ Database queries
- ✅ Security model
- ✅ Deployment options

For more details, see other documentation files.
