# Implementation Plan

## Overview
This implementation plan transforms the Spooky Game into a full-featured scene editor by adding visual editing tools, dual camera system, property manipulation, and scene persistence. The plan follows an incremental approach, building core infrastructure first, then adding UI components, and finally implementing advanced features.

---

## Tasks

- [x] 1. Set up project structure and create core editor classes


  - Create `src/editor/` directory for editor components
  - Create `src/scene/` directory for scene management utilities
  - Create empty class files: `EditorManager.js`, `SelectionManager.js`, `ObjectFactory.js`, `SerializationManager.js`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement ObjectFactory for centralized object creation

  - [x] 2.1 Create ObjectFactory class with primitive creation methods


    - Implement `createPrimitive(type)` method supporting box, sphere, cylinder, cone, plane, torus
    - Add unique naming with counter (e.g., "Box_0", "Sphere_1")
    - Set default position at (0, 1, 0) for visibility
    - Create random colored materials for new primitives
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 2.2 Add light creation methods to ObjectFactory


    - Implement `createLight(type)` method supporting point, directional, spot, hemispheric lights
    - Configure default properties (intensity: 0.5, visible positions)
    - Add unique naming for lights
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 2.3 Implement GLTF import functionality


    - Create async `importGLTF(url)` method using `BABYLON.SceneLoader.ImportMeshAsync`
    - Add error handling with try-catch for failed imports
    - Position imported models at origin (0, 0, 0)
    - Return root mesh with unique name
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 2.4 Add object duplication method


    - Implement `duplicateObject(object)` method to clone meshes and lights
    - Offset duplicate position by (1, 0, 1) to make it visible
    - Generate unique name with numeric suffix
    - Clone materials to avoid shared references
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 3. Implement SelectionManager for object picking and highlighting

  - [x] 3.1 Create SelectionManager class with HighlightLayer


    - Initialize `BABYLON.HighlightLayer` with outer glow enabled
    - Add `selectedObject` property to track current selection
    - Create `onSelectionChanged` event callback
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 3.2 Implement object selection and deselection methods


    - Create `selectObject(object)` method to highlight and track selection
    - Create `deselectObject()` method to remove highlight and clear selection
    - Use yellow color (BABYLON.Color3.Yellow()) for highlight
    - Trigger `onSelectionChanged` callback on selection changes
    - _Requirements: 5.2, 5.3, 5.4, 5.5_
  
  - [x] 3.3 Set up mouse picking for object selection


    - Implement `setupPicking(canvas)` method with scene.onPointerDown handler
    - Handle left-click (button 0) for selection
    - Use pickResult to detect clicked objects
    - Deselect when clicking empty space
    - _Requirements: 5.1, 5.2, 5.4_

- [x] 4. Create dual camera system for editor and play modes

  - [x] 4.1 Refactor existing camera setup into EditorCamera class


    - Move existing UniversalCamera code to separate class/function
    - Store reference to player camera for mode switching
    - Preserve existing WASD controls and pointer lock functionality
    - _Requirements: 1.4, 1.5_
  
  - [x] 4.2 Implement ArcRotateCamera for editor mode

    - Create ArcRotateCamera with initial position (alpha: π/2, beta: π/3, radius: 15)
    - Set target to scene center (0, 1.5, 0)
    - Configure right mouse button for rotation (button 2)
    - Add Alt + right mouse for panning (panningSensibility: 50)
    - Set mouse wheel zoom (wheelPrecision: 50)
    - Add radius limits (2 to 100) and beta limits (0.1 to π/2)
    - _Requirements: 1.3, 1.4_
  
  - [x] 4.3 Implement camera switching logic

    - Create method to switch active camera between editor and player
    - Detach controls from inactive camera
    - Attach controls to active camera
    - Store and restore camera states when switching
    - _Requirements: 1.2, 1.5_

- [x] 5. Implement EditorManager as main orchestrator

  - [x] 5.1 Create EditorManager class with mode state management


    - Initialize with scene and canvas references
    - Add `isEditorMode` boolean property (default: true)
    - Store references to both cameras
    - Create instances of SelectionManager, ObjectFactory, SerializationManager
    - _Requirements: 1.1, 1.2_
  
  - [x] 5.2 Implement mode toggle functionality


    - Create `toggleMode()` method to switch between editor and play modes
    - Implement `enterEditorMode()` to activate editor camera and show UI
    - Implement `enterPlayMode()` to activate player camera and hide UI
    - Bind 'E' key to toggle mode
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [x] 5.3 Add keyboard shortcut handlers


    - Bind Delete key to delete selected object
    - Bind Ctrl+D to duplicate selected object
    - Bind Ctrl+S to save scene
    - Bind Ctrl+O to load scene
    - Bind F key to focus camera on selected object
    - Bind Escape to deselect object
    - Only process editor shortcuts when in editor mode
    - _Requirements: 10.1, 10.2, 14.1, 12.1, 13.1_
  
  - [x] 5.4 Implement object deletion functionality



    - Create `deleteSelected()` method to remove selected object
    - Dispose mesh, material, and associated resources
    - Prevent deletion of essential objects (main camera, default lights)
    - Deselect after deletion
    - Update scene hierarchy
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 6. Create ObjectPalette UI for object creation

  - [x] 6.1 Set up ObjectPalette panel structure


    - Create StackPanel positioned on left side of screen (width: 200px)
    - Set horizontal alignment to left, vertical alignment to top
    - Add padding (top: 10px, left: 10px)
    - Create collapsible sections for Primitives, Lights, Models
    - _Requirements: 2.1, 3.1, 4.1_
  
  - [x] 6.2 Add primitive creation buttons


    - Create buttons for Box, Sphere, Cylinder, Cone, Plane, Torus
    - Style buttons with consistent height (30px) and colors
    - Connect buttons to ObjectFactory.createPrimitive()
    - Auto-select newly created objects
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 6.3 Add light creation buttons


    - Create buttons for Point, Directional, Spot, Hemispheric lights
    - Connect buttons to ObjectFactory.createLight()
    - Auto-select newly created lights
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 6.4 Add GLTF import button with file picker


    - Create "Import Model" button
    - Open file dialog filtered for .gltf and .glb files
    - Show loading indicator during import
    - Display error message if import fails
    - Auto-select imported model
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 7. Implement PropertyPanel for object property editing

  - [x] 7.1 Create PropertyPanel base structure


    - Create StackPanel positioned on right side (width: 300px)
    - Set horizontal alignment to right, vertical alignment to top
    - Add padding (top: 10px, right: 10px)
    - Initially hide panel (isVisible: false)
    - Listen to SelectionManager.onSelectionChanged event
    - _Requirements: 6.1, 6.2_
  
  - [x] 7.2 Implement object header with name display and rename


    - Show selected object name in header
    - Create editable text field for renaming
    - Validate name is not empty
    - Append numeric suffix if name is duplicate
    - Update scene hierarchy when name changes
    - _Requirements: 6.5, 15.1, 15.2, 15.3, 15.4, 15.5_
  
  - [x] 7.3 Create transform property controls


    - Add Position section with X, Y, Z number inputs
    - Add Rotation section with X, Y, Z inputs (convert to/from degrees)
    - Add Scale section with X, Y, Z inputs
    - Update object transform immediately on value change
    - Set reasonable min/max limits for each property
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 7.4 Create material property controls for meshes


    - Add Material section visible only for mesh objects
    - Create color picker for diffuse color
    - Create color picker for specular color
    - Create color picker for emissive color
    - Add texture file path inputs (diffuse, normal, specular)
    - Update material immediately on value change
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 7.5 Create light-specific property controls


    - Add Light Properties section visible only for light objects
    - Create intensity slider (range: 0 to 10)
    - Create color picker for light color
    - Add direction controls for directional lights
    - Add angle and exponent controls for spot lights
    - Update light properties immediately on value change
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 7.6 Add delete button to property panel


    - Create "Delete Object" button at bottom of panel
    - Style with red color to indicate destructive action
    - Connect to EditorManager.deleteSelected()
    - _Requirements: 10.1, 10.2_

- [x] 8. Create SceneHierarchy UI for object list

  - [x] 8.1 Set up SceneHierarchy panel structure


    - Create StackPanel positioned on left side below ObjectPalette
    - Set width to 200px, padding top to 400px
    - Add horizontal alignment left, vertical alignment top
    - Create scrollable container for object list
    - _Requirements: 11.1, 11.2_
  
  - [x] 8.2 Implement object list with type organization

    - Create collapsible sections for Meshes, Lights, Cameras
    - Filter out internal meshes (names starting with '_')
    - Create clickable button for each object showing its name
    - Style buttons with consistent height and colors
    - _Requirements: 11.1, 11.2_
  
  - [x] 8.3 Add selection synchronization

    - Listen to SelectionManager.onSelectionChanged event
    - Highlight selected object's button in hierarchy
    - Click object button to select in scene
    - Update highlight when selection changes
    - _Requirements: 11.3, 11.4_
  
  - [x] 8.4 Implement real-time hierarchy updates

    - Create `refresh()` method to rebuild object list
    - Call refresh when objects are added or removed
    - Maintain scroll position during refresh
    - Update object names when renamed
    - _Requirements: 11.5_

- [x] 9. Implement SerializationManager for save/load functionality

  - [x] 9.1 Create scene serialization to JSON


    - Implement `serializeScene()` method returning JSON string
    - Serialize all meshes with type, name, transform, material properties
    - Serialize all lights with type, name, intensity, color, position/direction
    - Skip internal objects (names starting with '_')
    - Include version number in JSON format
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [x] 9.2 Implement scene deserialization from JSON


    - Create async `deserializeScene(jsonData)` method
    - Parse JSON and validate format
    - Clear existing scene objects (except essential ones)
    - Recreate meshes with saved properties using ObjectFactory
    - Recreate lights with saved properties
    - Restore transforms and materials
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  
  - [x] 9.3 Add file save functionality


    - Implement `saveToFile(filename)` method
    - Create Blob from serialized JSON
    - Trigger browser download with default filename "scene.json"
    - Display success confirmation message
    - Handle and display save errors
    - _Requirements: 12.1, 12.4, 12.5_
  
  - [x] 9.4 Add file load functionality

    - Implement async `loadFromFile(file)` method
    - Use FileReader to read file contents
    - Call deserializeScene with file data
    - Display success confirmation message
    - Handle and display load errors without losing current scene
    - _Requirements: 13.1, 13.2, 13.5_

- [x] 10. Integrate editor into main.js

  - [x] 10.1 Initialize EditorManager in main.js


    - Import/include all editor classes
    - Create EditorManager instance after scene setup
    - Pass scene and canvas references to EditorManager
    - Initialize in editor mode by default
    - _Requirements: 1.1_
  
  - [x] 10.2 Add GUI texture to scene

    - Create `BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI()`
    - Pass GUI texture to editor components
    - Ensure GUI renders on top of 3D scene
    - _Requirements: 6.2, 6.3_
  
  - [x] 10.3 Connect keyboard shortcuts to EditorManager

    - Move keyboard event listeners to EditorManager
    - Ensure shortcuts only work in editor mode
    - Preserve existing 'F' key for FPS toggle
    - _Requirements: 1.2_

- [x] 11. Apply styling and polish to editor UI


  - [x] 11.1 Implement dark theme color scheme

    - Set panel backgrounds to #2a2a2a
    - Set text color to #ffffff
    - Set accent color to #4a9eff
    - Set button hover color to #3a3a3a
    - Use consistent font (Arial, sans-serif)
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [x] 11.2 Add visual feedback for interactions

    - Add hover effects to buttons
    - Add click animations
    - Show loading indicators for async operations
    - Display success/error messages with toast notifications
    - _Requirements: 4.3, 12.4, 13.5_
  
  - [x] 11.3 Optimize GUI performance

    - Throttle property panel updates to 60 FPS
    - Only update visible controls
    - Batch GUI updates in single frame
    - Disable picking for non-editable objects
    - _Requirements: 6.5_

- [-] 12. Create comprehensive manual test suite

  - Test mode switching (E key) between editor and play modes
  - Test all primitive creation buttons (box, sphere, cylinder, cone, plane, torus)
  - Test all light creation buttons (point, directional, spot, hemispheric)
  - Test GLTF import with valid and invalid files
  - Test object selection by clicking in scene
  - Test object selection from hierarchy list
  - Test transform property editing (position, rotation, scale)
  - Test material property editing (colors)
  - Test light property editing (intensity, color)
  - Test object renaming with validation
  - Test object deletion with Delete key
  - Test object duplication with Ctrl+D
  - Test scene save with Ctrl+S
  - Test scene load with Ctrl+O
  - Test camera controls in editor mode (right mouse rotate, Alt+right pan, wheel zoom)
  - Test camera controls in play mode (WASD movement, mouse look)
  - Test selection highlight visibility
  - Test hierarchy updates when objects added/removed
  - Test essential object deletion prevention
  - Verify FPS remains above 30 with 50+ objects
  - _Requirements: All requirements_

- [ ] 13. Write documentation for editor features
  - Update README.md with editor mode instructions
  - Document keyboard shortcuts (E, Delete, Ctrl+D, Ctrl+S, Ctrl+O, F, Escape)
  - Document camera controls for editor mode
  - Add scene file format documentation
  - Create user guide for object creation and editing
  - Document known limitations and future enhancements
  - _Requirements: All requirements_

---

## Notes

- **Incremental Development**: Each task builds on previous tasks. Complete tasks in order for best results.
- **Testing**: Manual testing is marked optional (*) but recommended after major milestones (tasks 4, 7, 9, 10).
- **Performance**: Monitor FPS during development. Target 60 FPS with up to 50 objects.
- **Material Pooling**: Consider implementing material pooling (from steering rules) if performance degrades.
- **Error Handling**: Add try-catch blocks and user-friendly error messages throughout.
- **Code Style**: Follow existing project conventions (class-based architecture, camelCase methods, PascalCase classes).
