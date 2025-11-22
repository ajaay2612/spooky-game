# Architecture Documentation

## System Overview

Spooky Game is a single-page application built with Babylon.js 3D engine and Vite build tool. The architecture follows a class-based object-oriented design with clear separation of concerns.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Canvas)                     │
├─────────────────────────────────────────────────────────┤
│                    Babylon.js Engine                     │
├──────────────┬──────────────┬──────────────┬────────────┤
│ Camera       │ Scene        │ GUI          │ App State  │
│ Controller   │ Manager      │ Manager      │ Tracker    │
└──────────────┴──────────────┴──────────────┴────────────┘
```

## Core Components

### 1. Application State (`appState`)

Global state object tracking application health and metrics.

```javascript
{
  status: 'active' | 'error',
  errors: Array<ErrorInfo>,
  scene: {
    objectCount: number,
    rendering: boolean,
    fps: number
  },
  startTime: timestamp
}
```

**Responsibilities**:
- Track application lifecycle status
- Collect error information
- Monitor scene metrics
- Provide data for status endpoint

**Update Mechanism**: `window.updateAppStatus(updates)` merges partial updates

### 2. CameraController Class

Manages first-person camera with WASD controls and pointer lock.

**Properties**:
- `scene`: Reference to Babylon.js scene
- `canvas`: HTML canvas element
- `camera`: UniversalCamera instance
- `moveSpeed`: Movement speed (0.5 units/frame)

**Methods**:
- `setupCamera()`: Creates and configures UniversalCamera
- `setupPointerLock()`: Enables pointer lock on canvas click
- `getCamera()`: Returns camera instance

**Camera Configuration**:
- Position: (0, 1.6, -5) - eye level at 1.6m
- Speed: 0.5 units per frame
- Angular sensitivity: 2000
- Key bindings: W(87), A(65), S(83), D(68)

### 3. SceneManager Class

Handles scene setup, environment creation, lighting, and object management.

**Properties**:
- `scene`: Babylon.js scene reference
- `objects`: Array of user-created objects
- `selectedObject`: Currently selected mesh

**Methods**:
- `setupRoom()`: Creates floor, walls, ceiling
- `setupLights()`: Configures hemispheric and point lights
- `addPlaceholderObjects()`: Adds initial objects
- `addBox(position)`: Creates new box mesh
- `addSphere(position)`: Creates new sphere mesh
- `selectObject(mesh)`: Highlights selected object
- `getSelectedObject()`: Returns current selection
- `getObjects()`: Returns all user objects

**Room Specifications**:
- Dimensions: 20x20 units, 5 units height
- Floor: Dark brown (0.15, 0.12, 0.1)
- Walls: Dark greenish-gray (0.2, 0.25, 0.2)
- Ceiling: Almost black (0.1, 0.1, 0.12)

**Lighting System**:
- Hemispheric Light: Intensity 0.15, dim ambient
- Point Light: Intensity 0.3 (flickering), sickly yellow-orange
- Flicker Animation: Smooth interpolation every 15 frames

### 4. GUIManager Class

Creates and manages the developer GUI panel using Babylon.js GUI.

**Properties**:
- `scene`: Scene reference
- `sceneManager`: SceneManager reference
- `advancedTexture`: FullscreenUI texture
- `mainPanel`: Right-side StackPanel
- `propertyPanel`: Dynamic property editor
- `isVisible`: GUI visibility state

**Methods**:
- `setupGUI()`: Creates main panel and buttons
- `createButton(text, onClick)`: Helper for button creation
- `updateForSelectedObject(mesh)`: Updates property panel
- `createSlider(label, value, min, max, onChange)`: Creates slider control
- `createColorPicker(mesh)`: Creates RGB sliders
- `toggleVisibility()`: Shows/hides GUI

**GUI Layout**:
```
┌─────────────────────────┐
│ Add Box                 │ ← Button
├─────────────────────────┤
│ Add Sphere              │ ← Button
├─────────────────────────┤
│ Selected Object         │ ← Title
├─────────────────────────┤
│ X Position: [slider]    │ ← Property
│ Y Position: [slider]    │
│ Z Position: [slider]    │
│ Red:        [slider]    │
│ Green:      [slider]    │
│ Blue:       [slider]    │
└─────────────────────────┘
```

## Data Flow

### Object Creation Flow

```
User clicks "Add Box"
    ↓
GUIManager.createButton callback
    ↓
SceneManager.addBox()
    ↓
Creates mesh + material
    ↓
Adds to objects array
    ↓
Renders in scene
```

### Object Selection Flow

```
User clicks on mesh
    ↓
scene.onPointerDown event
    ↓
pickResult.pickedMesh
    ↓
SceneManager.selectObject(mesh)
    ↓
Highlights mesh (emissive color)
    ↓
GUIManager.updateForSelectedObject(mesh)
    ↓
Property panel updates with sliders
```

### Property Update Flow

```
User drags slider
    ↓
Slider.onValueChangedObservable
    ↓
Callback updates mesh property
    ↓
Babylon.js renders change
```

## Render Loop

```javascript
engine.runRenderLoop(() => {
  scene.render();                    // Render frame
  appState.scene.fps = engine.getFps(); // Update FPS
});
```

**Frequency**: 60 fps (target)
**Operations per frame**:
1. Update camera position (if keys pressed)
2. Update light intensity (flicker animation)
3. Render all meshes
4. Update GUI
5. Calculate FPS

## Event Handling

### Global Events

- `window.error`: Catches uncaught exceptions
- `window.unhandledrejection`: Catches promise rejections
- `window.resize`: Resizes engine on window resize
- `window.beforeunload`: (Not implemented) Should cleanup resources

### Scene Events

- `scene.onPointerDown`: Object selection
- `scene.onErrorObservable`: Scene-level errors (if available)

### GUI Events

- `button.onPointerClickObservable`: Button clicks
- `slider.onValueChangedObservable`: Slider value changes
- `canvas.click`: Pointer lock request

## Memory Management

### Current Issues

⚠️ **Material Leak**: Each object creates unique material, never disposed
⚠️ **Observer Leak**: Flicker animation observer never unregistered
⚠️ **Mesh Leak**: Objects never disposed when removed

### Recommended Disposal Pattern

```javascript
class SceneManager {
  dispose() {
    // Dispose objects
    this.objects.forEach(obj => obj.dispose());
    
    // Dispose materials
    this.boxMaterials.forEach(mat => mat.dispose());
    
    // Unregister observers
    this.scene.onBeforeRenderObservable.remove(this.flickerObserver);
  }
}
```

## Performance Characteristics

### Draw Calls

**Current**: 5-7 base + N (where N = number of objects)
- 1 floor
- 4 walls
- 1 ceiling
- 1 per unique material

**Optimized**: 5-7 base + 10 max (with material pooling)

### VRAM Usage

**Current**: ~2.1 MB + (5 KB × N objects)
- Room geometry: 50 KB
- Room materials: 5 KB
- GUI textures: 2 MB
- Per object: 5 KB (geometry + material)

**Optimized**: ~2.1 MB + (500 bytes × N objects) with instancing

### CPU Usage

**Per Frame**:
- Camera transform update: ~0.1ms
- Flicker animation: ~0.05ms
- Scene render: ~2-5ms (depends on object count)
- GUI render: ~0.5ms

## Build System

### Vite Configuration

```javascript
{
  plugins: [statusServerPlugin()],
  server: { port: 5173 }
}
```

**Status Server Plugin**: Custom middleware providing `/status` endpoint

### Build Output

```
dist/
├── index.html                    (0.55 KB)
├── assets/
│   ├── index-[hash].js          (5.56 MB) ← Main bundle
│   └── [texture-loaders].js     (various)
```

**Bundle Composition**:
- Babylon.js Core: ~4.5 MB
- Babylon.js GUI: ~800 KB
- Application code: ~50 KB
- Texture loaders: ~15 KB

## Security Considerations

### Input Validation

- No user text input (only sliders and buttons)
- Position values clamped by slider min/max
- Color values clamped to 0-1 range

### Resource Limits

⚠️ **No object limit**: Users can create unlimited objects
⚠️ **No rate limiting**: Rapid button clicking possible

**Recommendation**: Add object count limit (e.g., 100 objects)

### Error Handling

- Global error handlers catch exceptions
- Errors logged to console and appState
- No automatic recovery mechanism

## Extension Points

### Adding New Object Types

```javascript
class SceneManager {
  addCylinder(position) {
    const cylinder = BABYLON.MeshBuilder.CreateCylinder(
      `cylinder_${Date.now()}`,
      { height: 2, diameter: 1 },
      this.scene
    );
    cylinder.position = position;
    // ... material setup
    this.objects.push(cylinder);
    return cylinder;
  }
}
```

### Adding New Properties

```javascript
class GUIManager {
  updateForSelectedObject(mesh) {
    // ... existing sliders
    
    // Add rotation sliders
    this.createSlider("Rotation X", mesh.rotation.x, 0, Math.PI * 2, (value) => {
      mesh.rotation.x = value;
    });
  }
}
```

### Adding Physics

```javascript
// Enable physics
scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

// Add impostor to object
box.physicsImpostor = new BABYLON.PhysicsImpostor(
  box,
  BABYLON.PhysicsImpostor.BoxImpostor,
  { mass: 1, restitution: 0.5 },
  scene
);
```

## Testing Strategy

### Unit Testing (Not Implemented)

Recommended test coverage:
- CameraController: Camera setup, pointer lock
- SceneManager: Object creation, selection
- GUIManager: Button creation, slider updates

### Integration Testing (Not Implemented)

Recommended scenarios:
- Create object → Select → Modify properties
- Multiple object creation
- Object selection switching

### Performance Testing (Not Implemented)

Recommended benchmarks:
- FPS with 10, 50, 100 objects
- Memory usage over time
- Draw call count scaling

## Deployment

### Production Build

```bash
npm run build
```

**Output**: `dist/` directory with optimized assets

### Hosting Requirements

- Static file hosting (no server-side logic)
- HTTPS recommended for pointer lock API
- Modern browser support (WebGL 2.0)

### Environment Variables

None currently used. For future API integrations:
- Create `.env` file (gitignored)
- Access via `import.meta.env.VITE_*`

## Future Architecture Improvements

1. **State Management**: Implement Redux/Zustand for complex state
2. **Component System**: Break down monolithic classes
3. **Event Bus**: Decouple components with pub/sub
4. **Resource Manager**: Centralized asset loading and disposal
5. **Scene Graph**: Hierarchical object organization
6. **Undo/Redo**: Command pattern for reversible actions
7. **Serialization**: Save/load scene to JSON
8. **Plugin System**: Extensible architecture for features
