# System Architecture & Technical Details

## 🏛️ Overall System Design

```
┌─────────────────────────────────────────────────────────────┐
│                    CLASSROOM NETWORK                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         RASPBERRY PI SERVER (Core)                  │   │
│  │                                                     │   │
│  │  Node.js Application Layer                         │   │
│  │  ├── Express.js (REST API)                         │   │
│  │  ├── Socket.io (WebSocket/Real-time)              │   │
│  │  ├── Multer (File Handling)                        │   │
│  │  └── Auth Middleware                              │   │
│  │                                                     │   │
│  │  Data Layer                                        │   │
│  │  ├── SQLite3 (Local Database)                      │   │
│  │  │   ├── Classes                                   │   │
│  │  │   ├── Polls & Responses                         │   │
│  │  │   ├── Transcriptions                            │   │
│  │  │   └── Sync Queue                                │   │
│  │  ├── File System (PPT/PDF uploads)                 │   │
│  │  └── Archives (JSON backups)                       │   │
│  │                                                     │   │
│  │  Services                                          │   │
│  │  ├── Cloud Sync Service (service.js)              │   │
│  │  ├── Event Broadcasting                           │   │
│  │  └── Error Handling                               │   │
│  └─────────────────────────────────────────────────────┘   │
│           ↗                    ↓                  ↖          │
│          /                     │                   \         │
│   [WiFi/LAN]            [SQLite DB]           [WiFi/LAN]   │
│      /                      ↓                      \        │
│     /                    [Files]                    \       │
│    /                                                 \      │
└───────────────────────────────────────────────────────────┘
    ↓                                                  ↓
┌─────────────────────┐                   ┌──────────────────┐
│   TEACHER APP       │                   │  STUDENT APPS    │
│   (Browser)         │                   │  (Mobile/Tablet) │
│                     │                   │                  │
│ • Dashboard         │                   │ • Join Interface │
│ • Class Control     │                   │ • Poll Answers   │
│ • Poll Manager      │                   │ • PPT Viewer     │
│ • Student Monitor   │                   │ • Notes Reader   │
│ • Transcription     │                   │ • Real-time Sync │
└─────────────────────┘                   └──────────────────┘
         ↓                                          ↓
    [Socket.io Events] ←──────────────────→ [Socket.io Events]
         ↓                                          ↓
    [REST API] ←──────────────────────────────→ [REST API]
```

## 🔄 Request/Response Cycle

### Example: Poll Creation Flow

```
TEACHER              SERVER              STUDENT
  │                    │                    │
  ├─→ Create Poll ────→│                    │
  │   (REST POST)      │                    │
  │                    ├─→ Save to DB       │
  │                    │                    │
  │                    ├─→ Broadcast ───────┼──→ Receive Poll
  │                    │   (Socket.io)      │
  │    ←─ Response ────┤                    │
  │    (Results: {})   │                    │
  │                    │      ←─ Answer ────┤
  │                    │    (Poll Response) │
  │    ←─ Results Update ──────────────────┤
  │    (Live Chart)    │
  │                    ├─→ Save Response    │
  │                    │                    │
```

## 📡 WebSocket Message Protocol

### Connection Lifecycle

```
1. CLIENT CONNECTS
   socket = io('http://server:3000')
   
2. SERVER RECEIVES
   io.on('connection', (socket) => {})
   
3. AUTHENTICATION (Optional)
   socket.emit('auth', credentials)
   
4. EVENT HANDLING
   socket.on('custom-event', handler)
   socket.emit('custom-event', data)
   
5. BROADCAST
   io.emit('event')        // All clients
   socket.broadcast.emit() // All except sender
   io.to('room').emit()    // Specific room
```

### Message Payload Example

```javascript
{
  "event": "poll-response",
  "timestamp": "2025-10-29T10:30:45.123Z",
  "sender": {
    "id": "student-xyz",
    "name": "John Doe",
    "type": "student"
  },
  "payload": {
    "poll_id": 42,
    "answer": "Yes",
    "response_time": 1250 // ms to respond
  },
  "metadata": {
    "room": "class-1",
    "session": "2025-10-29"
  }
}
```

## 📊 Database Relations

```
┌──────────────┐
│   CLASSES    │
├──────────────┤
│ id (PK)      │
│ class_name   │
│ teacher_id   │
│ start_time   │
│ end_time     │
│ status       │
└──────┬───────┘
       │ 1
       │ (has many)
       │ n
   ┌───┴────────────┬─────────────────┐
   │                │                 │
┌──┴────────┐  ┌───┴────────┐   ┌────┴──────────┐
│   POLLS   │  │ TRANSCR.   │   │  SYNC_QUEUE   │
├───────────┤  ├────────────┤   ├───────────────┤
│ id (PK)   │  │ id (PK)    │   │ id (PK)       │
│ class_id  │  │ class_id   │   │ table_name    │
│ question  │  │ text       │   │ record_id     │
│ options   │  │ timestamp  │   │ action        │
│ closed    │  └────────────┘   │ data (JSON)   │
└──┬────────┘                    │ synced        │
   │ 1                           └───────────────┘
   │ (has many)
   │ n
   │
┌──┴──────────────────┐
│  POLL_RESPONSES     │
├─────────────────────┤
│ id (PK)             │
│ poll_id (FK)        │
│ student_id          │
│ answer              │
│ created_at          │
└─────────────────────┘
```

## 🔐 Data Security & Integrity

### In-Transit Security
```
HTTP/2 + TLS/SSL (Production)
├── Teacher ↔ Server: Encrypted
├── Server ↔ Student: Encrypted
└── Server ↔ Cloud: Encrypted
```

### At-Rest Security
```
SQLite Database
├── Stored in: server/db/classroom.db
├── Permissions: Read/Write restricted
└── Backup: Encrypted archives
```

### Input Validation
```javascript
// File Upload
- Max size: 50MB
- Allowed types: .pdf, .ppt, .pptx, .png, .jpg
- Scanning: Basic file type verification

// Form Input
- Required field validation
- XSS prevention
- SQL injection prevention (Parameterized queries)
```

## ⚡ Performance Optimizations

### Server-Side
```
1. Connection Pooling
   - SQLite: Uses single connection pool
   - Reduces overhead per query

2. Caching
   - Poll results cached in memory
   - Reduces database queries

3. Compression
   - gzip enabled for HTTP responses
   - Socket.io binary compression

4. Async/Await
   - Non-blocking I/O operations
   - Concurrent request handling
```

### Client-Side
```
1. Component Memoization
   - React.memo for expensive components
   - Reduces unnecessary re-renders

2. Lazy Loading
   - Code splitting with React.lazy
   - On-demand component loading

3. Socket.io Optimization
   - Message throttling
   - Event debouncing
   - Connection reuse

4. CSS Optimization
   - Minified CSS
   - Hardware acceleration (transform, opacity)
```

## 🔄 Sync Strategy

### Local-First Approach
```
Event Occurs → Store in SQLite → Queue for Sync → Broadcast to Users
                                      ↓
                        Try Cloud Sync (background)
                        Success? → Mark Synced
                        Failure? → Retry with backoff
                        No Network? → Queue indefinitely
```

### Retry Logic
```javascript
Retry Strategy:
├── Attempt 1: Immediate
├── Attempt 2: +5s delay
├── Attempt 3: +10s delay
└── Failure: Queue for next cycle

Backoff: Exponential (base 2)
Max Retries: 3 per record
Sync Interval: 60 seconds
```

## 📈 Scalability Considerations

### Current Design (Single Server)
```
Max Concurrent Connections: ~100 (Depends on Pi specs)
Max Polls per Class: Unlimited (DB dependent)
Max Transcriptions: Unlimited
Data Retention: As long as disk space
```

### Future Scaling
```
Option 1: Multiple Pi Servers
├── Load Balancer
├── Server Clustering
├── Shared Database
└── CDN for files

Option 2: Cloud Migration
├── AWS/Azure/GCP backend
├── Managed database
├── Auto-scaling
└── Global distribution
```

## 🛡️ Error Handling

### Server-Side
```javascript
Try-Catch Blocks
├── Socket event handlers
├── API endpoints
├── Database operations
└── File operations

Error Logging
├── Console logging (development)
├── File logging (production)
└── Error aggregation service (future)

Recovery Strategies
├── Automatic reconnection
├── Data rollback on failure
└── User notification
```

### Client-Side
```javascript
Error Boundaries
├── Catch React component errors
├── Display fallback UI
└── Log to server

Network Error Handling
├── Retry failed requests
├── Queue offline changes
└── Sync when online

User Feedback
├── Toast notifications
├── Error modals
└── Status indicators
```

## 🧪 Testing Considerations

### Unit Tests
```
Server Routes
├── POST /api/upload-ppt
├── GET /api/class/:id
└── GET /api/poll/:id/results

Socket Events
├── teacher-join
├── student-join
├── create-poll
└── poll-response
```

### Integration Tests
```
End-to-End Flows
├── Full class session
├── Poll creation & response
├── File upload & sharing
└── Cloud sync
```

### Load Tests
```
Stress Test Scenarios
├── 50 concurrent students
├── Rapid poll responses
├── Large file uploads
└── High message frequency
```

## 📦 Deployment Checklist

```
Pre-Deployment
☐ All tests passing
☐ Environment variables set
☐ Database initialized
☐ SSL certificates ready
☐ CORS properly configured
☐ Rate limiting enabled
☐ Logging configured

Deployment
☐ Server uploaded to Pi
☐ Dependencies installed
☐ Database migrated
☐ Service started
☐ Health check passed

Post-Deployment
☐ Monitor logs
☐ Track performance metrics
☐ Test all features
☐ Verify cloud sync
☐ Check student connections
```

## 🔍 Monitoring & Metrics

### Key Metrics to Track
```
Server Metrics
├── Connection count
├── Message throughput
├── Database query time
├── CPU usage
├── Memory usage
└── Disk usage

Application Metrics
├── Poll response time
├── File upload success rate
├── Cloud sync success rate
├── Error rate
└── Crash frequency
```

## 🚀 Production Deployment

### Recommended Setup
```
┌──────────────────────────────────────┐
│     Raspberry Pi (4GB RAM, 64GB)     │
├──────────────────────────────────────┤
│ Ubuntu Server 20.04 LTS              │
│ Node.js 16.x                         │
│ PostgreSQL (instead of SQLite)       │
│ Nginx (reverse proxy)                │
│ PM2 (process manager)                │
│ Certbot (SSL/TLS)                    │
│ Firewall (ufw)                       │
└──────────────────────────────────────┘
```

### Systemd Service
```ini
[Unit]
Description=Classroom Server
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/classroom
ExecStart=/usr/bin/node /home/pi/classroom/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

For more details, see `README.md` and `QUICKSTART.md`
