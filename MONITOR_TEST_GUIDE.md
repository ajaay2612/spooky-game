# Monitor System Test Guide

Quick guide to test the new interactive CRT monitor system.

## Setup

1. Start the dev server:
```bash
npm run dev
```

2. Open browser to `http://localhost:5173`

## Testing Steps

### 1. Initial Load
- [ ] Monitor plane should appear in scene (if no monitor_screen mesh exists)
- [ ] Monitor should display "Main Menu" frame with green text on black background
- [ ] Check console for "MonitorController initialized successfully"

### 2. Activate Monitor
- [ ] Press **M** key to activate monitor
- [ ] Console should show: "Monitor activated - use Arrow keys/WASD to navigate..."
- [ ] First menu item should be highlighted (green background)

### 3. Navigation
- [ ] Press **Arrow Down** or **S** - selection moves to next item
- [ ] Press **Arrow Up** or **W** - selection moves to previous item
- [ ] Selection should wrap around (bottom to top, top to bottom)
- [ ] Highlighted item should have green background with black text

### 4. Frame Transitions
- [ ] With "START GAME" selected, press **Enter**
- [ ] Should transition to "Game Start" frame
- [ ] Should show "ENTER YOUR NAME" with input field
- [ ] Press **Enter** on "BACK TO MENU" button
- [ ] Should return to main menu

### 5. Text Input
- [ ] Navigate to "START GAME" and press Enter
- [ ] Navigate to input field and press Enter
- [ ] Type some text (e.g., "Player1")
- [ ] Text should appear in the input field on monitor
- [ ] Press **Backspace** - last character should be removed
- [ ] Press **Escape** - exit input mode

### 6. Credits Screen
- [ ] From main menu, navigate to "CREDITS"
- [ ] Press **Enter**
- [ ] Should show credits screen
- [ ] Press **Enter** on "BACK TO MENU"
- [ ] Should return to main menu

### 7. Deactivate Monitor
- [ ] Press **M** key again
- [ ] Console should show: "Monitor deactivated - press M to reactivate"
- [ ] Keyboard input should no longer affect monitor
- [ ] Camera controls should work normally

## Expected Behavior

### Visual
- Monitor displays crisp HTML content
- Green text on black background (CRT aesthetic)
- Selected elements have inverted colors (green bg, black text)
- Emissive glow effect on monitor surface

### Performance
- Smooth 60 FPS (monitor updates at 30 FPS)
- No lag when typing or navigating
- Instant frame transitions

### Console Output
```
MonitorController initialized
Frames config loaded: {activeFrame: "main-menu", frames: {...}}
Rendering infrastructure setup complete
Monitor mesh setup complete
Frame loaded: main-menu
Found 2 interactive elements
Keyboard input setup complete
MonitorController initialized successfully
```

## Troubleshooting

### Monitor not visible
1. Check console for errors
2. Verify html2canvas loaded: `typeof html2canvas` in console
3. Check if monitor_screen mesh exists: `scene.getMeshByName('monitor_screen')`

### HTML not rendering
1. Open browser DevTools → Network tab
2. Check if HTML files are loading (200 status)
3. Verify paths: `/src/monitor/frames/*.html`
4. Check for CORS errors

### Keyboard not working
1. Ensure monitor is activated (press M)
2. Check `monitorController.isActive` in console
3. Verify no other input handlers are blocking

### Transitions not working
1. Check frames-config.json for valid transitions
2. Verify data-transition attributes in HTML
3. Check console for validation warnings

## Debug Commands

Open browser console and try:

```javascript
// Check monitor status
monitorController.isActive

// Manually activate
monitorController.activate()

// Load specific frame
await monitorController.loadFrame('credits')

// Check current frame
monitorController.currentFrame

// Check config
monitorController.config

// Force re-render
await monitorController.renderFrameToTexture()
```

## Known Limitations

1. **First render delay**: html2canvas takes ~100ms on first render
2. **No mouse support**: Keyboard only (by design)
3. **No animations**: Frame transitions are instant
4. **Single monitor**: Only one monitor supported currently
5. **Fixed resolution**: 1024x768 texture (configurable)

## Next Steps

After basic testing works:
1. Replace test plane with actual monitor model from stage.glb
2. Add more frames for game content
3. Implement frame transition animations
4. Add sound effects for navigation
5. Create save/load system for input data
6. Add CRT shader effects (scanlines, chromatic aberration)

## Success Criteria

✅ Monitor displays HTML content correctly
✅ Keyboard navigation works smoothly
✅ Frame transitions are validated and work
✅ Text input captures and displays correctly
✅ M key toggles monitor on/off
✅ No console errors
✅ Performance stays at 60 FPS
