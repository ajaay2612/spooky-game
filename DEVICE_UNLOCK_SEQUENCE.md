# Device Unlock Sequence Implementation

## Overview
Implemented a progressive device unlock system where devices become interactable only when the player reaches specific points in the story.

## Unlock Sequence

1. **Cassette Player** (`cassette`) - Always unlocked at start
2. **Monitor** (`monitor`) - Unlocked when cassette audio starts playing
3. **Equalizer** (`equalizer_game`) - Unlocked when chat reaches `equalizer_game` event trigger
4. **Military Radio** (`military_radio`) - Unlocked when chat reaches `military_radio` event trigger
5. **Power Source** (`power_source`) - Unlocked when chat reaches `power_source` event trigger

**Note:** Device names in `deviceUnlockState` must exactly match the `eventTrigger` values in boot-sequence.html conversations.

## Implementation Details

### MachineInteractions.js

**Added device unlock state tracking:**
```javascript
this.deviceUnlockState = {
  cassette: true,          // Always unlocked at start
  monitor: false,          // Unlocked after cassette plays audio
  equalizer_game: false,   // Unlocked when chat reaches equalizer_game
  military_radio: false,   // Unlocked when chat reaches military_radio
  power_source: false      // Unlocked when chat reaches power_source
};
```

**Added unlock methods:**
- `unlockDevice(deviceName)` - Unlocks a specific device
- `isDeviceUnlocked(deviceName)` - Checks if device is unlocked
- `getDeviceNameFromButtonId(buttonId)` - Maps button/dial/lever IDs to device names

**Added unlock checks to interactions:**
- Button clicks check unlock state before allowing press
- Dial dragging checks unlock state before allowing rotation
- Lever dragging checks unlock state before allowing movement

**Monitor unlock trigger:**
- When cassette audio starts playing, sends unlock message for monitor device

### boot-sequence.html

**Added unlock logic in selectOption():**
- When player selects a response, checks if next conversation has an eventTrigger
- If next conversation requires a device (equalizer_game, military_radio, power_source), sends unlock message to parent window

### main.js

**Added message handler:**
- Listens for `unlockDevice` messages from monitor iframe
- Forwards unlock requests to MachineInteractions instance

### InteractionSystem.js

**Added visual unlock checks:**
- `getDeviceNameFromMesh(mesh)` - Maps mesh names to device names
- `isDeviceUnlocked(deviceName)` - Checks unlock state via global machineInteractions
- Modified `setFocusedObject()` to check unlock state before showing interaction prompt
- Locked devices will not show green crosshair or "Press [F] to Interact" prompt

## Message Flow

1. **Cassette → Monitor:**
   - Cassette audio plays → MachineInteractions sends unlock message → Monitor becomes interactable

2. **Chat → Devices:**
   - Player selects chat option → boot-sequence.html checks next conversation's eventTrigger
   - If eventTrigger is a device name → sends unlock message to parent
   - Parent forwards to MachineInteractions → Device becomes interactable

## Visual Feedback

**Locked devices:**
- No green crosshair highlight when looking at them
- No "Press [F] to Interact" prompt
- Cannot be clicked or interacted with
- Completely invisible to the interaction system

**Unlocked devices:**
- Green crosshair highlight when looking at them
- "Press [F] to Interact" prompt appears
- Can be clicked and interacted with normally

## Testing

To test the sequence:
1. Start game - only cassette should show interaction prompt
2. Look at other devices - no green crosshair or prompt should appear
3. Press cassette play button - monitor should unlock and show prompt when looked at
4. Interact with monitor chat until equalizer_game trigger - equalizer should unlock
5. Continue chat until military_radio trigger - radio should unlock
6. Continue chat until power_source trigger - power source should unlock

## Console Messages

Look for these console messages to verify unlock sequence:
- `🔓 Device unlocked: [deviceName]`
- `🔒 Device locked: [deviceName]` (when trying to interact with locked device)
- `🔓 Unlocking device for next conversation: [deviceName]`
- `🔓 Main window received unlock request for: [deviceName]`
