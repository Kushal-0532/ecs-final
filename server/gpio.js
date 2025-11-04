import fs from 'fs';
import path from 'path';

/**
 * GPIO LED Controller for Raspberry Pi
 * Uses built-in LEDs controlled via /sys/class/leds/
 * 
 * Safe on non-RPi machines (gracefully skips if LED path doesn't exist)
 */

// Common RPi LED paths
const LED_PATHS = {
  // red: '/sys/class/leds/led0',        // Built-in red LED (older RPis) - DISABLED
  green: '/sys/class/leds/led1',      // Built-in green LED (older RPis)
  pwr: '/sys/class/leds/ACT',         // Activity LED (RPi 4+)
  activity: '/sys/class/leds/activity' // Alternative activity LED path
};

let activeLedPath = null;

/**
 * Initialize LED - detect which LED is available
 */
export function initLED() {
  // Try to find an available LED
  for (const [name, ledPath] of Object.entries(LED_PATHS)) {
    try {
      if (fs.existsSync(ledPath) && fs.existsSync(path.join(ledPath, 'brightness'))) {
        activeLedPath = ledPath;
        console.log(`✓ LED initialized: ${name} (${ledPath})`);
        return true;
      }
    } catch (err) {
      // Continue to next LED
    }
  }
  
  console.log('⚠ No LED detected. Running in simulation mode. (This is normal on non-RPi machines)');
  return false;
}

/**
 * Blink LED with specified pattern
 * @param {number} count - Number of blinks
 * @param {number} onDuration - LED on time in ms (minimum 1000ms)
 * @param {number} offDuration - LED off time in ms
 * @param {string} action - Description of the action (for logging)
 */
export async function blink(count = 1, onDuration = 100, offDuration = 100, action = 'Action') {
  // If no LED detected, log and return
  if (!activeLedPath) {
    console.log(`📍 [LED] ${action} (no hardware)`);
    return;
  }

  try {
    const brightnessPath = path.join(activeLedPath, 'brightness');
    
    // Enforce minimum 1 second (1000ms) on duration
    const minOnDuration = Math.max(onDuration, 1000);
    
    console.log(`💡 [LED] ${action} - ${count}x blink (${minOnDuration}ms on, ${offDuration}ms off)`);

    for (let i = 0; i < count; i++) {
      try {
        // Turn ON
        fs.writeFileSync(brightnessPath, '1');
        await sleep(minOnDuration);

        // Turn OFF
        fs.writeFileSync(brightnessPath, '0');
        await sleep(offDuration);
      } catch (writeErr) {
        // If permission denied, provide helpful guidance
        if (writeErr.code === 'EACCES') {
          console.warn(`⚠️ LED Permission Denied (EACCES). The server needs root/sudo to control LEDs.`);
          console.warn(`   Run: sudo node server.js`);
          console.warn(`   Or configure udev rules: https://github.com/quick2wire/quick2wire-gpio-admin`);
          // Don't retry - exit gracefully
          return;
        }
        throw writeErr;
      }
    }
  } catch (err) {
    console.warn(`⚠ LED blink failed: ${err.message}`);
  }
}

/**
 * Quick blink pattern (fast, single or multiple)
 * Used for: student joins, poll responses, transcriptions
 */
export async function quickBlink(count = 1, action = 'Action') {
  await blink(count, 1000, 500, action);  // 1 second on, 0.5 second off
}

/**
 * Slow blink pattern (slow, multiple)
 * Used for: class start/end
 */
export async function slowBlink(count = 3, action = 'Action') {
  await blink(count, 1000, 1000, action);  // 1 second on/off
}

/**
 * Special pattern for important events
 */
export async function doubleBlink(action = 'Action') {
  await blink(2, 1000, 500, action);  // 1 second on, 0.5 second off between blinks
}

/**
 * Cleanup - turn off LED on exit
 */
export function cleanup() {
  if (activeLedPath) {
    try {
      const brightnessPath = path.join(activeLedPath, 'brightness');
      fs.writeFileSync(brightnessPath, '0');
      console.log('✓ LED cleaned up');
    } catch (err) {
      if (err.code === 'EACCES') {
        console.log('⚠️ LED cleanup: Permission denied (running without root)');
      } else {
        console.warn(`⚠ LED cleanup failed: ${err.message}`);
      }
    }
  }
}

/**
 * Helper: sleep function for async delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
