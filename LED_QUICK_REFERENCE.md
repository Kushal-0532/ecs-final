# 🎯 LED Blink Reference Card

## Quick Status Guide

**Print this or bookmark for quick reference on what each blink means!**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLASSROOM LED STATUS                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  BLINK PATTERN          MEANING              ACTION         │
│  ──────────────         ──────────────       ──────────     │
│                                                              │
│  💡 ▁▁▁▁▁ (1x quick)    Student joined      Attendance     │
│                                                              │
│  💡 ▁▁ ▁▁ (2x quick)    Poll created        Teacher event  │
│                                                              │
│  💡 ▁▁▁▁▁ (1x quick)    Response/Transcript  Student input  │
│                                                              │
│  💡 ▁▁▁▁▁ ▁▁▁▁▁        Class started       Session event  │
│    ▁▁▁▁▁ (3x slow)      Class ended                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Event Mapping

| When This Happens | LED Does This | Timeline |
|---|---|---|
| 👤 Student joins class | 🟢 Blink 1x fast | 200ms total |
| 📝 Teacher creates poll | 🟢 Blink 2x fast | 500ms total |
| ✓ Student answers poll | 🟢 Blink 1x fast | 200ms total |
| 📄 Text added to notes | 🟢 Blink 1x fast | 200ms total |
| ▶️ Class session starts | 🟢 Blink 3x slow | 3000ms total |
| ⏹️ Class session ends | 🟢 Blink 3x slow | 3000ms total |

## GPIO Timing Details

```javascript
// QUICK BLINK (100ms on, 100ms off per pulse)
// Used for: Student joins, poll responses, transcriptions
// Duration: ~100ms ON + 100ms OFF per blink = 200ms per blink
// Count: 1x or 2x
// Total Time: 200-500ms

// Example: Single quick blink
// ░░░░░▓▓▓▓▓░░░░░ = 100ms ON, 100ms OFF = 200ms total


// SLOW BLINK (500ms on, 500ms off per pulse)
// Used for: Class start/end (important session events)
// Duration: 500ms ON + 500ms OFF per blink
// Count: 3x
// Total Time: ~3000ms

// Example: Slow blink (1x)
// ░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░ = 500ms ON, 500ms OFF = 1000ms total


// DOUBLE BLINK (150ms on, 100ms off, 150ms on, 100ms off)
// Used for: Poll creation
// Duration: 150ms ON + 100ms OFF + 150ms ON + 100ms OFF
// Count: 1x pattern (but 2 flashes)
// Total Time: ~500ms

// Example: Double blink
// ░░░▓▓▓░░▓▓▓░░ = 150ms ON, 100ms OFF, 150ms ON, 100ms OFF
```

## Real-World Example

### Morning Classroom Session

```
Time    Event                    LED Status              Console Log
────    ─────────────────────    ──────────────────────  ────────────────────
09:00   Teacher starts class     💡 ▁▁▁ ▁▁▁ ▁▁▁          Class started: Physics 101
                                 (slow 3x)               (3000ms)

09:02   Alice joins              💡 ▁ (quick)             Student joined: Alice
                                                         (200ms)

09:03   Bob joins                💡 ▁ (quick)             Student joined: Bob
                                                         (200ms)

09:05   Teacher creates poll     💡 ▁ ▁ (double)         Poll created: Q1
                                                         (500ms)

09:06   Alice answers            💡 ▁ (quick)             Poll response: Alice → A
                                                         (200ms)

09:06   Bob answers              💡 ▁ (quick)             Poll response: Bob → B
                                                         (200ms)

09:08   Transcription added      💡 ▁ (quick)             Transcription: "Newton..."
                                                         (200ms)

09:50   Teacher ends class       💡 ▁▁▁ ▁▁▁ ▁▁▁          Class ended: Physics 101
                                 (slow 3x)               (3000ms)
```

## Hardware Info

### LED Paths (auto-detected)

**Older Raspberry Pi (RPi 3B, 3B+):**
- Red LED: `/sys/class/leds/led0`
- Green LED: `/sys/class/leds/led1`

**Newer Raspberry Pi (RPi 4, 5):**
- Activity LED: `/sys/class/leds/activity`
- Alternative: `/sys/class/leds/led0`

**The code automatically tries all paths and uses the first available one.**

### Manual LED Test

```bash
# Turn LED ON
echo 1 | sudo tee /sys/class/leds/led0/brightness

# Turn LED OFF
echo 0 | sudo tee /sys/class/leds/led0/brightness

# Quick blink test
for i in {1..5}; do 
  echo 1 | sudo tee /sys/class/leds/led0/brightness
  sleep 0.1
  echo 0 | sudo tee /sys/class/leds/led0/brightness
  sleep 0.1
done
```

## Server Logs

### What You'll See (RPi with LED)

```
$ npm start
✓ LED initialized: activity (/sys/class/leds/activity)
Classroom server running on http://0.0.0.0:3000

[In another terminal: Connect students and create poll]

💡 [LED] Student joined: Alice Chen - 1x blink (100ms on, 100ms off)
💡 [LED] Student joined: Bob Smith - 1x blink (100ms on, 100ms off)
💡 [LED] Poll created: What is photosynthesis? - 2x blink (150ms on, 100ms off)
💡 [LED] Poll response from Alice Chen: B - 1x blink (100ms on, 100ms off)
💡 [LED] Poll response from Bob Smith: D - 1x blink (100ms on, 100ms off)
```

### What You'll See (Dev Machine)

```
$ npm start
⚠ No LED detected. Running in simulation mode. (This is normal on non-RPi machines)
Classroom server running on http://0.0.0.0:3000

[In another terminal: Connect students and create poll]

📍 [LED] Student joined: Alice Chen (no hardware)
📍 [LED] Student joined: Bob Smith (no hardware)
📍 [LED] Poll created: What is photosynthesis? (no hardware)
📍 [LED] Poll response from Alice Chen: B (no hardware)
📍 [LED] Poll response from Bob Smith: D (no hardware)
```

## Emergency Stop

```bash
# Stop LED blinking (turns LED off)
Ctrl + C

# The server will cleanup and turn off the LED automatically
✓ LED cleaned up
```

---

## 📚 Full Documentation

- Detailed setup: [LED_BLINK_GUIDE.md](../LED_BLINK_GUIDE.md)
- Implementation details: [LED_IMPLEMENTATION.md](./LED_IMPLEMENTATION.md)
- Code location: [server/gpio.js](./gpio.js)
