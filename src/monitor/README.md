# Monitor System

Interactive CRT monitor system that renders HTML frames onto a 3D monitor mesh in the scene.

## Architecture

### Components

1. **MonitorController.js** - Main controller class
   - Manages frame loading and rendering
   - Handles keyboard input
   - Updates dynamic texture

2. **frames/** - HTML frame files
   - Individual HTML files for each screen
   - Styled with inline CSS for CRT aesthetic
   - Uses data-transition attributes for navigation

3. **frames-config.json** - Frame configuration
   - Defines all available frames
   - Maps frame IDs to HTML files
   - Specifies valid transitions between frames

## How It Works

### HTML to Texture Pipeline

1. HTML file loaded into hidden iframe
2. html2canvas renders iframe content to canvas
3. Canvas drawn to Babylon.js DynamicTexture
4. Texture applied to monitor mesh as emissive material

### Keyboard Navigation

- **Arrow Keys / WASD**: Navigate between interactive elements
- **Enter**: Activate selected element (transition or input)
- **M Key**: Toggle monitor active/inactive
- **Escape**: Exit input mode
- **Type**: When in input field, characters are captured

### Frame Structure

Each HTML frame should include:
- Inline CSS for styling (no external stylesheets)
- `.selected` class for highlighting active elements
- `data-transition="frame-id"` attribute for navigation buttons
- Standard input fields for text entry

## Usage

### Activating the Monitor

```javascript
// Press M key to activate/deactivate
// When active, keyboard input is captured for monitor interaction
```

### Adding New Frames

1. Create HTML file in `src/monitor/frames/`
2. Add entry to `frames-config.json`:
```json
{
  "new-frame": {
    "id": "new-frame",
    "file": "new-frame.html",
    "name": "New Frame",
    "transitions": ["other-frame-id"]
  }
}
```
3. Add transition links in other frames:
```html
<button data-transition="new-frame">Go to New Frame</button>
```

### Frame Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 20px;
      background: #0a0a0a;
      color: #00ff00;
      font-family: 'Courier New', monospace;
    }
    .selected {
      background: #00ff00;
      color: #0a0a0a;
    }
  </style>
</head>
<body>
  <div class="title">Frame Title</div>
  <button data-transition="other-frame">Navigate</button>
</body>
</html>
```

## Configuration

### Texture Settings

```javascript
this.textureWidth = 1024;  // Texture resolution
this.textureHeight = 768;
this.refreshRate = 30;     // FPS for texture updates
```

### Monitor Mesh

The controller looks for a mesh named `monitor_screen` in the scene. If not found, it creates a test plane.

To use with your own monitor model:
1. Name the screen mesh `monitor_screen` in your 3D software
2. Export as part of stage.glb
3. Controller will automatically find and apply texture

## API

### MonitorController Methods

```javascript
// Initialize system
await monitorController.initialize();

// Activate/deactivate keyboard input
monitorController.activate();
monitorController.deactivate();

// Load specific frame
await monitorController.loadFrame('frame-id');

// Transition to frame (validates against config)
await monitorController.transitionToFrame('frame-id');

// Update (call in render loop)
monitorController.update();

// Cleanup
monitorController.dispose();
```

## Performance

- HTML rendering is throttled to 30 FPS by default
- Only re-renders on input or navigation
- Uses offscreen rendering (no visible iframe)
- Texture size: 1024x768 (configurable)

## Future Enhancements

- [ ] Frame transition animations (fade, slide)
- [ ] Sound effects for navigation
- [ ] Save/load frame state
- [ ] Multiple monitor support
- [ ] Custom cursor rendering
- [ ] Scanline/CRT shader effects
- [ ] Frame history (back button)
- [ ] Mouse support (raycasting)

## Troubleshooting

**Monitor not visible:**
- Check if monitor_screen mesh exists in scene
- Verify material is applied correctly
- Check console for initialization errors

**HTML not rendering:**
- Ensure html2canvas is loaded (check index.html)
- Check browser console for CORS errors
- Verify HTML file paths are correct

**Keyboard not working:**
- Press M to activate monitor
- Check if another system is capturing input
- Verify isActive flag in console

**Transitions not working:**
- Check frames-config.json for valid transitions
- Verify data-transition attributes match frame IDs
- Check console for validation errors
