# 🚀 Network Connection Fixed - Quick Start Guide

## Network Configuration

✅ **RPi Server IP**: `10.42.0.185:3000`  
✅ **Connected via**: Ethernet (direct connection)  
✅ **Teacher App**: Updated to auto-connect to RPi IP  
✅ **Student App**: Updated to auto-connect to RPi IP  

## What Was Changed

Both apps now have the RPi Ethernet IP (`10.42.0.185`) as the **Priority 1** connection attempt:

1. **Teacher App** (`teacher-app/src/App.js`):
   - Now tries `10.42.0.185:3000` first
   - Falls back to `.local`, localhost, and common IPs
   - Default fallback is `10.42.0.185:3000`

2. **Student App** (`student-app/src/App.js`):
   - Now tries `10.42.0.185:3000` first
   - Falls back to `.local`, localhost, and common IPs
   - Default fallback is `10.42.0.185:3000`

## Testing Setup

### Terminal 1 - Verify Server Running on RPi
```bash
# On Raspberry Pi
cd ~/Documents/ecs-final/server
npm start
# Should show: Classroom server running on http://0.0.0.0:3000
```

### Terminal 2 - Start Teacher App (on your laptop)
```bash
cd /home/kushal/ecs-final/teacher-app
npm start
```
✅ Should connect automatically to `10.42.0.185:3000`  
✅ Browser console should show: `✅ Found server at 10.42.0.185:3000`  
✅ Header should show: `🟢 Connected`

### Terminal 3 - Start Student App (on your laptop or another device)
```bash
cd /home/kushal/ecs-final/student-app
npm start
```
✅ Should connect automatically to `10.42.0.185:3000`

## Full Workflow Test

1. **Teacher App**:
   - Browser opens on `http://localhost:3000`
   - Wait for `🟢 Connected` indicator
   - Click "Start Class"
   - Enter class name (e.g., "Math 101")

2. **Student App** (Browser 2 or another device):
   - Browser opens on `http://localhost:3000`
   - Enter student name (e.g., "Alice")
   - Enter student ID (e.g., "student-001")
   - Click "Join Class"
   - ✅ Should see StudentDashboard (not waiting screen anymore)
   - ✅ Teacher app should show "Alice" in student list

3. **LED Feedback** (on RPi):
   - When student joins: **1x quick blink** (100ms on/off)
   - When teacher starts class: **3x slow blinks** (500ms on/off)
   - When poll created: **2x quick blinks** (double pattern)

4. **Test Poll**:
   - Teacher: Click "Polls" tab
   - Enter question: "What is 2+2?"
   - Add options: "3", "4", "5"
   - Click "Send Poll"
   - Student: Select answer
   - ✅ LED blinks when response received

5. **Test Transcription**:
   - Teacher: Click "Transcription" tab
   - Type: "Today we learned about binary numbers"
   - Click "Send Transcription"
   - Student: Should see transcription on dashboard

6. **End Class**:
   - Teacher: Click "End Class"
   - ✅ LED blinks 3 slow times
   - ✅ Both apps show class ended

## Troubleshooting

### "Connection Error: xhr poll error"
- **Fix**: Teacher app can't reach RPi
- **Action**: Verify RPi server is running (`npm start` in server directory)
- **Check**: `ping 10.42.0.185` from your laptop
- **Console**: Check browser F12 → Console for connection logs

### Student sees "Waiting for teacher to start class"
- **Fix**: Missing `student-join` emit (already fixed in code)
- **Action**: Reload student app
- **Console**: Should see `📨 Sent student-join: [name]`

### LED not blinking
- **Fix**: Check RPi has LED detected
- **Action**: Look for LED initialization in server logs
- **Expected**: `💡 LED initialized: pwr (/sys/class/leds/ACT)`

### "Cannot connect to 10.42.0.185"
- **Cause**: Ethernet cable disconnected or wrong IP
- **Fix on RPi**: Run `hostname -I` to verify IP
- **Fix on Laptop**: Run `ping 10.42.0.185` to test connectivity

## Environment Variables (Optional)

You can override the server URL with environment variable:

```bash
# Teacher App
REACT_APP_SERVER_URL=http://10.42.0.185:3000 npm start

# Student App
REACT_APP_SERVER_URL=http://10.42.0.185:3000 npm start
```

## File Changes Summary

```
✅ teacher-app/src/App.js
   - Updated detectServerUrl() to try 10.42.0.185 first (Priority 2)
   - Updated fallback to 10.42.0.185:3000 instead of raspberrypi.local

✅ student-app/src/App.js
   - Added 10.42.0.185:3000 to candidates list (Priority 1)
   - Updated default serverUrl from raspberrypi.local to 10.42.0.185
   - Updated fallback to 10.42.0.185:3000
```

## All Systems Status ✅

- ✅ Server running on RPi at `10.42.0.185:3000`
- ✅ LED GPIO controller initialized (ACT LED detected)
- ✅ Teacher app configured for direct connection
- ✅ Student app configured for direct connection
- ✅ Auto-detection with IP priority enabled
- ✅ Fallback mechanisms in place

**Ready to test!** 🚀
