# Design Document

## Overview

The Simple Spooky Game is a minimal first-person experience built with Babylon.js and vanilla JavaScript. The design focuses on creating an atmospheric room environment with smooth FPS controls, requiring no build tools or frameworks - just an HTML file that can be opened directly in a browser.

### Core Design Principles

1. **Simplicity First**: Modular architecture with separate files, using Vite for development
2. **Atmospheric Focus**: Dark lighting and colors to create spooky mood
3. **Dual Mode Design**: Editor mode for scene creation, Player mode for first-person exploration
4. **Smooth Controls**: Responsive controls for both editor (orbit camera) and player (FPS) modes
5. **Browser-Ready**: No installation, runs immediately in modern browsers

## Architecture

### High-Level Structure

```
Project Root
├── index.html (HTML structure, canvas element, script imports)
├── main.js (All game logic and Babylon.js setup)
└── styles.css (Optional: Canvas styling)
```

### Technology Stack

- **Rendering Engine**: Babylon.js 7.31.0
- **Build Tool**: Vite 5.4.11
- **Language**: Vanilla JavaScript (ES6+)
- **Markup**: HTML5
- **Styling**: CSS
- **GUI**: Babylon.js GUI for editor interface

### File Architecture

The game will be split into separate files for better organization:

1. **index.html**: Minimal HTML with canvas element and script imports
2. **main.js**: All game logic including scene setup, camera, room creation, lighting, and render loop
3. **styles.css** (optional): Canvas styling for full-screen display

## Components and Interfaces

### 1. Scene Manager

**Responsibility**: Initialize and manage the Babylon.js scene

**Key Elements**:
- Engine creation from canvas
- Scene instantiation
- Background color (dark/black)
- Render loop management

**Implementation Pattern**:
```javascript
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(0.01, 0.01, 0.02); // Very dark blue
```

### 2. Camera System

**Responsibility**: Dual camera system for editor and player modes

#### Editor Camera (ArcRotateCamera)

**Configuration**:
- **Type**: ArcRotateCamera (orbit camera for scene editing)
- **Position**: Orbits around target point (0, 1.5, 0)
- **Initial Position**: (0, 5, -10) - elevated view of room
- **Controls**: Mouse-based manipulation
- **Radius**: 10 units (adjustable via zoom)
- **Limits**: 
  - Min radius: 2 units
  - Max radius: 50 units
  - Lower beta limit: 0.1 (prevent going below floor)
  - Upper beta limit: Math.PI / 2 (prevent flipping)

**Mouse Controls**:
- **Right mouse button + drag**: Rotate camera around target (orbit)
- **Alt + Right mouse button + drag**: Pan camera parallel to view plane
- **Mouse wheel**: Zoom in/out (adjust radius)
- **Left click**: Select objects in scene

**Key Features**:
- Smooth orbital rotation
- Panning for precise positioning
- Zoom with mouse wheel
- No pointer lock (cursor remains visible)
- Collision detection disabled

**Implementation Pattern**:
```javascript
const editorCamera = new BABYLON.ArcRotateCamera(
  "editorCamera",
  Math.PI / 2,  // alpha (horizontal rotation)
  Math.PI / 3,  // beta (vertical rotation)
  10,           // radius
  new BABYLON.Vector3(0, 1.5, 0),  // target
  scene
);

// Configure controls
editorCamera.attachControl(canvas, true);
editorCamera.panningSensibility = 50;
editorCamera.wheelPrecision = 50;
editorCamera.minZ = 0.1;

// Set limits
editorCamera.lowerRadiusLimit = 2;
editorCamera.upperRadiusLimit = 50;
editorCamera.lowerBetaLimit = 0.1;
editorCamera.upperBetaLimit = Math.PI / 2;

// Configure mouse buttons
editorCamera.inputs.attached.pointers.buttons = [2]; // Right button for rotation
```

#### Player Camera (UniversalCamera)

**Configuration**:
- **Type**: UniversalCamera (supports FPS controls)
- **Position**: (0, 1.6, -5) - eye level, centered, back of room
- **Target**: Looking forward (0, 1.6, 0)
- **Controls**: WASD keys + mouse look
- **Speed**: 0.1 units per frame
- **Mouse Sensitivity**: 0.002 radians per pixel

**Key Features**:
- Pointer lock on canvas click
- Keyboard input for movement
- Mouse input for camera rotation
- Collision detection disabled (free movement)

**Implementation Pattern**:
```javascript
const playerCamera = new BABYLON.UniversalCamera("playerCamera", 
  new BABYLON.Vector3(0, 1.6, -5), scene);
playerCamera.setTarget(new BABYLON.Vector3(0, 1.6, 0));
playerCamera.attachControl(canvas, true);
playerCamera.speed = 0.1;
playerCamera.angularSensibility = 2000;

// WASD controls
playerCamera.keysUp = [87];    // W
playerCamera.keysDown = [83];  // S
playerCamera.keysLeft = [65];  // A
playerCamera.keysRight = [68]; // D
```

#### Camera Switching

**Mode Management**:
```javascript
let currentMode = 'editor'; // or 'player'

function switchToEditorMode() {
  scene.activeCamera = editorCamera;
  currentMode = 'editor';
  // Show GUI, enable object selection
}

function switchToPlayerMode() {
  scene.activeCamera = playerCamera;
  currentMode = 'player';
  // Hide GUI, enable pointer lock
}
```

### 3. Room Environment

**Responsibility**: Create the enclosed room geometry

**Components**:

**Floor**:
- Type: Ground plane
- Size: 20 x 20 units
- Position: y = 0
- Color: Dark gray (#1a1a1a)

**Ceiling**:
- Type: Ground plane (rotated)
- Size: 20 x 20 units
- Position: y = 3
- Color: Very dark gray (#0d0d0d)

**Walls** (4 walls):
- Type: Box meshes
- Dimensions: 20 x 3 x 0.5 units
- Positions: North, South, East, West edges
- Color: Dark brown/gray (#2a2a2a)

**Material Strategy**:
- Use StandardMaterial for all surfaces
- Dark, muted colors (grays, dark browns)
- Low specular values for matte appearance
- Optional: Slight emissive color for subtle glow

**Implementation Pattern**:
```javascript
// Floor
const floor = BABYLON.MeshBuilder.CreateGround("floor", 
  {width: 20, height: 20}, scene);
const floorMat = new BABYLON.StandardMaterial("floorMat", scene);
floorMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
floor.material = floorMat;

// Walls (example for one wall)
const wallNorth = BABYLON.MeshBuilder.CreateBox("wallNorth",
  {width: 20, height: 3, depth: 0.5}, scene);
wallNorth.position = new BABYLON.Vector3(0, 1.5, 10);
```

### 4. Lighting System

**Responsibility**: Create atmospheric lighting for spooky mood

**Light Configuration**:

**Primary Light** (HemisphericLight):
- Type: Ambient hemisphere light
- Direction: From above (0, 1, 0)
- Intensity: 0.3 (very dim)
- Color: Slightly blue-tinted white
- Purpose: Provide minimal base illumination

**Secondary Light** (PointLight - Optional):
- Type: Point light
- Position: Center of room, slightly elevated
- Intensity: 0.5
- Range: 15 units
- Color: Warm orange/yellow (like a dim bulb)
- Purpose: Create focal point and shadows

**Lighting Strategy**:
- Keep overall scene very dark
- Use low intensity values (0.2-0.5)
- Avoid bright whites - use tinted colors
- Shadows optional (performance consideration)

**Implementation Pattern**:
```javascript
const light = new BABYLON.HemisphericLight("light",
  new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 0.3;
light.diffuse = new BABYLON.Color3(0.5, 0.5, 0.6); // Slight blue tint
```

### 5. Editor GUI System

**Responsibility**: Provide user interface for editor mode

**Components**:

**Object Creation Panel**:
- Buttons for creating different shapes (Box, Sphere, Cylinder, Cone, Torus)
- Each button creates object at scene center or camera target
- Objects created with unique names and random colors

**Object Properties Panel**:
- Displays properties of selected object
- Editable fields for:
  - Position (X, Y, Z)
  - Rotation (X, Y, Z)
  - Scale (X, Y, Z)
  - Color (R, G, B)
- Updates in real-time as object is modified

**Keyboard Shortcuts**:
- **Delete**: Remove selected object
- **Ctrl+Z**: Undo last action (future enhancement)
- **Ctrl+D**: Duplicate selected object (future enhancement)
- **F**: Focus camera on selected object (future enhancement)

**Implementation Pattern**:
```javascript
const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

// Create panel
const panel = new GUI.StackPanel();
panel.width = "200px";
panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
advancedTexture.addControl(panel);

// Add buttons
const addBoxButton = GUI.Button.CreateSimpleButton("addBox", "Add Box");
addBoxButton.height = "40px";
addBoxButton.onPointerClickObservable.add(() => {
  createBox();
});
panel.addControl(addBoxButton);
```

**Object Selection**:
- Use scene.pick() on left mouse click
- Highlight selected object (outline or emissive color)
- Display properties in GUI panel
- Store reference to selected object

**Implementation Pattern**:
```javascript
let selectedObject = null;

scene.onPointerDown = (evt, pickResult) => {
  if (evt.button === 0 && pickResult.hit) { // Left click
    if (selectedObject) {
      // Unhighlight previous selection
      selectedObject.renderOutline = false;
    }
    selectedObject = pickResult.pickedMesh;
    selectedObject.renderOutline = true;
    selectedObject.outlineColor = new BABYLON.Color3(1, 1, 0); // Yellow
    updatePropertiesPanel(selectedObject);
  }
};
```

### 6. Object Management System

**Responsibility**: Create, track, and manage scene objects

**Features**:
- Create objects of different shapes
- Assign unique names and IDs
- Track all created objects in array
- Delete objects and clean up resources
- Apply random or specified colors

**Object Types**:
- Box (1x1x1 cube)
- Sphere (diameter 1)
- Cylinder (height 2, diameter 1)
- Cone (height 2, diameter 1)
- Torus (diameter 1, thickness 0.3)

**Implementation Pattern**:
```javascript
const createdObjects = [];
let objectCounter = 0;

function createBox(position = new BABYLON.Vector3(0, 1, 0)) {
  const box = BABYLON.MeshBuilder.CreateBox(
    `box_${objectCounter++}`,
    { size: 1 },
    scene
  );
  box.position = position;
  
  const material = new BABYLON.StandardMaterial(`mat_${box.name}`, scene);
  material.diffuseColor = new BABYLON.Color3(
    Math.random(),
    Math.random(),
    Math.random()
  );
  box.material = material;
  
  createdObjects.push(box);
  return box;
}

function deleteObject(mesh) {
  const index = createdObjects.indexOf(mesh);
  if (index > -1) {
    createdObjects.splice(index, 1);
  }
  mesh.material?.dispose();
  mesh.dispose();
}
```

### 7. Render Loop

**Responsibility**: Continuous rendering and frame updates

**Implementation**:
```javascript
engine.runRenderLoop(() => {
  scene.render();
});

// Handle window resize
window.addEventListener('resize', () => {
  engine.resize();
});
```

## Data Models

### Scene State

```javascript
{
  engine: BABYLON.Engine,
  scene: BABYLON.Scene,
  editorCamera: BABYLON.ArcRotateCamera,
  playerCamera: BABYLON.UniversalCamera,
  currentMode: 'editor' | 'player',
  meshes: {
    floor: BABYLON.Mesh,
    ceiling: BABYLON.Mesh,
    walls: BABYLON.Mesh[]
  },
  lights: BABYLON.Light[],
  createdObjects: BABYLON.Mesh[],
  selectedObject: BABYLON.Mesh | null
}
```

### Editor State

```javascript
{
  selectedObject: BABYLON.Mesh | null,
  createdObjects: BABYLON.Mesh[],
  objectCounter: number,
  guiControls: {
    advancedTexture: GUI.AdvancedDynamicTexture,
    panel: GUI.StackPanel,
    propertiesPanel: GUI.StackPanel
  }
}
```

### Camera State (managed by Babylon.js)

**Editor Camera (ArcRotateCamera)**:
```javascript
{
  alpha: number,      // Horizontal rotation
  beta: number,       // Vertical rotation
  radius: number,     // Distance from target
  target: BABYLON.Vector3,
  panningSensibility: number,
  wheelPrecision: number
}
```

**Player Camera (UniversalCamera)**:
```javascript
{
  position: BABYLON.Vector3,
  rotation: BABYLON.Vector3,
  speed: number,
  angularSensibility: number
}
```

## Error Handling

### Initialization Errors

**Canvas Not Found**:
```javascript
const canvas = document.getElementById('renderCanvas');
if (!canvas) {
  console.error('Canvas element not found');
  return;
}
```

**Engine Creation Failure**:
```javascript
try {
  const engine = new BABYLON.Engine(canvas, true);
} catch (error) {
  console.error('Failed to create Babylon.js engine:', error);
  alert('WebGL not supported or failed to initialize');
}
```

### Runtime Errors

**Render Loop Protection**:
```javascript
engine.runRenderLoop(() => {
  try {
    scene.render();
  } catch (error) {
    console.error('Render error:', error);
  }
});
```

### Browser Compatibility

**WebGL Check**:
- Babylon.js handles WebGL detection
- Fallback: Display message if WebGL unavailable
- Target: WebGL 2.0 (fallback to WebGL 1.0)

## Testing Strategy

### Manual Testing Checklist

**Editor Camera Controls**:
- [ ] Right mouse button rotates camera around target
- [ ] Alt + Right mouse button pans camera
- [ ] Mouse wheel zooms in/out smoothly
- [ ] Camera limits prevent going below floor or flipping
- [ ] Left click selects objects

**Player Camera Controls**:
- [ ] Mouse look works smoothly in all directions
- [ ] WASD keys move camera correctly
- [ ] Camera stays at eye level (1.6m)
- [ ] Pointer lock engages on canvas click

**Editor GUI**:
- [ ] Object creation buttons work for all shapes
- [ ] Selected object is highlighted
- [ ] Properties panel displays correct values
- [ ] Delete key removes selected object
- [ ] Property changes update object in real-time

**Room Environment**:
- [ ] All walls, floor, and ceiling visible
- [ ] No gaps or holes in room geometry
- [ ] Room feels enclosed and contained
- [ ] Textures/colors appear correctly

**Atmosphere**:
- [ ] Scene feels dark and spooky
- [ ] Lighting creates appropriate mood
- [ ] Colors are muted and atmospheric
- [ ] Frame rate stays above 30 FPS

**Browser Compatibility**:
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] Works in Edge
- [ ] Loads within 5 seconds

### Performance Testing

**Target Metrics**:
- FPS: 60 (minimum 30)
- Load time: < 5 seconds
- Memory: < 100 MB
- Draw calls: < 20

**Testing Method**:
- Use browser DevTools Performance tab
- Monitor FPS counter (can add to scene)
- Check Network tab for load times

## Future Enhancements (Out of Scope)

These features are not part of the initial implementation but could be added later:

1. **Audio**: Ambient spooky sounds, footstep sounds
2. **Interactive Objects**: Doors, lights, pickups
3. **Advanced Lighting**: Dynamic shadows, flickering lights
4. **Fog Effects**: Distance fog for atmosphere
5. **Jump Scares**: Triggered events
6. **Multiple Rooms**: Connected spaces
7. **Inventory System**: Collectible items
8. **Save/Load**: Game state persistence

## Design Decisions

### Why Separate main.js File?

**Decision**: Use separate main.js file instead of inline JavaScript

**Rationale**:
- Better code organization and readability
- Easier to maintain and debug
- Can use browser caching for JS file
- Still simple - no build tools required
- Standard web development practice

**Trade-offs**:
- Requires local server or proper CORS setup for file:// protocol
- Slightly more complex than single file

### Why Dual Camera System?

**Decision**: Use ArcRotateCamera for editor mode and UniversalCamera for player mode

**Rationale**:
- **ArcRotateCamera**: Perfect for scene editing with orbit, pan, and zoom controls
- **UniversalCamera**: Industry-standard for first-person gameplay
- Clear separation between editing and playing experiences
- Each camera optimized for its specific use case
- Easy to switch between modes

**Editor Camera Benefits**:
- Orbit around objects for inspection
- Pan for precise positioning
- Zoom for detail work or overview
- No pointer lock (cursor always visible)
- Standard 3D editor controls (Blender, Maya, Unity-like)

**Player Camera Benefits**:
- Immersive first-person view
- WASD movement controls
- Mouse look with pointer lock
- Eye-level perspective

**Alternatives Considered**:
- Single camera for both modes: Would require complex control switching
- FlyCamera: Too much freedom for player mode
- Only editor mode: Wouldn't provide immersive gameplay experience

### Why No Physics?

**Decision**: Disable collision detection and physics

**Rationale**:
- Simpler implementation
- Better performance
- Not needed for basic exploration
- Can walk through walls (acceptable for prototype)

**Future**: Can add collision detection later if needed

### Why StandardMaterial?

**Decision**: Use StandardMaterial instead of PBR materials

**Rationale**:
- Simpler and faster
- Sufficient for dark, atmospheric scene
- Lower performance overhead
- Easier to configure

**Trade-offs**:
- Less realistic lighting
- No advanced material features

## Implementation Notes

### Load Order

1. HTML structure loads
2. Babylon.js CDN script loads
3. main.js script loads
4. DOMContentLoaded or window.onload triggers initialization
5. Engine and scene initialize
6. Camera, room, and lights created
7. Render loop starts

### Build Tool

Use Vite for development and building:
```bash
npm run dev    # Development server
npm run build  # Production build
```

**Why Vite**:
- Fast hot module replacement (HMR)
- Modern ES modules support
- Optimized production builds
- Simple configuration
- Better development experience than CDN

**Dependencies**:
```json
{
  "babylonjs": "^7.31.0",
  "babylonjs-gui": "^7.31.0"
}
```

### Canvas Sizing

Full-screen canvas using CSS:
```css
#renderCanvas {
  width: 100%;
  height: 100%;
  touch-action: none;
}
```

### Pointer Lock (Player Mode Only)

Request pointer lock when switching to player mode:
```javascript
function switchToPlayerMode() {
  scene.activeCamera = playerCamera;
  currentMode = 'player';
  canvas.requestPointerLock();
  // Hide GUI
}

// Exit pointer lock when switching to editor
function switchToEditorMode() {
  document.exitPointerLock();
  scene.activeCamera = editorCamera;
  currentMode = 'editor';
  // Show GUI
}
```

### Mouse Button Configuration

Configure ArcRotateCamera to use proper mouse buttons:
```javascript
// Editor camera uses right button for rotation
editorCamera.inputs.attached.pointers.buttons = [2]; // Right button only

// Pan with Alt + Right button (handled by Babylon.js automatically)
editorCamera.panningSensibility = 50;

// Disable left button for camera (used for object selection)
scene.onPointerDown = (evt, pickResult) => {
  if (evt.button === 0) { // Left click
    // Handle object selection
  }
};
```

## Summary

This design creates a dual-mode 3D application: an editor for scene creation and a first-person player mode for atmospheric exploration. The architecture uses Babylon.js with Vite for a modern development experience, featuring:

- **Editor Mode**: ArcRotateCamera with orbit/pan/zoom controls, GUI for object creation and manipulation, object selection and property editing
- **Player Mode**: UniversalCamera with FPS controls for immersive first-person exploration
- **Scene Management**: Room environment with dark atmospheric lighting, object creation system with multiple shapes, material management for visual variety
- **User Interface**: Babylon.js GUI for editor controls, keyboard shortcuts for common operations, real-time property editing

The modular class-based architecture (CameraController, SceneManager, GUIManager) provides clear separation of concerns and easy extensibility. The dual camera system allows seamless switching between editing and playing, making it both a creative tool and an immersive experience.
