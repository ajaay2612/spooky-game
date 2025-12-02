# Device Tracking Implementation Guide

## Overview
This guide explains how to integrate device completion tracking with the conversation system in boot-sequence.html.

## Step 1: Add Device Tracker Script

Add this at the beginning of the `<script>` section in boot-sequence.html:

```javascript
// Device Tracking System
window.deviceTracker = {
    devices: {
        equalizer_game: false,
        military_radio: false,
        power_source: false
    },
    isPowerAvailable: false,
    
    completeDevice(deviceName) {
        if (this.devices.hasOwnProperty(deviceName)) {
            console.log(`Device completed: ${deviceName}`);
            this.devices[deviceName] = true;
            
            if (deviceName === 'power_source') {
                this.isPowerAvailable = true;
                // Hide frame6 and show next frame
                const frame6 = document.querySelector('.mainexe-frame6');
                if (frame6) {
                    frame6.classList.add('hidden');
                }
                // Show next frame logic here
            }
            
            // Auto-open chat notification popup
            const notificationPopup = document.getElementById('notificationPopup');
            if (notificationPopup) {
                notificationPopup.classList.remove('hidden');
                // Recapture canvas
                if (window.parent) {
                    window.parent.postMessage({ type: 'recaptureCanvas' }, '*');
                }
            }
        }
    },
    
    isDeviceComplete(deviceName) {
        return this.devices[deviceName] === true;
    }
};
```

## Step 2: Modify renderPlayerOptions Function

In the `renderPlayerOptions()` function, add device checking logic:

```javascript
function renderPlayerOptions() {
    console.log('=== renderPlayerOptions called ===');
    
    if (!window.chatConvo || !window.chatConvo.conversations) {
        console.error('chatConvo not found');
        return;
    }
    
    // Clear options
    const topline = playerOptionsContainer.querySelector('.notification-popup-reply-topline');
    const toplineHTML = topline ? topline.outerHTML : '';
    playerOptionsContainer.innerHTML = toplineHTML;
    
    // Check if conversation is complete
    if (currentConvoIndex >= window.chatConvo.conversations.length) {
        console.log('Conversation complete');
        const endMsg = document.createElement('p');
        endMsg.textContent = '[ END OF TRANSMISSION ]';
        endMsg.style.textAlign = 'center';
        endMsg.style.border = 'none';
        playerOptionsContainer.appendChild(endMsg);
        return;
    }
    
    const currentConvo = window.chatConvo.conversations[currentConvoIndex];
    
    if (!currentConvo) {
        console.error('Current conversation not found:', currentConvoIndex);
        return;
    }
    
    // Check if this conversation requires a device to be complete
    if (currentConvo.eventTrigger && currentConvo.eventTrigger !== 'none') {
        const deviceName = currentConvo.eventTrigger;
        
        // If device is not complete, show waiting message
        if (!window.deviceTracker.isDeviceComplete(deviceName)) {
            console.log(`Waiting for device: ${deviceName}`);
            const waitMsg = document.createElement('p');
            waitMsg.textContent = `[ WAITING FOR ${deviceName.toUpperCase().replace('_', ' ')} ]`;
            waitMsg.style.textAlign = 'center';
            waitMsg.style.border = 'none';
            waitMsg.style.color = '#7FB746';
            playerOptionsContainer.appendChild(waitMsg);
            return;
        }
    }
    
    // If already chosen, don't show options
    if (currentConvo.userResponseIndex !== null) {
        console.log('Option already chosen, not showing options');
        return;
    }
    
    // Render options normally
    currentConvo.playerOptions.forEach((option, index) => {
        const optionElement = document.createElement('p');
        optionElement.textContent = option.short.toUpperCase();
        optionElement.style.cursor = 'pointer';
        
        let isProcessing = false;
        optionElement.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            e.stopImmediatePropagation();
            
            if (isProcessing) return;
            isProcessing = true;
            setTimeout(() => { isProcessing = false; }, 300);
            
            selectOption(index);
        });
        
        playerOptionsContainer.appendChild(optionElement);
    });
}
```

## Step 3: Add Device Completion Listeners

Add these listeners to detect when devices are solved:

```javascript
// Listen for device completion from parent window
window.addEventListener('message', (event) => {
    if (event.data.type === 'deviceComplete') {
        const deviceName = event.data.deviceName;
        window.deviceTracker.completeDevice(deviceName);
        
        // Re-render conversation to show options
        if (window.renderConversation) {
            renderConversation();
        }
    }
});
```

## Step 4: Modify Frame6 Display Logic

Find where mainexe-frame6 is shown and modify it:

```javascript
// Instead of setTimeout to hide frame6, check isPowerAvailable
function checkFrame6Status() {
    const frame6 = document.querySelector('.mainexe-frame6');
    if (frame6 && !frame6.classList.contains('hidden')) {
        if (window.deviceTracker.isPowerAvailable) {
            frame6.classList.add('hidden');
            // Show next frame
            const frame7 = document.querySelector('.mainexe-frame7');
            if (frame7) {
                frame7.classList.remove('hidden');
            }
        } else {
            // Check again in 500ms
            setTimeout(checkFrame6Status, 500);
        }
    }
}

// Call this when frame6 is first shown
checkFrame6Status();
```

## Step 5: Integrate with Main Game

In your main.js or wherever you handle device interactions, call:

```javascript
// When equalizer (Cube18) is solved
window.parent.postMessage({
    type: 'deviceComplete',
    deviceName: 'equalizer_game'
}, '*');

// When military radio code is correct
window.parent.postMessage({
    type: 'deviceComplete',
    deviceName: 'military_radio'
}, '*');

// When power source (Base_Low_Material_0) all lights are up
window.parent.postMessage({
    type: 'deviceComplete',
    deviceName: 'power_source'
}, '*');
```

## Device Detection Logic

### Equalizer Game (Cube18_StaticMeshComponent0)
Check when all 10 levers result in green stacks. You'll need to add logic in your lever interaction code to check if the pattern is correct.

### Military Radio (SM_Radio4.001_primitive0)
Check when the input code matches the required code. Add validation in your radio button handler.

### Power Source (Base_Low_Material_0)
Check when all 5 knobs are in the correct position and all lights are lit. Add validation in your knob rotation handler.

## Testing

1. Test each device completion individually
2. Verify chat auto-opens when device completes
3. Verify player options are blocked until device completes
4. Verify frame6 stays visible until power_source completes
5. Test conversation flow with all devices

