# Game Design Document

## Overview

**Title**: Spooky Game  
**Genre**: 3D First-Person Horror  
**Platform**: Web (Browser-based)  
**Engine**: Babylon.js 7.31.0  
**Target Audience**: Developers, 3D artists, game designers

## Concept

A first-person horror game set in a dark, oppressive room with flickering lights and eerie atmosphere. Players navigate the spooky environment from an eye-level perspective. The game includes developer tools for prototyping and testing gameplay elements during development.

## Core Gameplay Loop

### Editor Mode (Primary)
```
Create Object → Select Object → Edit Properties → Save Scene → Test in Play Mode → Iterate
```

### Play Mode (Testing)
```
Navigate → Experience Scene → Return to Editor → Refine → Repeat
```

## Player Experience

### Dual Camera System

#### Editor Camera (ArcRotateCamera)
**Purpose**: Scene editing and object manipulation

**Controls**:
- Right Mouse Button: Rotate around target
- Middle Mouse Button: Pan camera
- Mouse Wheel: Zoom in/out
- F Key: Focus on selected object

**Characteristics**:
- Orbits around target point (default: 0, 1.5, 0)
- Radius: 2-100 units (configurable)
- Beta limits: 0.1 to π/2 (prevents floor clipping)
- Smooth, predictable movement
- No pointer lock (cursor always visible)

**Camera Feel**:
- Angular sensitivity: 1000 (moderate rotation speed)
- Panning sensitivity: 1000 (moderate pan speed)
- Wheel precision: 50 (smooth zoom)
- Professional editing experience

#### Player Camera (UniversalCamera)
**Purpose**: First-person gameplay testing

**Controls**:
- WASD: Move camera
- Mouse: Look around (pointer lock)
- E Key: Return to editor mode

**Characteristics**:
- Eye-level perspective (1.6m height)
- Free movement in 3D space
- Smooth mouse look with pointer lock
- No collision detection (free-fly mode)

**Movement Characteristics**:
- Speed: 0.1 units per frame (~6 units/second at 60fps)
- No gravity or physics constraints
- Instant direction changes
- Immersive first-person experience

**Camera Feel**:
- Angular sensitivity: 2000 (moderate mouse speed)
- No acceleration/deceleration
- No head bob or camera shake
- Clean, precise control

### Mode Switching
- **E Key**: Toggle between Editor and Play mode
- **Seamless Transition**: Camera positions preserved
- **GUI Visibility**: Editor UI hidden in Play mode
- **Selection State**: Cleared when entering Play mode

### Object Interaction

#### Object Creation
**Object Palette** (Left Panel)

**Primitives**:
- Box: 1×1×1 unit cube
- Sphere: 1 unit diameter
- Cylinder: 2 units height, 1 unit diameter
- Cone: 2 units height, tapered to point
- Plane: 1×1 unit flat surface
- Torus: 1 unit diameter ring with 0.3 unit thickness

**Lights**:
- Point Light: Omnidirectional light source
- Directional Light: Parallel rays (sun-like)
- Spot Light: Cone-shaped beam
- Hemispheric Light: Ambient sky/ground lighting

**Models**:
- Import GLTF: Load .gltf or .glb files
- File picker dialog
- Automatic positioning at origin

**Creation Behavior**:
- Objects spawn at scene center (0, 1, 0)
- Random colors assigned to primitives
- Default intensity (0.5) for lights
- Immediate visual feedback
- Auto-select newly created objects

#### Object Selection
**Selection Methods**:
- Left-click on objects in 3D viewport
- Click object name in Scene Hierarchy panel
- F key to focus camera on selected

**Visual Feedback**:
- Yellow outline highlight (HighlightLayer)
- Property panel appears on right
- Object name highlighted in hierarchy
- Selection persists until changed

**Selection Rules**:
- Only one object at a time (single selection)
- Room geometry not selectable (floor, walls, ceiling)
- Essential objects protected (cameras, default lights)
- Click empty space to deselect
- Escape key to deselect

#### Property Editing
**Property Panel** (Right Side)

**Transform Section**:
- Position: X, Y, Z input fields (any value)
- Rotation: X, Y, Z in degrees (converted to radians)
- Scale: X, Y, Z multipliers (any positive value)
- Real-time updates as you type

**Material Section** (Meshes):
- Diffuse Color: RGB sliders (0-1 range)
- Specular Color: RGB sliders (0-1 range)
- Emissive Color: RGB sliders (0-1 range)
- Live preview while dragging

**Light Section** (Lights):
- Intensity: Slider (0-10 range)
- Light Color: RGB sliders (0-1 range)
- Real-time lighting updates

**Object Naming**:
- Editable text field at top of panel
- Auto-increment suffix if name exists
- Updates hierarchy immediately
- Validates for uniqueness

**Delete Button**:
- Red button at bottom of panel
- Confirmation for essential objects
- Immediate disposal of resources
- Updates hierarchy automatically

## Environment Design

### The Room

**Dimensions**: 20×20 units floor, 5 units height

**Atmosphere**: Spooky, oppressive, mysterious

**Visual Design**:
- **Floor**: Dark brown, worn appearance
- **Walls**: Dark greenish-gray, institutional feel
- **Ceiling**: Almost black, barely visible
- **Overall Tone**: Abandoned facility, horror game aesthetic

**Spatial Layout**:
```
        North Wall
    ┌─────────────────┐
    │                 │
West│   20×20 space   │East
    │                 │
    └─────────────────┘
        South Wall
```

**Starting Position**: Center of room, facing north

### Lighting Design

**Hemispheric Light**
- Intensity: 0.15 (very dim)
- Direction: Top-down
- Ground color: Dark blue (0.05, 0.05, 0.1)
- Purpose: Minimal ambient visibility

**Point Light**
- Position: Center ceiling (0, 4, 0)
- Intensity: 0.3 (flickering)
- Color: Sickly yellow-orange (0.8, 0.7, 0.5)
- Behavior: Smooth random flickering
- Purpose: Eerie, unstable atmosphere

**Flicker Pattern**:
- Updates every 15 frames (~4 times per second)
- Intensity range: 0.2 to 0.4
- Smooth interpolation (10% per frame)
- Creates tension and unease

### Color Palette

| Element | RGB | Hex | Description |
|---------|-----|-----|-------------|
| Floor | (0.15, 0.12, 0.1) | #26201A | Dark brown |
| Walls | (0.2, 0.25, 0.2) | #334033 | Greenish-gray |
| Ceiling | (0.1, 0.1, 0.12) | #1A1A1F | Near black |
| Light | (0.8, 0.7, 0.5) | #CCB380 | Sickly yellow |
| Ambient | (0.1, 0.1, 0.15) | #1A1A26 | Dark blue |

## Object Types (v1.1.0)

### Primitives ✅

#### Box
**Geometry**: 1×1×1 unit cube  
**Default Position**: (0, 1, 0)  
**Material**: Random color, standard material  
**Use Cases**: Platforms, obstacles, building blocks, walls

#### Sphere
**Geometry**: 1 unit diameter  
**Default Position**: (0, 1, 0)  
**Material**: Random color, standard material  
**Use Cases**: Collectibles, projectiles, decorative elements, planets

#### Cylinder
**Geometry**: 2 units height, 1 unit diameter  
**Default Position**: (0, 1, 0)  
**Material**: Random color, standard material  
**Use Cases**: Pillars, columns, pipes, trees

#### Cone
**Geometry**: 2 units height, 1 unit base diameter, 0 top diameter  
**Default Position**: (0, 1, 0)  
**Material**: Random color, standard material  
**Use Cases**: Markers, projectiles, traffic cones, spikes

#### Plane
**Geometry**: 1×1 unit flat surface  
**Default Position**: (0, 1, 0)  
**Material**: Random color, standard material  
**Use Cases**: Walls, floors, signs, screens

#### Torus
**Geometry**: 1 unit diameter, 0.3 unit thickness  
**Default Position**: (0, 1, 0)  
**Material**: Random color, standard material  
**Use Cases**: Rings, portals, decorative elements

### Lights ✅

#### Point Light
**Type**: Omnidirectional light source  
**Default Position**: (0, 3, 0)  
**Default Intensity**: 0.5  
**Use Cases**: Lamps, torches, light bulbs, explosions

#### Directional Light
**Type**: Parallel rays (sun-like)  
**Default Position**: (0, 5, 0)  
**Default Direction**: (0, -1, 0) downward  
**Default Intensity**: 0.5  
**Use Cases**: Sunlight, moonlight, outdoor lighting

#### Spot Light
**Type**: Cone-shaped beam  
**Default Position**: (0, 3, 0)  
**Default Direction**: (0, -1, 0) downward  
**Angle**: π/3 (60 degrees)  
**Exponent**: 2  
**Default Intensity**: 0.5  
**Use Cases**: Flashlights, stage lights, searchlights

#### Hemispheric Light
**Type**: Ambient sky/ground lighting  
**Default Direction**: (0, 1, 0) upward  
**Default Intensity**: 0.5  
**Use Cases**: Ambient lighting, sky simulation, soft fill light

### Imported Models ✅

#### GLTF/GLB Import
**Supported Formats**: .gltf, .glb  
**Import Method**: File picker dialog  
**Default Position**: (0, 0, 0)  
**Features**:
- Preserves materials and textures
- Maintains hierarchy
- Supports animations (not yet controllable)
- Auto-naming (imported_N)

**Use Cases**: 
- Custom 3D models
- Character models
- Environment assets
- Complex geometry

### Future Objects (Planned)

- **Capsule**: Character controllers, pills
- **Polyhedron**: Dice, crystals, gems
- **Ground from HeightMap**: Terrain generation
- **Extrusion**: Custom 2D to 3D shapes
- **Lathe**: Rotational symmetry objects
- **Ribbon**: Trails, paths, ropes
- **Tube**: Pipes, cables, tracks

## Transform Gizmos (v1.1.0)

### Gizmo Controls

**Property Panel Integration**:
- Gizmo buttons appear at top of Transform section
- "Move" button: Activates position gizmo
- "Rotate" button: Activates rotation gizmo
- "Scale" button: Activates scale gizmo
- Active button highlighted in blue (#4a9eff)
- Click again to deactivate

**Uniform Scaling Checkbox**:
- Appears below Scale button when active
- "Lock Aspect Ratio" label
- Checked: Uniform scaling (center handle only)
- Unchecked: Non-uniform scaling (axis handles)
- Real-time gizmo update on toggle

### Gizmo Interaction

**Move Gizmo**:
1. Click "Move" button in Property Panel
2. Colored axis handles appear on selected object
3. Drag red (X), green (Y), or blue (Z) handle
4. Object moves along selected axis
5. Position updates in real-time
6. Manual input fields also update

**Scale Gizmo**:
1. Click "Scale" button in Property Panel
2. Scale handles appear on selected object
3. If uniform mode: Drag center handle to scale proportionally
4. If non-uniform mode: Drag axis handles independently
5. Toggle "Lock Aspect Ratio" to switch modes
6. Scale updates in real-time
7. Manual input fields also update

### Gizmo Behavior

**Coordinate Space**: Local (follows object rotation)
**Attachment**: Automatic to selected object
**Detachment**: Automatic when object deselected
**Visibility**: Only visible when gizmo active
**Performance**: Minimal overhead (~0.1ms per frame)

## User Interface

### GUI Layout (v1.1.0)

**Three-Panel System**:

#### 1. Object Palette (Left Panel)
**Position**: Top-left corner  
**Width**: 220px  
**Background**: Dark gray (#2a2a2a)

**Sections**:
- **Primitives**: 6 buttons (Box, Sphere, Cylinder, Cone, Plane, Torus)
- **Lights**: 4 buttons (Point, Directional, Spot, Hemispheric)
- **Models**: Import GLTF button

**Visual Design**:
- Blue section headers (#4a9eff)
- Dark button backgrounds (#3a3a3a)
- Hover effect (lighter gray)
- 4px corner radius
- 10px spacing between sections

#### 2. Property Panel (Right Panel)
**Position**: Top-right corner  
**Width**: 320px  
**Height**: 600px (scrollable)  
**Background**: Dark gray (#2a2a2a)

**Dynamic Content**:
- Object name header (blue, #4a9eff)
- Name input field (editable)
- Transform section (Position, Rotation, Scale)
- Material section (Diffuse, Specular, Emissive)
- Light section (Intensity, Color)
- Delete button (red, #cc0000)

**Visual Design**:
- White text on dark background
- Blue accent color for headers
- Input fields with dark background (#3a3a3a)
- RGB sliders with blue handles (#4a9eff)
- Scrollable for long content
- 2px blue scrollbar

#### 3. Scene Hierarchy (Left Bottom Panel)
**Position**: Below Object Palette  
**Width**: 220px  
**Background**: Dark gray (#2a2a2a)

**Content**:
- "Scene Hierarchy" header (blue)
- Section headers (Meshes, Lights)
- Object list buttons
- Selected object highlighted (blue)

**Visual Design**:
- Compact button layout (25px height)
- Left-aligned text
- Hover effect
- Selection highlight (#4a9eff)
- Auto-refresh on changes

### Mode Indicators

**Editor Mode**:
- All GUI panels visible
- Cursor always visible
- Blue accent colors
- Status: "Editor Mode"

**Play Mode**:
- All GUI panels hidden
- Pointer lock enabled
- Immersive experience
- Status: "Play Mode"

### Visual Feedback

**Selection**:
- Yellow outline on selected object (HighlightLayer)
- Blue highlight in hierarchy
- Property panel appears
- Object name in header

**Hover**:
- Button background lightens
- Cursor changes to pointer
- Smooth transition (CSS)

**Actions**:
- Immediate visual updates
- No loading spinners needed
- Console logs for debugging
- Alert dialogs for errors

### HUD Elements (Future)

- FPS counter (top-left)
- Object count (top-left)
- Draw call counter (top-left)
- Memory usage (top-left)
- Performance warnings (center)
- Mode indicator (top-center)
- Keyboard shortcut overlay (H key)

## Mechanics (Current - v1.1.0)

### Object Creation System

**ObjectFactory Pattern**:
- Centralized creation logic
- Consistent naming (type_counter)
- Material pooling for performance
- Random colors for primitives
- Default configurations

**Creation Flow**:
1. User clicks button in Object Palette
2. ObjectFactory.createPrimitive() or createLight()
3. Object spawned at (0, 1, 0)
4. Material assigned (random color or pooled)
5. Object auto-selected
6. Scene Hierarchy refreshes
7. Property Panel updates

**Supported Types**:
- 6 primitive types (Box, Sphere, Cylinder, Cone, Plane, Torus)
- 4 light types (Point, Directional, Spot, Hemispheric)
- GLTF model import (.gltf, .glb)

### Selection System

**SelectionManager**:
- HighlightLayer for visual feedback
- Raycasting for 3D picking
- Callback system for UI updates
- Single selection mode

**Selection Flow**:
1. User clicks object in viewport or hierarchy
2. SelectionManager.selectObject() called
3. Previous selection cleared (highlight removed)
4. New object highlighted (yellow outline)
5. Property Panel updates with object data
6. Scene Hierarchy highlights object name
7. Selection callbacks triggered

**Selection Features**:
- Visual highlighting with HighlightLayer
- Multiple selection methods (viewport, hierarchy)
- Focus camera on selected (F key)
- Deselect with Escape or empty space click
- Protected objects (cameras, essential lights)

### Property Editing System

**PropertyPanel Dynamic UI**:
- Generates controls based on object type
- Real-time updates (no apply button)
- Input validation
- Undo-friendly (future enhancement)

**Transform Editing**:
- Position: Unrestricted X, Y, Z input fields
- Rotation: Degrees input (converted to radians internally)
- Scale: Positive values only
- Immediate visual feedback

**Material Editing**:
- Diffuse, Specular, Emissive colors
- RGB sliders with live preview
- Value display (0.00 format)
- Affects StandardMaterial properties

**Light Editing**:
- Intensity slider (0-10 range)
- Light color RGB sliders
- Real-time lighting updates
- Type-specific properties preserved

### Scene Hierarchy

**SceneHierarchy Panel**:
- Tree view of all objects
- Organized by type (Meshes, Lights)
- Click to select objects
- Auto-refresh on changes
- Visual selection feedback

**Features**:
- Filters internal meshes (names starting with _)
- Excludes room geometry
- Highlights selected object
- Synchronized with SelectionManager
- Compact, scrollable layout

## Mechanics (Implemented - v1.1.0)

### Transform Gizmos ✅

**Gizmo System**: Babylon.js GizmoManager for interactive manipulation

**Available Gizmos**:
- Move Gizmo: Position objects with visual axis handles
- Rotate Gizmo: Rotate objects around X, Y, Z axes
- Scale Gizmo: Scale objects with uniform or non-uniform modes

**Activation**:
- Click "Move", "Rotate", or "Scale" button in Property Panel
- Click again to deactivate
- Only one gizmo active at a time

**Move Gizmo**:
- Red handle: X-axis movement
- Green handle: Y-axis movement
- Blue handle: Z-axis movement
- Drag handles to move object
- Real-time position updates

**Rotate Gizmo**:
- Red ring: Rotate around X-axis
- Green ring: Rotate around Y-axis
- Blue ring: Rotate around Z-axis
- Drag rings to rotate object
- Real-time rotation updates

**Scale Gizmo**:
- Two modes: Uniform and Non-uniform
- Uniform mode: Center handle scales all axes proportionally
- Non-uniform mode: Individual axis handles (X, Y, Z)
- "Lock Aspect Ratio" checkbox toggles mode
- Real-time scale updates

**Gizmo Behavior**:
- Attached to selected object only
- Automatically detached when object deselected
- Local coordinate space (follows object rotation)
- Visual feedback with colored handles

**UI Integration**:
- Gizmo buttons in Property Panel (top of Transform section)
- Active gizmo highlighted in blue
- Uniform scaling checkbox (visible when Scale active)
- Seamless integration with manual input fields

### Object Deletion ✅

**Triggers**:
- Delete key (keyboard shortcut)
- Delete button in Property Panel
- EditorManager.deleteSelected()

**Process**:
1. Check if object is essential (protected)
2. Deselect object first
3. Dispose material if exists
4. Dispose mesh/light
5. Refresh Scene Hierarchy
6. Log deletion

**Protection**:
- Cameras cannot be deleted
- Default lights protected
- Room geometry protected
- Alert shown for protected objects

### Object Duplication ✅

**Trigger**: Ctrl+D keyboard shortcut

**Process**:
1. Clone selected object
2. Offset position by (1, 0, 1)
3. Clone material (avoid shared references)
4. Copy all properties (intensity, colors, etc.)
5. Auto-select duplicate
6. Refresh Scene Hierarchy

**Supported**:
- All mesh types (primitives, imported models)
- All light types
- Materials cloned independently
- Transform properties preserved

### Save/Load System ✅

**SerializationManager**:
- JSON format for scene data
- Version tracking (v1.0)
- Selective serialization (excludes room)
- File download/upload

**Save (Ctrl+S)**:
1. Serialize all user objects
2. Store type, name, transform, materials
3. Generate JSON string
4. Create blob and download
5. Default filename: scene.json

**Load (Ctrl+O)**:
1. Open file picker dialog
2. Read JSON file
3. Clear existing objects (keep room)
4. Recreate objects from data
5. Apply all properties
6. Refresh UI

**Data Structure**:
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

### Keyboard Shortcuts ✅

**Editor Mode**:
- E: Toggle Editor/Play mode
- Delete: Delete selected object
- Ctrl+D: Duplicate selected object
- Ctrl+S: Save scene to file
- Ctrl+O: Load scene from file
- F: Focus camera on selected
- Escape: Deselect object

**Play Mode**:
- E: Return to Editor mode
- WASD: First-person movement
- Mouse: Look around (pointer lock)

### Camera Focus ✅

**Trigger**: F key

**Behavior**:
- Centers editor camera on selected object
- Uses object.position as target
- Smooth transition (ArcRotateCamera.setTarget)
- Only works in Editor mode
- Requires object selected

## Mechanics (Planned - Future)

### Multi-Selection

**Trigger**: Shift+Click or drag selection box  
**Effect**: Select multiple objects  
**Editing**: Modify all selected objects simultaneously  
**Priority**: Medium

### Visual Transform Gizmos

**Types**: Position, Rotation, Scale  
**Interaction**: Drag handles to transform  
**Modes**: Local vs. World space  
**Priority**: High

### Undo/Redo System

**Pattern**: Command pattern  
**Storage**: Action history stack  
**Shortcuts**: Ctrl+Z, Ctrl+Y  
**Priority**: High

### Physics Integration

**Gravity**: Optional toggle  
**Collisions**: Object-to-object and object-to-room  
**Impostors**: Box, Sphere, Mesh  
**Properties**: Mass, friction, restitution  
**Priority**: Medium

### Grid and Snapping

**Grid**: Visual reference grid on floor  
**Snapping**: Snap to grid increments  
**Toggle**: G key for grid, Ctrl for snap  
**Priority**: Medium

### Prefab System

**Definition**: Reusable object templates  
**Storage**: JSON prefab library  
**Instantiation**: Drag from palette  
**Priority**: Low

## Progression System (Future)

### Editor Modes

1. **Free Mode** (current): No restrictions, full creative freedom
2. **Challenge Mode**: Build specific structures with constraints
3. **Puzzle Mode**: Solve spatial puzzles using objects
4. **Game Mode**: Play created levels with objectives

### Unlockables

- Additional object types
- Material presets
- Lighting options
- Environment themes
- Advanced tools (gizmos, snapping)

## Audio Design (Not Implemented)

### Ambient Sounds

- Low rumble (room tone)
- Distant echoes
- Electrical hum (flickering light)
- Subtle wind/air movement

### Interaction Sounds

- Object creation: Soft "pop"
- Object selection: Click/beep
- Slider adjustment: Subtle scrape
- Object deletion: Fade-out whoosh

### Music

- Dark ambient drone
- Minimal, non-intrusive
- Builds tension slowly
- Optional toggle

## Performance Targets

### Frame Rate

- **Target**: 60 fps
- **Minimum**: 30 fps
- **Degradation**: Reduce quality if below 30 fps

### Object Limits

- **Recommended**: 50 objects
- **Maximum**: 100 objects (with optimizations)
- **Warning**: Display at 75 objects

### Draw Calls

- **Target**: < 20 draw calls
- **Current**: 5-7 + N objects (needs optimization)
- **Optimized**: 5-15 (with material pooling)

### Memory

- **Base**: 2.1 MB
- **Per Object**: 5 KB (current), 500 bytes (optimized)
- **Maximum**: 50 MB total

## Accessibility

### Controls (v1.1.0)

**Keyboard Navigation**:
- ✅ WASD movement (Play mode)
- ✅ Keyboard shortcuts for all major actions
- ✅ E key for mode switching
- ✅ Delete, Ctrl+D, Ctrl+S, Ctrl+O, F, Escape
- ✅ No complex key combinations (max 2 keys)

**Mouse Controls**:
- ✅ Right-click camera rotation (Editor mode)
- ✅ Middle-click panning
- ✅ Scroll wheel zoom
- ✅ Left-click selection
- ✅ GUI button clicks

**Input Flexibility**:
- ✅ Keyboard-only workflow possible (with shortcuts)
- ✅ Mouse-only workflow possible (with GUI)
- ✅ Combined keyboard+mouse optimal

### Visual Accessibility

**High Contrast**:
- ✅ White text on dark background (#2a2a2a)
- ✅ Blue accent color (#4a9eff) for headers
- ✅ Red delete button (#cc0000) for danger
- ✅ Yellow selection highlight (high visibility)

**UI Design**:
- ✅ Large clickable areas (30-40px buttons)
- ✅ Clear visual feedback (hover, selection)
- ✅ Consistent layout and spacing
- ✅ Readable font sizes (12-18px)

**Visual Feedback**:
- ✅ Selection highlight (yellow outline)
- ✅ Hover effects (button background change)
- ✅ Active state indicators (blue highlight)
- ✅ Console logs for actions

### Future Improvements

**Keyboard**:
- [ ] Customizable key bindings
- [ ] Keyboard shortcut overlay (H key)
- [ ] Tab navigation through UI
- [ ] Arrow key object selection

**Visual**:
- [ ] Colorblind-friendly palette options
- [ ] Adjustable UI scale (zoom)
- [ ] High contrast mode toggle
- [ ] Dark/light theme options

**Assistive Technology**:
- [ ] Screen reader support for GUI
- [ ] ARIA labels for controls
- [ ] Keyboard focus indicators
- [ ] Voice command support (experimental)

## Technical Constraints

### Browser Requirements

- WebGL 2.0 support
- Pointer Lock API
- ES6+ JavaScript
- Canvas element support

### Performance Limitations

- Single-threaded rendering
- No GPU instancing (current)
- Material proliferation issue
- Memory leaks (current)

### Network Requirements

- None (fully client-side)
- Optional: Cloud save/load (future)

## Monetization (N/A)

This is a free, open-source development tool. No monetization planned.

## Analytics & Metrics (Not Implemented)

### Usage Tracking

- Objects created per session
- Average session duration
- Most used object types
- Property edit frequency

### Performance Tracking

- Average FPS
- Draw call distribution
- Memory usage patterns
- Error frequency

### User Behavior

- Navigation patterns
- GUI interaction frequency
- Object placement heatmaps
- Feature usage statistics

## Future Game Modes

### Survival Mode

- Spawn enemies in the room
- Use created objects as defenses
- Limited resources
- Wave-based progression

### Puzzle Mode

- Pre-placed objects
- Specific goal (reach exit, activate switches)
- Physics-based challenges
- Time limits

### Multiplayer (Ambitious)

- Shared editing space
- Real-time collaboration
- Object ownership
- Chat/voice communication

## Narrative Context (Future)

### Setting

Abandoned research facility conducting experiments on spatial manipulation and reality bending.

### Backstory

Player is a researcher who discovered the ability to create and manipulate objects through a mysterious device. The flickering lights and oppressive atmosphere hint at something gone wrong.

### Environmental Storytelling

- Worn, institutional architecture
- Unstable lighting (power issues)
- Empty, echoing space (evacuation?)
- Greenish walls (chemical exposure?)

### Potential Story Beats

1. Discovery of object creation ability
2. Experimentation and mastery
3. Realization of facility's dark purpose
4. Escape or confrontation
5. Choice: Destroy or control the technology

## Conclusion

The current implementation provides a solid foundation for a first-person horror game with atmospheric environmental design. The spooky aesthetic creates an engaging and tense atmosphere. Future development should focus on:

1. Performance optimizations (material pooling, instancing)
2. Enhanced editing tools (deletion, duplication, gizmos)
3. Save/load functionality
4. Physics integration
5. Additional object types and properties

The architecture supports extension into a full game with objectives, challenges, and narrative elements while maintaining its core utility as a development tool.
