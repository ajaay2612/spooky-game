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

## Core Components (v1.1.0)

### Editor System Architecture

The application now uses a modular class-based architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Canvas)                     │
├─────────────────────────────────────────────────────────┤
│                    Babylon.js Engine                     │
├──────────────┬──────────────┬──────────────┬────────────┤
│ EditorManager│ CameraManager│ SelectionMgr │ ObjectFctry│
│ (Orchestrate)│ (Dual Camera)│ (Highlight)  │ (Creation) │
├──────────────┼──────────────┼──────────────┼────────────┤
│ ObjectPalette│ PropertyPanel│SceneHierarchy│ Serializer │
│ (Create UI)  │ (Edit UI)    │ (Tree UI)    │ (Save/Load)│
├──────────────┼──────────────┼──────────────┼────────────┤
│InteractionSys│MonitorControl│MachineInterac│            │
│ (Play Mode)  │ (HTML Frames)│ (Buttons/Dial)│            │
├──────────────┴──────────────┴──────────────┴────────────┤
│              Babylon.js GizmoManager                     │
│         (Move Gizmo, Scale Gizmo, Rotation Gizmo)        │
└─────────────────────────────────────────────────────────┘
```

### 1. EditorManager

**Purpose**: Main orchestrator for editor mode and keyboard shortcuts

**Properties**:
- `scene`: Babylon.js scene reference
- `canvas`: HTML canvas element
- `isEditorMode`: Boolean flag for current mode
- `selectionManager`: SelectionManager instance
- `cameraManager`: CameraManager instance
- `objectFactory`: ObjectFactory instance
- `serializationManager`: SerializationManager instance
- `gizmoManager`: Babylon.js GizmoManager instance
- `activeGizmo`: Current gizmo mode ('move', 'scale', or null)
- `objectPalette`: ObjectPalette UI component
- `propertyPanel`: PropertyPanel UI component
- `sceneHierarchy`: SceneHierarchy UI component

**Methods**:
- `initialize(guiTexture)`: Setup all components
- `initializeGizmos()`: Create and configure GizmoManager
- `setGizmoMode(mode)`: Activate/deactivate gizmos
- `updateScaleGizmoUniformMode(uniform)`: Toggle uniform scaling
- `setupKeyboardShortcuts()`: Register keyboard event handlers
- `toggleMode()`: Switch between editor and play mode
- `enterEditorMode()`: Activate editor camera and UI
- `enterPlayMode()`: Activate player camera, hide UI
- `deleteSelected()`: Delete selected object
- `duplicateSelected()`: Clone selected object
- `saveScene()`: Trigger scene serialization
- `loadScene()`: Trigger scene deserialization
- `focusOnSelected()`: Focus camera on selected object
- `updateGizmoAttachment()`: Reattach gizmo to selected object
- `dispose()`: Cleanup resources

**Keyboard Shortcuts**:
- E: Toggle editor/play mode
- Delete: Delete selected object
- Ctrl+D: Duplicate selected object
- Ctrl+S: Save scene to file
- Ctrl+O: Load scene from file
- F: Focus camera on selected
- Escape: Deselect object

### 2. CameraManager

**Purpose**: Manages dual camera system (editor + player)

**Properties**:
- `scene`: Babylon.js scene reference
- `canvas`: HTML canvas element
- `editorCamera`: ArcRotateCamera instance
- `playerCamera`: UniversalCamera instance
- `activeCamera`: Current active camera

**Methods**:
- `initialize()`: Create both cameras
- `createEditorCamera()`: Setup ArcRotateCamera
- `createPlayerCamera()`: Setup UniversalCamera
- `switchToEditorCamera()`: Activate editor camera
- `switchToPlayerCamera()`: Activate player camera

**Editor Camera (ArcRotateCamera)**:
- Alpha: π/2, Beta: π/3, Radius: 15
- Target: (0, 1.5, 0)
- Radius limits: 2-100
- Beta limits: 0.1 to π/2
- Right-click rotation, middle-click pan, scroll zoom

**Player Camera (UniversalCamera)**:
- Position: (0, 1.6, -5) - eye level
- Speed: 0.1 units per frame
- WASD movement keys
- Pointer lock for mouse look

### 3. SelectionManager

**Purpose**: Handles object selection with visual highlighting

**Properties**:
- `scene`: Babylon.js scene reference
- `selectedObject`: Currently selected object
- `highlightLayer`: Babylon.js HighlightLayer
- `selectionCallbacks`: Array of callback functions

**Methods**:
- `initialize()`: Create HighlightLayer
- `setupPicking(canvas)`: Enable mouse picking
- `selectObject(object)`: Select and highlight object
- `deselectObject()`: Clear selection
- `addSelectionCallback(callback)`: Register callback
- `dispose()`: Cleanup resources

**Selection Behavior**:
- Left-click to select objects
- Yellow outline highlight (HighlightLayer)
- Callbacks triggered on selection change
- Filters internal meshes (names starting with _)

### 4. SerializationManager

**Purpose**: Scene save/load functionality

**Properties**:
- `scene`: Babylon.js scene reference

**Methods**:
- `serializeScene()`: Convert scene to JSON
- `deserializeScene(jsonData)`: Recreate scene from JSON
- `saveToFile(filename)`: Download JSON file
- `loadFromFile(file)`: Upload and parse JSON file
- `clearScene()`: Remove user-created objects
- `getMeshType(mesh)`: Determine mesh type from name
- `getLightType(light)`: Determine light type from class
- `serializeMaterial(material)`: Extract material properties
- `applyMaterialData(material, data)`: Apply material properties

**JSON Format**:
```json
{
  "version": "1.0",
  "objects": [
    {
      "type": "mesh",
      "meshType": "box",
      "name": "box_0",
      "position": [0, 1, 0],
      "rotation": [0, 0, 0],
      "scaling": [1, 1, 1],
      "material": {
        "diffuseColor": [1, 0, 0],
        "specularColor": [1, 1, 1],
        "emissiveColor": [0, 0, 0]
      }
    }
  ]
}
```

### 5. ObjectFactory

**Purpose**: Centralized object creation with material pooling

**Properties**:
- `scene`: Babylon.js scene reference
- `objectCounter`: Auto-increment counter for naming

**Methods**:
- `createPrimitive(type)`: Create mesh (box, sphere, cylinder, cone, plane, torus)
- `createLight(type)`: Create light (point, directional, spot, hemispheric)
- `importGLTF(url)`: Load GLTF/GLB model
- `duplicateObject(object)`: Clone mesh or light
- `getLightType(light)`: Determine light type

**Object Creation**:
- Default position: (0, 1, 0)
- Random colors for primitives
- Default intensity: 0.5 for lights
- Auto-naming: `{type}_{counter}`

### 6. ObjectPalette (UI Component)

**Purpose**: Left panel for creating objects

**Properties**:
- `editor`: EditorManager reference
- `guiTexture`: Babylon.js GUI texture
- `panel`: StackPanel container
- `scrollViewer`: ScrollViewer for scrolling
- `isVisible`: Visibility state

**Methods**:
- `initialize()`: Create UI panel
- `createSectionHeader(text)`: Create section title
- `createButton(text, onClick)`: Create button
- `createPrimitiveSection()`: Add primitive buttons
- `createLightSection()`: Add light buttons
- `createModelSection()`: Add GLTF import button
- `openGLTFImport()`: File picker for GLTF
- `show()`: Show panel
- `hide()`: Hide panel

**UI Layout**:
- Position: Top-left corner
- Width: 240px, Height: 45% of screen
- Sections: Primitives, Lights, Models
- Scrollable content

### 7. PropertyPanel (UI Component)

**Purpose**: Right panel for editing object properties

**Properties**:
- `editor`: EditorManager reference
- `guiTexture`: Babylon.js GUI texture
- `panel`: StackPanel container
- `scrollViewer`: ScrollViewer for scrolling
- `currentObject`: Selected object
- `activeGizmoMode`: Current gizmo ('move', 'scale', or null)
- `uniformScaling`: Boolean for aspect ratio lock
- `moveButton`: Move gizmo button
- `scaleButton`: Scale gizmo button
- `uniformScaleCheckbox`: Checkbox for uniform scaling

**Methods**:
- `initialize()`: Create UI panel
- `updateForObject(object)`: Rebuild UI for object
- `clearControls()`: Remove all controls
- `createHeader(object)`: Object name header
- `createTransformSection(object)`: Position, rotation, scale controls
- `createGizmoButtons(object)`: Move and Scale gizmo buttons
- `toggleGizmoMode(mode)`: Activate/deactivate gizmo
- `updateGizmoButtonStates()`: Update button highlights
- `createMaterialSection(object)`: Color sliders
- `createLightSection(object)`: Intensity and color controls
- `createDeleteButton()`: Delete button
- `addSectionHeader(text)`: Section title
- `addVector3Control(label, value, onChange)`: Input field
- `addColorControl(label, color, onChange)`: RGB sliders
- `show()`: Show panel
- `hide()`: Hide panel

**UI Layout**:
- Position: Top-right corner
- Width: 320px, Height: 600px
- Sections: Gizmos, Transform, Material/Light, Delete
- Scrollable content

**Gizmo Integration**:
- Move and Scale buttons at top of Transform section
- Active button highlighted in blue (#4a9eff)
- Uniform scaling checkbox (visible when Scale active)
- Real-time gizmo updates

### 8. SceneHierarchy (UI Component)

**Purpose**: Left-bottom panel showing object tree

**Properties**:
- `editor`: EditorManager reference
- `guiTexture`: Babylon.js GUI texture
- `panel`: StackPanel container
- `scrollViewer`: ScrollViewer for scrolling
- `objectButtons`: Map of object to button
- `isVisible`: Visibility state

**Methods**:
- `initialize()`: Create UI panel
- `refresh()`: Rebuild object list
- `addSection(title, objects)`: Add section with objects
- `createObjectButton(object)`: Create button for object
- `highlightSelected(object)`: Update button highlights
- `show()`: Show panel
- `hide()`: Hide panel

**UI Layout**:
- Position: Bottom-left corner
- Width: 240px, Height: 45% of screen
- Sections: Meshes, Lights
- Scrollable content

### 9. Babylon.js GizmoManager

**Purpose**: Interactive visual manipulation tools

**Properties**:
- `scene`: Babylon.js scene reference
- `positionGizmoEnabled`: Boolean for move gizmo
- `scaleGizmoEnabled`: Boolean for scale gizmo
- `rotationGizmoEnabled`: Boolean for rotation gizmo (not yet used)
- `usePointerToAttachGizmos`: False (manual attachment)
- `gizmoCoordinatesMode`: Local coordinate space

**Methods**:
- `attachToMesh(mesh)`: Attach gizmo to mesh
- `dispose()`: Cleanup resources

**Gizmo Types**:
- **Position Gizmo**: Red (X), Green (Y), Blue (Z) axis handles
- **Scale Gizmo**: Uniform (center) or non-uniform (axis) handles
- **Rotation Gizmo**: Not yet implemented

**Gizmo Behavior**:
- Only one gizmo active at a time
- Attached to selected object only
- Local coordinate space (follows object rotation)
- Real-time property updates

### 10. InteractionSystem (Play Mode)

**Purpose**: Handles object interaction in play mode with raycast detection and lock-on camera

**Properties**:
- `scene`: Babylon.js scene reference
- `camera`: Player camera reference
- `canvas`: HTML canvas element
- `focusedObject`: Currently targeted object
- `isLockedOn`: Boolean for lock-on state
- `interactableObjects`: Array of interactable meshes
- `enabled`: Boolean (enabled in play mode only)
- `raycastDistance`: 5 units maximum interaction range
- `raycastThrottle`: Frame counter for performance
- `raycastInterval`: 5 frames between raycasts

**Methods**:
- `initialize()`: Setup UI elements and register interactables
- `update()`: Called every frame to perform raycasting
- `registerInteractableObjects()`: Scan scene for interactable meshes
- `setFocusedObject(mesh)`: Set currently targeted object
- `clearFocusedObject()`: Clear target and reset UI
- `lockOnToObject()`: Animate camera to interaction position
- `exitLockOn()`: Return camera to original position
- `onObjectInteract(mesh)`: Trigger interaction events
- `dispose()`: Cleanup resources

**UI Elements**:
- Crosshair: White (default) → Green (targeting interactable)
- Interaction prompt: "Press [F] to Interact" at bottom center
- Pointer lock management

**Lock-On Behavior**:
- F key triggers lock-on to focused object
- Smooth camera animation (60 frames, cubic easing)
- Camera moves to configured position from InteractiveMachinesConfig
- Pointer lock released for UI interaction
- Escape or F key exits lock-on
- Returns to original camera position with animation

**Performance Optimizations**:
- Raycasts throttled to every 5 frames (83% reduction)
- HighlightLayer removed (GPU overhead eliminated)
- CSS-based crosshair (lightweight)
- No material modifications during gameplay
- Achieves 75+ FPS during rapid camera movement

**Interactable Objects**:
- Registered by mesh name from InteractiveMachinesConfig
- Specific meshes: Computer parts, monitor, buttons, dials
- Re-scans at 1s and 3s intervals to catch late-loading models

### 11. Application State (`appState`) [Legacy]

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
