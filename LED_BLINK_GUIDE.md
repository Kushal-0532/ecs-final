# 💡 LED Blink Feature - Classroom Server

## Overview

The classroom server now includes **LED indicator functionality** that blinks on the Raspberry Pi whenever classroom actions occur. This provides visual feedback for important events happening in the classroom system.

## LED Status Mapping

The LED uses different blink patterns to indicate different actions:

| Action | Blink Pattern | Description |
|--------|---------------|-------------|
| **Student Joins** | 1x Quick Blink | Fast on/off (100ms each) - 1 student connected |
| **Poll Created** | 2x Quick Blinks | Double quick blink - Teacher created a poll |
| **Poll Response Received** | 1x Quick Blink | Fast on/off - Student submitted poll answer |
| **Transcription Added** | 1x Quick Blink | Fast on/off - Text added to class notes |
| **Class Started** | 3x Slow Blinks | Slow on/off (500ms each) - Class session initiated |
| **Class Ended** | 3x Slow Blinks | Slow on/off (500ms each) - Class session terminated |

## How It Works

### Hardware Setup

The system uses **built-in Raspberry Pi LEDs** (no external components needed), controlled via the `/sys/class/leds/` virtual filesystem:

- **RPi 4/5**: Activity LED (`/sys/class/leds/activity` or `led0`)
- **Older RPi**: Red (`/sys/class/leds/led0`) or Green (`/sys/class/leds/led1`)

The code **automatically detects** which LED is available on your device.

### Software Implementation

#### Files Created/Modified:

1. **`server/gpio.js`** (NEW)
   - LED controller module
   - Handles initialization, blinking, and cleanup
   - Safe on non-Raspberry Pi machines (gracefully logs and continues)

2. **`server/server.js`** (MODIFIED)
   - Imports LED functions: `initLED()`, `quickBlink()`, `slowBlink()`, `doubleBlink()`, `cleanup()`
   - Calls appropriate blink function on each action
   - Initializes LED on startup
   - Cleans up on shutdown

## Installation & Usage

### On Raspberry Pi

```bash
cd /home/kushal/ecs-final/server
npm install
npm start
```

The server will automatically:
1. ✅ Detect available built-in LED
2. ✅ Initialize it on startup
3. ✅ Blink on each classroom action
4. ✅ Clean up on exit

**Console Output Example:**
```
✓ LED initialized: activity (/sys/class/leds/activity)
💡 [LED] Class started: Advanced Physics - 3x blink (500ms on, 500ms off)
💡 [LED] Student joined: Alice Chen - 1x blink (100ms on, 100ms off)
💡 [LED] Poll created: What is the capital of France? - 2x blink (150ms on, 100ms off)
```

### On Development Machine (Non-RPi)

The code is **safe to run on any machine** (Windows, Mac, Linux without RPi):

```bash
cd /home/kushal/ecs-final/server
npm install
npm start
```

**Console Output Example:**
```
⚠ No LED detected. Running in simulation mode. (This is normal on non-RPi machines)
📍 [LED] Class started: Advanced Physics (no hardware)
📍 [LED] Student joined: Alice Chen (no hardware)
📍 [LED] Poll created: What is the capital of France? (no hardware)
```

The server functions **identically** - it just logs LED events instead of actually blinking them.

## Blink Timing Details

```javascript
// Quick Blink (fast feedback)
// - 100ms ON + 100ms OFF = 200ms per blink
// - Used for: student joins, poll responses, transcriptions

// Double Blink (special event)
// - 150ms ON + 100ms OFF × 2 = 500ms total
// - Used for: poll creation (emphasizes teacher action)

// Slow Blink (important session event)
// - 500ms ON + 500ms OFF = 1000ms per blink × 3 = 3000ms total
// - Used for: class start/end (emphasizes session lifecycle)
```

## Technical Details

### LED Initialization

```javascript
// Tries each built-in LED path in order:
// 1. /sys/class/leds/led0 (Red LED, older RPi)
// 2. /sys/class/leds/led1 (Green LED, older RPi)
// 3. /sys/class/leds/ACT (Activity LED, RPi 4+)
// 4. /sys/class/leds/activity (Activity LED, alternative)

// Uses first available LED found
```

### Blink Implementation

```javascript
// Each blink writes to the brightness file:
fs.writeFileSync(path.join(ledPath, 'brightness'), '1');  // Turn ON
await sleep(onDuration);
fs.writeFileSync(path.join(ledPath, 'brightness'), '0');  // Turn OFF
await sleep(offDuration);
```

### Error Handling

- ✅ Gracefully handles missing `/sys/class/leds/` on non-RPi systems
- ✅ Logs warnings but doesn't crash if LED write fails
- ✅ Automatically cleans up and turns LED off on server shutdown

## Troubleshooting

### LED Not Blinking on Raspberry Pi

1. **Check if LED path exists:**
   ```bash
   ls -la /sys/class/leds/
   ```
   You should see `led0`, `led1`, `ACT`, or `activity`.

2. **Check permissions** (you may need sudo):
   ```bash
   sudo npm start
   # or
   sudo node server.js
   ```

3. **Verify brightness file:**
   ```bash
   cat /sys/class/leds/led0/brightness  # Should output 0 or 1
   ```

4. **Manually test LED:**
   ```bash
   # Turn ON
   echo 1 | sudo tee /sys/class/leds/led0/brightness
   # Turn OFF
   echo 0 | sudo tee /sys/class/leds/led0/brightness
   ```

### Console Logs for Debugging

The system logs all LED events:
```bash
# See console output during server run
npm start  # or npm run dev

# Look for lines with 💡 [LED] or ⚠
```

## Performance Impact

- **Minimal overhead**: LED operations are non-blocking asynchronous calls
- **No blocking**: Blink operations run parallel to server operations
- **Safe**: All errors are caught and logged without affecting server

## Future Enhancements

Possible extensions to consider:

- [ ] Different LED colors per action (RGB LED support)
- [ ] Configurable blink patterns via environment variables
- [ ] LED intensity control
- [ ] Activity log with LED event timestamps
- [ ] Integration with external GPIO devices (buzzers, relays)

## File Structure

```
server/
├── gpio.js          # ← LED controller (NEW)
├── server.js        # ← Modified: added LED blinks on events
├── service.js       # (unchanged)
├── package.json     # (unchanged - uses built-in leds, no new deps)
└── db/
    └── classroom.db # (unchanged)
```

## References

- [Raspberry Pi GPIO Documentation](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html)
- [Linux LED Subsystem](https://www.kernel.org/doc/html/latest/leds/leds-class.html)
- [Node.js fs Module](https://nodejs.org/api/fs.html)

---

**Last Updated:** November 2025  
**Compatible with:** Raspberry Pi 3B+, 4, 5 | Any system with Node.js (graceful fallback)
