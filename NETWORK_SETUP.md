# Network Setup - Raspberry Pi Server + Laptop Apps

## Overview
- **Raspberry Pi**: Runs the server (backend)
- **Laptop**: Runs teacher and student apps (frontend)
- **Connection**: Ethernet cable between Pi and laptop (or same WiFi network)

---

## 🔌 Setup Steps

### Step 1: Find Raspberry Pi IP Address

**On Raspberry Pi:**
```bash
hostname -I
```

Example output: `192.168.1.100`

**Remember this IP** - you'll need it for the next steps!

---

### Step 2: Start Server on Raspberry Pi

**On Raspberry Pi terminal:**

```bash
cd ~/ecs-final/server
npm install
npm start
```

**Expected output:**
```
Server running on http://0.0.0.0:3000
Socket.io server listening on port 3000
Database initialized successfully
```

**The server is now running and waiting for connections!**

---

### Step 3: Configure & Start Apps on Your Laptop

#### Option A: Using Environment Variables (Recommended)

**Create `.env.local` in teacher-app:**
```bash
cd ~/ecs-final/teacher-app
echo "REACT_APP_SERVER_URL=http://192.168.1.100:3000" > .env.local
```

**Create `.env.local` in student-app:**
```bash
cd ~/ecs-final/student-app
echo "REACT_APP_SERVER_URL=http://192.168.1.100:3000" > .env.local
```

Then start both apps normally:
```bash
npm start
```

---

#### Option B: Manual Code Update

**Edit teacher-app/src/App.js** (line 20):
```javascript
// CHANGE THIS:
const newSocket = io('http://localhost:3000', {

// TO THIS (replace 192.168.1.100 with your Pi's IP):
const newSocket = io('http://192.168.1.100:3000', {
```

**Edit student-app/src/App.js** (line 17):
```javascript
// CHANGE THIS:
const newSocket = io(serverUrl || 'http://localhost:3000', {

// TO THIS:
const newSocket = io(serverUrl || 'http://192.168.1.100:3000', {
```

---

### Step 4: Start Apps on Your Laptop

**Terminal 1 - Teacher App:**
```bash
cd ~/ecs-final/teacher-app
npm install
npm start
```

**Terminal 2 - Student App:**
```bash
cd ~/ecs-final/student-app
npm install
npm start
```

---

## ✅ Test Connection

1. **Open Teacher App**: Browser should open (check console for connection status)
2. **Open Student App**: Second browser window/tab
3. **Start Class**: Click "Start Class" in teacher app
4. **Join Class**: In student app, enter:
   - Name: "Test Student"
   - Student ID: "STU001"
   - **Server URL**: `192.168.1.100:3000` (or leave blank if you configured .env.local)
5. **Verify**: You should see the student connected in teacher app

---

## 🔍 Troubleshooting

### "Cannot connect to server"

**Check 1: Server is running on Pi**
```bash
# On Raspberry Pi
ps aux | grep "npm start"
```
Should see Node.js process running.

**Check 2: Firewall**
```bash
# On Raspberry Pi
sudo ufw status
```
If enabled, allow port 3000:
```bash
sudo ufw allow 3000
```

**Check 3: Correct IP in app**
Make sure you're using the exact IP from `hostname -I`:
- Example: `192.168.1.100` NOT `localhost` or `127.0.0.1`

**Check 4: Same network**
Verify laptop and Pi are on same network:
```bash
# On laptop, ping the Pi
ping 192.168.1.100
```
Should get responses.

---

### "Address already in use"

**If port 3000 is taken on Pi:**
```bash
# Edit server/.env
PORT=3001
```
Then update apps to use `192.168.1.100:3001`

---

### Apps work but no real-time updates

**Check Socket.io connection:**
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. You should see: `Socket connected: [socket-id]`
4. If not, check network tab for failed WebSocket connection

---

## 🎯 Expected Network Diagram

```
┌─────────────────────────────────────────────────────┐
│ Your Laptop                                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Browser 1: Teacher App                          │ │
│ │ http://localhost:3000                           │ │
│ └──────────────────┬──────────────────────────────┘ │
│                    │                                 │
│ ┌─────────────────┼──────────────────────────────┐ │
│ │ Browser 2: Student App                         │ │
│ │ http://localhost:3002                          │ │
│ └──────────────────┬──────────────────────────────┘ │
└─────────────────────┼──────────────────────────────┘
                      │ WebSocket over Ethernet
                      │ 192.168.1.100:3000
                      ↓
┌─────────────────────────────────────────────────────┐
│ Raspberry Pi                                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Node.js Server                                  │ │
│ │ http://192.168.1.100:3000                       │ │
│ ├─────────────────────────────────────────────────┤ │
│ │ SQLite Database: classroom.db                   │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 💡 Pro Tips

### Tip 1: Make Raspberry Pi IP Static
So you don't have to look it up every time:
```bash
# On Raspberry Pi, edit /etc/dhcpcd.conf
sudo nano /etc/dhcpcd.conf

# Add these lines at the end:
interface eth0
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=1.1.1.1 8.8.8.8
```

Then reboot:
```bash
sudo reboot
```

### Tip 2: Auto-start Server on Pi Boot
Create systemd service (see DEPLOYMENT.md for details):
```bash
sudo nano /etc/systemd/system/classroom.service
```

### Tip 3: Use Hostname Instead of IP
On most networks, you can use:
```
http://raspberrypi:3000
```
Instead of IP address (if your Pi's hostname is "raspberrypi")

### Tip 4: Keep IPs in a Notes File
Create a file on your laptop:
```
# ~/classroom-setup.txt
Pi IP: 192.168.1.100
Server Port: 3000
Teacher App: http://localhost:3000
Student App: http://localhost:3002
```

---

## 🚀 Quick Reference

| Component | Location | Port | URL |
|-----------|----------|------|-----|
| Server | Raspberry Pi | 3000 | `http://192.168.1.100:3000` |
| Teacher App | Your Laptop | 3000 (dev) | `http://localhost:3000` |
| Student App | Your Laptop | 3002 (dev) | `http://localhost:3002` |

---

## 📋 Pre-Launch Checklist

- [ ] Raspberry Pi and laptop connected via ethernet (or same WiFi)
- [ ] Server running on Pi with `npm start`
- [ ] Got Pi's IP address from `hostname -I`
- [ ] Updated apps with correct Pi IP
- [ ] Teacher app starts and connects
- [ ] Student app starts and can join
- [ ] Real-time updates working (polls sync instantly)
- [ ] Can see students in teacher dashboard

---

## 🎓 Ready to Teach!

Once everything is working:
1. **Start class** on teacher app
2. **Students join** using server URL
3. **Share content** (PPT, polls, notes)
4. **End class** and data syncs

Enjoy your classroom management system! 🚀

---

**Need help?** Check the main documentation files:
- `DEPLOYMENT.md` - Production setup
- `ARCHITECTURE.md` - How the system works
- `README.md` - Complete reference
