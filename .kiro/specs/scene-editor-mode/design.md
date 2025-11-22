# Design Document

## Overview

The Scene Editor Mode transforms the existing Spooky Game into a comprehensive game development tool by adding a visual editor interface. This feature enables developers to construct game scenes interactively through GUI controls, eliminating the need to write code for basic scene construction. The editor provides real-time property manipulation, object creation tools, and scene persistence capabilities.

### Core Design Principles

1. **Non-Destructive Workflow**: Editor mode and play mode are separate states that can be toggled without losing work
2. **Immediate Feedback**: All property changes reflect instantly in the 3D viewport
3. **Intuitive Interface**: Familiar 3D editor patterns (selection, property panels, hierarchy view)
4. **Extensibility**: Architecture supports adding new object types and property editors
5. **Performance First**: Editor UI doesn't impact render performance

## Architecture

### High-Level Structure

```
src/
├── main.js (Entry point, mode management)
├── editor/
│   ├── EditorManager.js (Main editor controller)
│   ├── ObjectPalette.js (Object creation UI)
│   ├── PropertyPanel.js (Property editing UI)
│   ├── SceneHierarchy.js (Object list UI)
│   ├── SelectionManager.js (Object selection logic)
│   └── SerializationManager.js (Save/load functionality)
├── scene/
│   ├── SceneManager.js (Existing scene setup)
│   └── ObjectFactory.js (Object creation logic)
└── camera/
    ├── EditorCamera.js (ArcRotateCamera for editor)
    └── PlayerCamera.js (UniversalCamera for gameplay)
```

### Technology Stack

- **Rendering Engine**: Babylon.js 7.31.0
- **GUI Framework**: Babylon.js GUI
- **Build Tool**: Vite 5.4.11
- **Language**: JavaScript (ES6+)
- **State Management**: Plain JavaScript objects


## Components and Interfaces

### 1. EditorManager

**Responsibility**: Orchestrate all editor functionality and manage editor state

**Key Properties**:
- `isEditorMode`: boolean - Current mode state
- `selectedObject`: BABYLON.Node | null - Currently selected object
- `editorCamera`: BABYLON.ArcRotateCamera - Editor camera instance
- `playerCamera`: BABYLON.UniversalCamera - Player camera instance
- `guiTexture`: GUI.AdvancedDynamicTexture - Main GUI container

**Key Methods**:
- `initialize(scene, canvas)`: Setup editor components
- `toggleMode()`: Switch between editor and play mode
- `enterEditorMode()`: Activate editor UI and camera
- `enterPlayMode()`: Hide editor UI, activate player camera
- `dispose()`: Cleanup editor resources

**Implementation Pattern**:
```javascript
class EditorManager {
  constructor(scene, canvas) {
    this.scene = scene;
    this.canvas = canvas;
    this.isEditorMode = true;
    this.selectedObject = null;
    
    // Initialize components
    this.selectionManager = new SelectionManager(scene);
    this.objectPalette = new ObjectPalette(this);
    this.propertyPanel = new PropertyPanel(this);
    this.sceneHierarchy = new SceneHierarchy(this);
    this.serializationManager = new SerializationManager(scene);
  }
  
  toggleMode() {
    this.isEditorMode = !this.isEditorMode;
    if (this.isEditorMode) {
      this.enterEditorMode();
    } else {
      this.enterPlayMode();
    }
  }
}
```


### 2. Camera System

**Responsibility**: Manage dual camera setup for editor and player modes

#### Editor Camera (ArcRotateCamera)

**Configuration**:
- **Type**: ArcRotateCamera - Orbit camera for scene inspection
- **Initial Position**: Alpha: π/2, Beta: π/3, Radius: 15
- **Target**: Scene center (0, 1.5, 0)
- **Controls**:
  - Right mouse button: Rotate (orbit)
  - Alt + Right mouse button: Pan
  - Mouse wheel: Zoom
- **Limits**:
  - Radius: 2 to 100 units
  - Beta: 0.1 to π/2 (prevent floor clipping and flipping)

**Implementation Pattern**:
```javascript
class EditorCamera {
  constructor(scene, canvas) {
    this.camera = new BABYLON.ArcRotateCamera(
      "editorCamera",
      Math.PI / 2,
      Math.PI / 3,
      15,
      new BABYLON.Vector3(0, 1.5, 0),
      scene
    );
    
    this.camera.attachControl(canvas, true);
    this.camera.panningSensibility = 50;
    this.camera.wheelPrecision = 50;
    this.camera.lowerRadiusLimit = 2;
    this.camera.upperRadiusLimit = 100;
    this.camera.lowerBetaLimit = 0.1;
    this.camera.upperBetaLimit = Math.PI / 2;
    
    // Right button for rotation
    this.camera.inputs.attached.pointers.buttons = [2];
  }
}
```

#### Player Camera (UniversalCamera)

**Configuration**: (Existing implementation from main game)
- **Type**: UniversalCamera - First-person camera
- **Position**: (0, 1.6, -5) - Eye level
- **Controls**: WASD + mouse look with pointer lock
- **Speed**: 0.1 units per frame


### 3. SelectionManager

**Responsibility**: Handle object selection and highlighting

**Key Properties**:
- `selectedObject`: BABYLON.Node | null
- `highlightLayer`: BABYLON.HighlightLayer - Visual selection feedback
- `onSelectionChanged`: Event callback

**Key Methods**:
- `selectObject(object)`: Select and highlight object
- `deselectObject()`: Clear selection
- `setupPicking(scene, canvas)`: Configure mouse picking

**Implementation Pattern**:
```javascript
class SelectionManager {
  constructor(scene) {
    this.scene = scene;
    this.selectedObject = null;
    this.highlightLayer = new BABYLON.HighlightLayer("highlight", scene);
    this.highlightLayer.outerGlow = true;
    this.highlightLayer.innerGlow = false;
    this.onSelectionChanged = null;
  }
  
  setupPicking(canvas) {
    this.scene.onPointerDown = (evt, pickResult) => {
      if (evt.button === 0) { // Left click
        if (pickResult.hit && pickResult.pickedMesh) {
          this.selectObject(pickResult.pickedMesh);
        } else {
          this.deselectObject();
        }
      }
    };
  }
  
  selectObject(object) {
    if (this.selectedObject) {
      this.highlightLayer.removeMesh(this.selectedObject);
    }
    this.selectedObject = object;
    this.highlightLayer.addMesh(object, BABYLON.Color3.Yellow());
    
    if (this.onSelectionChanged) {
      this.onSelectionChanged(object);
    }
  }
  
  deselectObject() {
    if (this.selectedObject) {
      this.highlightLayer.removeMesh(this.selectedObject);
      this.selectedObject = null;
      if (this.onSelectionChanged) {
        this.onSelectionChanged(null);
      }
    }
  }
}
```


### 4. ObjectPalette

**Responsibility**: Provide UI for creating new scene objects

**Object Types**:
- **Primitives**: Box, Sphere, Cylinder, Cone, Plane, Torus
- **Lights**: Point, Directional, Spot, Hemispheric
- **Models**: GLTF import button

**UI Layout**:
- Vertical panel on left side of screen
- Collapsible sections for Primitives, Lights, Models
- Icon buttons with tooltips
- File picker for GLTF import

**Implementation Pattern**:
```javascript
class ObjectPalette {
  constructor(editorManager) {
    this.editor = editorManager;
    this.panel = new GUI.StackPanel();
    this.panel.width = "200px";
    this.panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.panel.paddingTop = "10px";
    this.panel.paddingLeft = "10px";
    
    this.createPrimitiveSection();
    this.createLightSection();
    this.createModelSection();
  }
  
  createPrimitiveSection() {
    const header = this.createSectionHeader("Primitives");
    this.panel.addControl(header);
    
    const primitives = ['Box', 'Sphere', 'Cylinder', 'Cone', 'Plane', 'Torus'];
    primitives.forEach(type => {
      const button = this.createButton(type, () => {
        this.createPrimitive(type);
      });
      this.panel.addControl(button);
    });
  }
  
  createPrimitive(type) {
    const factory = new ObjectFactory(this.editor.scene);
    const object = factory.createPrimitive(type);
    this.editor.selectionManager.selectObject(object);
  }
}
```


### 5. PropertyPanel

**Responsibility**: Display and edit properties of selected objects

**Property Categories**:
- **Transform**: Position (X, Y, Z), Rotation (X, Y, Z), Scale (X, Y, Z)
- **Material**: Diffuse color, Specular color, Emissive color, Textures
- **Light**: Intensity, Color, Direction, Angle (for spot lights)
- **Object**: Name, Visibility, Enabled state

**UI Layout**:
- Vertical panel on right side of screen
- Header showing object name with rename field
- Collapsible sections for each property category
- Appropriate input controls (sliders, color pickers, text fields)
- Delete button at bottom

**Implementation Pattern**:
```javascript
class PropertyPanel {
  constructor(editorManager) {
    this.editor = editorManager;
    this.panel = new GUI.StackPanel();
    this.panel.width = "300px";
    this.panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.panel.paddingTop = "10px";
    this.panel.paddingRight = "10px";
    this.panel.isVisible = false;
    
    this.currentObject = null;
    this.propertyControls = [];
    
    // Listen for selection changes
    this.editor.selectionManager.onSelectionChanged = (object) => {
      this.updateForObject(object);
    };
  }
  
  updateForObject(object) {
    this.clearControls();
    this.currentObject = object;
    
    if (!object) {
      this.panel.isVisible = false;
      return;
    }
    
    this.panel.isVisible = true;
    this.createHeader(object);
    
    if (object instanceof BABYLON.Mesh) {
      this.createTransformSection(object);
      this.createMaterialSection(object);
    } else if (object instanceof BABYLON.Light) {
      this.createLightSection(object);
    }
    
    this.createDeleteButton(object);
  }
  
  createTransformSection(object) {
    this.addSectionHeader("Transform");
    
    // Position
    this.addVector3Control("Position", object.position, (value) => {
      object.position.copyFrom(value);
    });
    
    // Rotation (in degrees)
    this.addVector3Control("Rotation", object.rotation, (value) => {
      object.rotation.copyFrom(value);
    }, true); // Convert to degrees
    
    // Scale
    this.addVector3Control("Scale", object.scaling, (value) => {
      object.scaling.copyFrom(value);
    });
  }
}
```


### 6. SceneHierarchy

**Responsibility**: Display hierarchical list of all scene objects

**Features**:
- Organized by type (Meshes, Lights, Cameras)
- Collapsible sections
- Click to select object
- Highlight selected object
- Real-time updates as objects added/removed

**UI Layout**:
- Vertical panel on left side, below ObjectPalette
- Scrollable list
- Tree structure with indentation for children
- Icons for different object types

**Implementation Pattern**:
```javascript
class SceneHierarchy {
  constructor(editorManager) {
    this.editor = editorManager;
    this.panel = new GUI.StackPanel();
    this.panel.width = "200px";
    this.panel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.panel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.panel.paddingTop = "400px"; // Below ObjectPalette
    this.panel.paddingLeft = "10px";
    
    this.objectButtons = new Map();
    this.refresh();
    
    // Listen for selection changes
    this.editor.selectionManager.onSelectionChanged = (object) => {
      this.highlightSelected(object);
    };
  }
  
  refresh() {
    this.panel.clearControls();
    this.objectButtons.clear();
    
    const meshes = this.editor.scene.meshes.filter(m => !m.name.startsWith('_'));
    const lights = this.editor.scene.lights;
    
    this.addSection("Meshes", meshes);
    this.addSection("Lights", lights);
  }
  
  addSection(title, objects) {
    const header = this.createSectionHeader(title);
    this.panel.addControl(header);
    
    objects.forEach(obj => {
      const button = this.createObjectButton(obj);
      this.panel.addControl(button);
      this.objectButtons.set(obj, button);
    });
  }
  
  createObjectButton(object) {
    const button = GUI.Button.CreateSimpleButton(
      `hierarchy_${object.name}`,
      object.name
    );
    button.height = "30px";
    button.color = "white";
    button.background = "#333";
    button.onPointerClickObservable.add(() => {
      this.editor.selectionManager.selectObject(object);
    });
    return button;
  }
}
```


### 7. ObjectFactory

**Responsibility**: Create scene objects with proper configuration

**Key Methods**:
- `createPrimitive(type)`: Create primitive mesh
- `createLight(type)`: Create light source
- `importGLTF(url)`: Load GLTF model
- `duplicateObject(object)`: Clone existing object

**Implementation Pattern**:
```javascript
class ObjectFactory {
  constructor(scene) {
    this.scene = scene;
    this.objectCounter = 0;
  }
  
  createPrimitive(type) {
    const name = `${type}_${this.objectCounter++}`;
    let mesh;
    
    switch(type.toLowerCase()) {
      case 'box':
        mesh = BABYLON.MeshBuilder.CreateBox(name, { size: 1 }, this.scene);
        break;
      case 'sphere':
        mesh = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 1 }, this.scene);
        break;
      case 'cylinder':
        mesh = BABYLON.MeshBuilder.CreateCylinder(name, { height: 2, diameter: 1 }, this.scene);
        break;
      case 'cone':
        mesh = BABYLON.MeshBuilder.CreateCylinder(name, { height: 2, diameterTop: 0, diameterBottom: 1 }, this.scene);
        break;
      case 'plane':
        mesh = BABYLON.MeshBuilder.CreatePlane(name, { size: 1 }, this.scene);
        break;
      case 'torus':
        mesh = BABYLON.MeshBuilder.CreateTorus(name, { diameter: 1, thickness: 0.3 }, this.scene);
        break;
    }
    
    // Default position at scene center, elevated
    mesh.position = new BABYLON.Vector3(0, 1, 0);
    
    // Create material with random color
    const material = new BABYLON.StandardMaterial(`${name}_mat`, this.scene);
    material.diffuseColor = new BABYLON.Color3(
      Math.random(),
      Math.random(),
      Math.random()
    );
    mesh.material = material;
    
    return mesh;
  }
  
  createLight(type) {
    const name = `${type}Light_${this.objectCounter++}`;
    let light;
    
    switch(type.toLowerCase()) {
      case 'point':
        light = new BABYLON.PointLight(name, new BABYLON.Vector3(0, 3, 0), this.scene);
        break;
      case 'directional':
        light = new BABYLON.DirectionalLight(name, new BABYLON.Vector3(0, -1, 0), this.scene);
        light.position = new BABYLON.Vector3(0, 5, 0);
        break;
      case 'spot':
        light = new BABYLON.SpotLight(name, new BABYLON.Vector3(0, 3, 0), new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, this.scene);
        break;
      case 'hemispheric':
        light = new BABYLON.HemisphericLight(name, new BABYLON.Vector3(0, 1, 0), this.scene);
        break;
    }
    
    light.intensity = 0.5;
    return light;
  }
  
  async importGLTF(url) {
    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", url, this.scene);
      const rootMesh = result.meshes[0];
      rootMesh.name = `imported_${this.objectCounter++}`;
      rootMesh.position = new BABYLON.Vector3(0, 0, 0);
      return rootMesh;
    } catch (error) {
      console.error("Failed to load GLTF:", error);
      throw error;
    }
  }
}
```


### 8. SerializationManager

**Responsibility**: Save and load scene data

**Serialization Format** (JSON):
```json
{
  "version": "1.0",
  "objects": [
    {
      "type": "mesh",
      "meshType": "box",
      "name": "Box_0",
      "position": [0, 1, 0],
      "rotation": [0, 0, 0],
      "scaling": [1, 1, 1],
      "material": {
        "diffuseColor": [1, 0, 0],
        "specularColor": [1, 1, 1],
        "emissiveColor": [0, 0, 0]
      }
    },
    {
      "type": "light",
      "lightType": "point",
      "name": "PointLight_0",
      "position": [0, 3, 0],
      "intensity": 0.5,
      "diffuse": [1, 1, 1]
    }
  ]
}
```

**Implementation Pattern**:
```javascript
class SerializationManager {
  constructor(scene) {
    this.scene = scene;
  }
  
  serializeScene() {
    const data = {
      version: "1.0",
      objects: []
    };
    
    // Serialize meshes
    this.scene.meshes.forEach(mesh => {
      if (mesh.name.startsWith('_')) return; // Skip internal meshes
      
      const meshData = {
        type: "mesh",
        meshType: this.getMeshType(mesh),
        name: mesh.name,
        position: mesh.position.asArray(),
        rotation: mesh.rotation.asArray(),
        scaling: mesh.scaling.asArray()
      };
      
      if (mesh.material) {
        meshData.material = this.serializeMaterial(mesh.material);
      }
      
      data.objects.push(meshData);
    });
    
    // Serialize lights
    this.scene.lights.forEach(light => {
      const lightData = {
        type: "light",
        lightType: this.getLightType(light),
        name: light.name,
        intensity: light.intensity,
        diffuse: light.diffuse.asArray()
      };
      
      if (light.position) {
        lightData.position = light.position.asArray();
      }
      if (light.direction) {
        lightData.direction = light.direction.asArray();
      }
      
      data.objects.push(lightData);
    });
    
    return JSON.stringify(data, null, 2);
  }
  
  async deserializeScene(jsonData) {
    const data = JSON.parse(jsonData);
    const factory = new ObjectFactory(this.scene);
    
    // Clear existing objects (except essential ones)
    this.clearScene();
    
    // Recreate objects
    for (const objData of data.objects) {
      if (objData.type === "mesh") {
        const mesh = factory.createPrimitive(objData.meshType);
        mesh.name = objData.name;
        mesh.position.fromArray(objData.position);
        mesh.rotation.fromArray(objData.rotation);
        mesh.scaling.fromArray(objData.scaling);
        
        if (objData.material && mesh.material) {
          this.applyMaterialData(mesh.material, objData.material);
        }
      } else if (objData.type === "light") {
        const light = factory.createLight(objData.lightType);
        light.name = objData.name;
        light.intensity = objData.intensity;
        light.diffuse.fromArray(objData.diffuse);
        
        if (objData.position && light.position) {
          light.position.fromArray(objData.position);
        }
        if (objData.direction && light.direction) {
          light.direction.fromArray(objData.direction);
        }
      }
    }
  }
  
  saveToFile(filename = "scene.json") {
    const data = this.serializeScene();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  }
  
  async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          await this.deserializeScene(e.target.result);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}
```


## Data Models

### Editor State

```javascript
{
  isEditorMode: boolean,
  selectedObject: BABYLON.Node | null,
  editorCamera: BABYLON.ArcRotateCamera,
  playerCamera: BABYLON.UniversalCamera,
  savedCameraState: {
    position: BABYLON.Vector3,
    rotation: BABYLON.Vector3
  }
}
```

### Object Metadata

```javascript
{
  id: string,
  name: string,
  type: 'mesh' | 'light' | 'camera',
  subType: string, // 'box', 'sphere', 'point', 'directional', etc.
  isEditable: boolean,
  isDeletable: boolean
}
```

### Property Descriptor

```javascript
{
  name: string,
  type: 'number' | 'vector3' | 'color' | 'string' | 'boolean',
  value: any,
  min: number,
  max: number,
  step: number,
  onChange: (value) => void
}
```

## Error Handling

### Selection Errors

**Invalid Object Selection**:
```javascript
selectObject(object) {
  if (!object || object.isDisposed()) {
    console.warn("Cannot select invalid or disposed object");
    return;
  }
  // Proceed with selection
}
```

### GLTF Import Errors

**File Load Failure**:
```javascript
async importGLTF(url) {
  try {
    const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", url, this.scene);
    return result.meshes[0];
  } catch (error) {
    console.error("GLTF import failed:", error);
    this.showErrorMessage(`Failed to load model: ${error.message}`);
    throw error;
  }
}
```

### Serialization Errors

**Save Failure**:
```javascript
saveToFile(filename) {
  try {
    const data = this.serializeScene();
    // Save logic
  } catch (error) {
    console.error("Save failed:", error);
    this.showErrorMessage("Failed to save scene. Check console for details.");
  }
}
```

**Load Failure**:
```javascript
async loadFromFile(file) {
  try {
    const data = await this.readFile(file);
    await this.deserializeScene(data);
  } catch (error) {
    console.error("Load failed:", error);
    this.showErrorMessage("Failed to load scene. File may be corrupted.");
    // Preserve current scene state
  }
}
```

### Property Update Errors

**Invalid Property Value**:
```javascript
updateProperty(object, property, value) {
  try {
    if (this.validatePropertyValue(property, value)) {
      object[property] = value;
    } else {
      console.warn(`Invalid value for ${property}: ${value}`);
    }
  } catch (error) {
    console.error("Property update failed:", error);
  }
}
```


## Testing Strategy

### Manual Testing Checklist

**Mode Switching**:
- [ ] Toggle key switches between editor and play mode
- [ ] Editor UI visible in editor mode, hidden in play mode
- [ ] Camera switches correctly between modes
- [ ] Scene state preserved when switching modes

**Object Creation**:
- [ ] All primitive types create successfully
- [ ] All light types create successfully
- [ ] GLTF import dialog opens and loads models
- [ ] New objects appear at expected positions
- [ ] New objects are automatically selected

**Object Selection**:
- [ ] Left click selects objects
- [ ] Selected object is highlighted
- [ ] Click on empty space deselects
- [ ] Hierarchy list updates selection
- [ ] Property panel shows correct object

**Property Editing**:
- [ ] Transform properties update object in real-time
- [ ] Color pickers update material colors
- [ ] Light properties affect scene lighting
- [ ] Name changes reflect in hierarchy
- [ ] Invalid values are rejected

**Scene Hierarchy**:
- [ ] All objects listed correctly
- [ ] Organized by type
- [ ] Click to select works
- [ ] Updates when objects added/removed
- [ ] Selected object highlighted

**Save/Load**:
- [ ] Save creates valid JSON file
- [ ] Load restores all objects correctly
- [ ] Object properties preserved
- [ ] Materials restored correctly
- [ ] Error handling for invalid files

**Object Deletion**:
- [ ] Delete button removes object
- [ ] Resources properly disposed
- [ ] Hierarchy updates
- [ ] Essential objects cannot be deleted
- [ ] Selection cleared after deletion

**Camera Controls**:
- [ ] Right mouse button rotates camera
- [ ] Alt + Right mouse button pans
- [ ] Mouse wheel zooms
- [ ] Camera limits prevent issues
- [ ] Smooth camera movement

### Performance Testing

**Target Metrics**:
- Editor UI overhead: < 5ms per frame
- Object creation: < 100ms
- Property update: < 16ms (60 FPS)
- Save/Load: < 2 seconds for 100 objects
- Selection: < 16ms

**Testing Method**:
- Use browser DevTools Performance tab
- Monitor FPS with editor UI active
- Test with varying object counts (10, 50, 100)
- Profile save/load operations


## Design Decisions

### Why Class-Based Architecture?

**Decision**: Use ES6 classes for editor components

**Rationale**:
- Clear separation of concerns (each class has single responsibility)
- Encapsulation of related functionality
- Easy to extend and maintain
- Matches existing project architecture (from steering rules)
- Familiar pattern for developers

**Trade-offs**:
- Slightly more verbose than functional approach
- Requires understanding of OOP concepts

### Why HighlightLayer for Selection?

**Decision**: Use Babylon.js HighlightLayer instead of outline rendering or emissive color

**Rationale**:
- Built-in Babylon.js feature, well-optimized
- Provides smooth glow effect
- Doesn't modify object's material
- Can be easily toggled on/off
- Supports multiple highlighted objects

**Alternatives Considered**:
- Outline rendering: More complex, requires custom shader
- Emissive color: Modifies material, harder to restore
- Bounding box: Less visually appealing

### Why JSON for Serialization?

**Decision**: Use JSON format for scene save files

**Rationale**:
- Human-readable and editable
- Native JavaScript support
- Easy to debug and validate
- Widely supported format
- Can be version-controlled

**Alternatives Considered**:
- Binary format: Smaller but not human-readable
- Babylon.js .babylon format: More complex, includes everything
- Custom format: Unnecessary complexity

### Why Separate ObjectFactory?

**Decision**: Create dedicated ObjectFactory class instead of inline creation

**Rationale**:
- Centralizes object creation logic
- Ensures consistent naming and configuration
- Easy to add new object types
- Simplifies testing
- Reusable across editor components

**Trade-offs**:
- Additional class to maintain
- Slight indirection in code

### Why Dual Camera System?

**Decision**: Maintain separate cameras for editor and player modes

**Rationale**:
- Each camera optimized for its use case
- No need to reconfigure controls when switching
- Can preserve camera state independently
- Clear separation of concerns
- Matches industry standard (Unity, Unreal, Blender)

**Alternatives Considered**:
- Single camera with mode switching: Complex control management
- Dynamic camera creation: Performance overhead, state loss


## Implementation Notes

### Integration with Existing Code

**Existing Components to Modify**:
1. **main.js**: Add editor initialization and mode toggle key binding
2. **SceneManager**: Expose scene reference for editor access
3. **CameraController**: Integrate dual camera system

**New Files to Create**:
- `src/editor/EditorManager.js`
- `src/editor/ObjectPalette.js`
- `src/editor/PropertyPanel.js`
- `src/editor/SceneHierarchy.js`
- `src/editor/SelectionManager.js`
- `src/editor/SerializationManager.js`
- `src/scene/ObjectFactory.js`

### Keyboard Shortcuts

**Editor Mode**:
- **E**: Toggle editor/play mode
- **Delete**: Delete selected object
- **Ctrl+D**: Duplicate selected object
- **Ctrl+S**: Save scene
- **Ctrl+O**: Open scene
- **F**: Focus camera on selected object
- **Escape**: Deselect object

**Implementation**:
```javascript
window.addEventListener('keydown', (evt) => {
  if (evt.key === 'e' || evt.key === 'E') {
    editorManager.toggleMode();
  }
  
  if (editorManager.isEditorMode) {
    if (evt.key === 'Delete') {
      editorManager.deleteSelected();
    }
    if (evt.ctrlKey && evt.key === 'd') {
      evt.preventDefault();
      editorManager.duplicateSelected();
    }
    if (evt.ctrlKey && evt.key === 's') {
      evt.preventDefault();
      editorManager.saveScene();
    }
    // ... more shortcuts
  }
});
```

### GUI Styling

**Color Scheme** (Dark theme to match spooky aesthetic):
- Background: #1a1a1a
- Panel background: #2a2a2a
- Text: #ffffff
- Accent: #4a9eff
- Highlight: #ffff00
- Button hover: #3a3a3a

**Typography**:
- Font: Arial, sans-serif
- Header size: 16px
- Body size: 14px
- Input size: 12px

### Performance Optimizations

**GUI Updates**:
- Throttle property panel updates to 60 FPS
- Only update visible controls
- Batch GUI updates in single frame

**Object Creation**:
- Reuse materials when possible (material pooling from steering rules)
- Freeze world matrices for static objects
- Disable picking for non-editable objects

**Selection**:
- Use scene.pick() with ray caching
- Limit highlight layer to single object
- Disable highlight in play mode


## Future Enhancements (Out of Scope)

These features are not part of the initial implementation but could be added later:

1. **Undo/Redo System**: Command pattern for reversible operations
2. **Multi-Selection**: Select and manipulate multiple objects simultaneously
3. **Gizmos**: Visual transform manipulators (move, rotate, scale arrows)
4. **Snap to Grid**: Align objects to grid for precise placement
5. **Parent-Child Relationships**: Hierarchy with transform inheritance
6. **Prefab System**: Save and reuse object configurations
7. **Material Editor**: Advanced material creation and editing
8. **Animation Timeline**: Create and edit object animations
9. **Physics Configuration**: Add physics properties to objects
10. **Scripting Support**: Attach custom scripts to objects
11. **Asset Browser**: Manage textures, models, and other assets
12. **Collaboration**: Multi-user editing with real-time sync
13. **Version Control**: Track scene changes over time
14. **Export Options**: Export to different formats (.babylon, .gltf)
15. **Terrain Editor**: Create and sculpt terrain meshes

## Summary

The Scene Editor Mode design provides a comprehensive visual editing experience for the Spooky Game. The architecture uses a modular class-based approach with clear separation of concerns:

- **EditorManager**: Orchestrates all editor functionality and mode switching
- **SelectionManager**: Handles object selection with visual feedback
- **ObjectPalette**: Provides UI for creating primitives, lights, and importing models
- **PropertyPanel**: Displays and edits object properties in real-time
- **SceneHierarchy**: Shows organized list of all scene objects
- **SerializationManager**: Saves and loads scenes in JSON format
- **ObjectFactory**: Centralizes object creation with consistent configuration

The dual camera system (ArcRotateCamera for editor, UniversalCamera for player) provides optimal controls for each mode. The editor uses Babylon.js GUI for a responsive interface that doesn't impact render performance. The JSON serialization format ensures scenes are human-readable and version-control friendly.

This design integrates seamlessly with the existing game architecture while maintaining the project's core principles of simplicity, performance, and extensibility.

