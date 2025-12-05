# Cassette Player Network Loading Fix

## Problem
On some PCs with slow network connections, the cassette player mesh loads after the InteractionSystem has finished scanning for interactable objects, making it impossible to interact with the cassette player.

## Root Cause
The InteractionSystem only scanned for meshes at:
- Initial load (0ms)
- 1 second
- 3 seconds

If the cassette player mesh loaded after 3 seconds due to network latency, it was never registered as interactable.

## Solution

### 1. Extended Retry Schedule
Added more retry attempts to catch late-loading meshes:
- 1s, 2s, 3s, 5s, 7s, 10s

### 2. Continuous Mesh Monitoring
Implemented a monitoring system that checks for new meshes every 2 seconds for the first 30 seconds:
- `checkForNewMeshes()` - Detects newly loaded meshes and adds them to interactables
- Automatically stops after 30 seconds to avoid performance impact

### 3. Enhanced Button Registration
In `MachineInteractions.js`:
- Sets parent meshes as pickable (for mesh hierarchies)
- Ensures meshes are visible and enabled
- Added `ensureCassettePlayerPickable()` with multiple retry attempts
- Added diagnostic tool: `window.machineInteractions.diagnoseCassettePlayer()`

## Testing

### On Slow Network
1. Throttle network in DevTools (Slow 3G)
2. Load the game
3. Wait for cassette player to appear
4. Verify green crosshair appears when looking at it
5. Press F to interact

### Diagnostic Commands
```javascript
// Check cassette player status
window.machineInteractions.diagnoseCassettePlayer()

// Check registered interactables
console.log(window.interactionSystem.interactableObjects)
```

## Files Modified
- `public/src/story/InteractionSystem.js`
  - Extended retry schedule (6 attempts over 10 seconds)
  - Added `checkForNewMeshes()` method
  - Added continuous monitoring interval
  - Added cleanup in dispose()

- `public/src/story/MachineInteractions.js`
  - Enhanced `registerButton()` to set parent pickability
  - Added `ensureCassettePlayerPickable()` with 5 retry attempts
  - Added `diagnoseCassettePlayer()` diagnostic tool

## Performance Impact
- Minimal: Monitoring runs every 2 seconds for only 30 seconds
- Automatically stops after 30 seconds
- Only checks specific mesh names (no full scene scan)

## Future Improvements
- Could use Babylon.js `onMeshAddedObservable` for real-time detection
- Could add visual loading indicator for slow connections
