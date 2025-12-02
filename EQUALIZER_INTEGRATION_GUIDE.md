# Equalizer Device Integration Guide

## How to Trigger Device Completion

When the equalizer (Cube18) is solved (all stacks are green), you need to send a message to the monitor iframe:

### From Main Game Code (main.js or wherever you handle lever interactions)

```javascript
// When all 10 levers are in correct position and all stacks are green
function checkEqualizerSolved() {
    // Your logic to check if all stacks are green
    const allStacksGreen = checkAllStacksGreen(); // Implement this
    
    if (allStacksGreen) {
        console.log('Equalizer solved!');
        
        // Find the monitor iframe
        const monitorIframe = document.querySelector('iframe'); // Adjust selector if needed
        
        if (monitorIframe && monitorIframe.contentWindow) {
            // Send completion message to monitor
            monitorIframe.contentWindow.postMessage({
                type: 'deviceComplete',
                deviceName: 'equalizer_game'
            }, '*');
        }
    }
}

// Call this function whenever a lever position changes
// or after each lever interaction
```

### For Testing - Manual Trigger

Open browser console and run:
```javascript
// Find monitor iframe
const iframe = document.querySelector('iframe');
if (iframe) {
    iframe.contentWindow.postMessage({
        type: 'deviceComplete',
        deviceName: 'equalizer_game'
    }, '*');
}
```

Or if you're inside the monitor iframe already:
```javascript
window.deviceTracker.completeDevice('equalizer_game');
```

## Expected Behavior

When device is completed:
1. Chat notification panel auto-opens
2. Reply options become visible
3. Console logs: "Device completed: equalizer_game"
4. Console logs: "Chat auto-opened for device: equalizer_game"

## Other Devices

### Military Radio
```javascript
monitorIframe.contentWindow.postMessage({
    type: 'deviceComplete',
    deviceName: 'military_radio'
}, '*');
```

### Power Source
```javascript
monitorIframe.contentWindow.postMessage({
    type: 'deviceComplete',
    deviceName: 'power_source'
}, '*');
```

## Debugging

Check if device tracker exists:
```javascript
console.log(window.deviceTracker);
```

Check device status:
```javascript
console.log(window.deviceTracker.devices);
```

Manually complete all devices:
```javascript
window.deviceTracker.completeDevice('equalizer_game');
window.deviceTracker.completeDevice('military_radio');
window.deviceTracker.completeDevice('power_source');
```

