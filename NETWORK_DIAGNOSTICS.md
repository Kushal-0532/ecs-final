# 🔍 Network Diagnostics - Ethernet Connection Issue

## Problem
- **Server**: Running on Raspberry Pi (connected via Ethernet)
- **Teacher App**: Running on laptop (connected via Ethernet)  
- **Issue**: Teacher app shows "Connection Error: xhr poll error"
- **Root Cause**: Apps can't reach RPi server (raspberrypi.local not resolving)

## What We Know
✅ Server is running on RPi: `Classroom server running on http://0.0.0.0:3000`  
✅ LED detected: `pwr (/sys/class/leds/ACT)`  
❌ mDNS not working: `ping raspberrypi.local` fails on laptop  
❌ Apps trying to connect to unreachable addresses  

## Solution Steps

### Step 1: Find RPi's IP Address on Ethernet
**On the Raspberry Pi**, run:
```bash
hostname -I
# or
ip addr show | grep inet
```

Look for an IP like:
- `192.168.x.x` (common home network)
- `10.x.x.x` (common corporate/lab network)
- NOT `127.0.0.1` (that's localhost)

### Step 2: Test Connection
From your laptop, try:
```bash
ping <rpi-ip>
curl http://<rpi-ip>:3000/api/health
```

### Step 3: Configure Teacher App
Once you have the RPi's IP, set it as an environment variable:

```bash
cd /home/kushal/ecs-final/teacher-app
REACT_APP_SERVER_URL=http://<rpi-ip>:3000 npm start
```

Or edit `.env` file in teacher-app:
```
REACT_APP_SERVER_URL=http://<rpi-ip>:3000
```

### Step 4: Same for Student App
```bash
cd /home/kushal/ecs-final/student-app
REACT_APP_SERVER_URL=http://<rpi-ip>:3000 npm start
```

---

## Quick Setup on RPi Terminal

Run these commands on the Raspberry Pi to show the IP:

```bash
# Show all network interfaces and their IPs
ip addr show

# Or just the simple version
hostname -I

# Test that server is accessible
curl http://localhost:3000/api/health
```

**Then share the output here so I can give you the exact command to run on your laptop!**

