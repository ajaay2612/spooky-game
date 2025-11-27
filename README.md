# Spooky Game

A 3D first-person spooky game built with Babylon.js. Features a dark atmospheric environment with flickering lights and eerie ambiance. Includes developer tools for real-time object manipulation during development.

## Features

### Dual Camera System
- **Editor Camera**: ArcRotateCamera for scene editing with orbit controls
- **Player Camera**: First-person UniversalCamera for gameplay testing
- **Seamless Switching**: Toggle between modes with E key
- **Camera Focus**: F key to focus on selected object

### Scene Editor
- **Object Creation**: Create primitives (Box, Sphere, Cylinder, Cone, Plane, Torus)
- **Light System**: Add Point, Directional, Spot, and Hemispheric lights
- **GLTF Import**: Import 3D models (.gltf, .glb files)
- **Object Selection**: Visual highlighting with yellow outline
- **Property Editing**: Real-time position, rotation, scale, and material editing
- **Scene Hierarchy**: Tree view of all scene objects
- **Save/Load**: Serialize and deserialize scenes to JSON

### Object Manipulation
- **Transform Gizmos**: Visual Move, Rotate, and Scale gizmos for interactive manipulation
- **Transform Controls**: Edit position, rotation (degrees), and scale via input fields
- **Material Editor**: Adjust diffuse, specular, and emissive colors with RGB sliders
- **Light Editor**: Control intensity and color of light sources
- **Duplication**: Clone objects with Ctrl+D
- **Deletion**: Remove objects with Delete key or GUI button
- **Renaming**: Edit object names directly in property panel
- **Uniform Scaling**: Lock aspect ratio option for proportional scaling

### Object Interaction System
- **Raycast Detection**: Automatically detects interactable objects in view
- **Visual Feedback**: Crosshair changes color when targeting interactable objects
- **Lock-On Mode**: Press F to lock camera onto focused object
- **Smooth Camera Animation**: Animated transition to interaction position
- **Interaction Prompt**: "Press [F] to Interact" displayed when targeting objects
- **Exit Lock-On**: Press Escape or F again to return to normal camera

### Interactive CRT Monitor System
- **HTML Frame Rendering**: Renders HTML content onto 3D monitor mesh
- **Keyboard Navigation**: Arrow keys/WASD to navigate, Enter to select
- **Frame Transitions**: Navigate between different screens (main menu, game start, credits)
- **Text Input Support**: Interactive forms with keyboard input
- **M Key Toggle**: Activate/deactivate monitor interaction
- **CRT Aesthetic**: Green-on-black terminal styling with emissive glow

### Spooky Atmosphere
- **Dark Environment**: Oppressive 20x20 unit enclosed room
- **Flickering Lights**: Dynamic point light with eerie yellow-orange glow
- **Dim Ambient**: Low-intensity hemispheric lighting for tension

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Controls

### Editor Mode (Default)
- **Right Mouse Button**: Rotate camera (ArcRotateCamera)
- **Middle Mouse Button**: Pan camera
- **Mouse Wheel**: Zoom in/out
- **Left Click**: Select objects in scene
- **E Key**: Toggle between Editor and Play mode
- **Delete Key**: Delete selected object
- **Ctrl+D**: Duplicate selected object
- **Ctrl+S**: Save scene to JSON file
- **Ctrl+O**: Load scene from JSON file
- **F Key**: Focus camera on selected object
- **Escape**: Deselect current object

### Play Mode
- **Mouse**: Look around (pointer lock enabled)
- **E Key**: Return to Editor mode
- **F Key**: Interact with focused object (lock-on mode)
- **Escape**: Exit lock-on mode
- **M Key**: Toggle monitor interaction (activate/deactivate)

### Monitor Interaction (When Active)
- **Arrow Keys / WASD**: Navigate between interactive elements
- **Enter**: Activate selected element (transition or input)
- **Escape**: Exit input mode
- **Type**: Enter text in input fields
- **M Key**: Deactivate monitor and return to normal controls

### GUI Panels
- **Object Palette** (Left): Create primitives (Box, Sphere, Cylinder, Cone, Plane, Torus), lights, and import GLTF models
- **Property Panel** (Right): Edit position, rotation, scale, and material properties of selected objects
- **Scene Hierarchy** (Left Bottom): View and select all objects in the scene

## Architecture

### Core Classes

#### Editor System
- **EditorManager**: Main orchestrator for editor mode, handles keyboard shortcuts and mode switching
- **CameraManager**: Manages dual camera system (Editor ArcRotateCamera + Player UniversalCamera)
- **SelectionManager**: Handles object selection with visual highlighting using HighlightLayer
- **SerializationManager**: Scene save/load functionality with JSON serialization

#### UI Components
- **ObjectPalette**: Left panel for creating primitives, lights, and importing models
- **PropertyPanel**: Right panel for editing object properties (transform, material, lights)
- **SceneHierarchy**: Left bottom panel showing tree view of all scene objects

#### Monitor System
- **MonitorController**: Manages interactive CRT monitor with HTML frame rendering
- **HTML-to-Texture Pipeline**: Uses html2canvas to render HTML onto 3D monitor mesh
- **Frame Configuration**: JSON-based frame system with transition validation
- **Keyboard-Only Navigation**: Accessible navigation without mouse

#### Scene System
- **ObjectFactory**: Centralized object creation with consistent configuration and material pooling

### Scene Structure

- **Room**: 20x20 unit enclosed space with floor, walls, and ceiling (static, non-editable)
- **Lighting**: Dim hemispheric light + flickering point light for atmosphere
- **Objects**: User-created primitives, lights, and imported models
- **Cameras**: Dual camera system (editor + player) with seamless switching

## Performance

**Status**: ✅ Optimized (v1.1.0)

### Key Metrics
- **Bundle Size**: 90.59 KB (20.84 KB gzipped) - Application code only
- **Draw Calls**: 5-17 (capped)
- **FPS**: 60 fps with 100+ objects
- **VRAM per object**: ~500 bytes

### Optimizations Applied
✅ Material pooling (6-7x draw call reduction)  
✅ Mesh instancing (10x VRAM reduction)  
✅ Resource disposal (memory leaks eliminated)  
✅ Production ready (console logs removed)

**See [PERFORMANCE.md](PERFORMANCE.md) for detailed metrics and analysis.**

## Technology Stack

- **Babylon.js 7.54.3**: 3D engine
- **Babylon.js GUI 7.54.3**: UI system
- **Babylon.js Loaders 7.54.3**: GLTF/GLB model loading
- **Babylon.js Addons 7.54.3**: HtmlMesh for HTML rendering
- **Vite 5.4.11**: Build tool and dev server
- **ESLint 8.57.0**: Code quality
- **Express 4.18.2**: Scene save/load server
- **CORS 2.8.5**: Cross-origin resource sharing

## Development

### Status Endpoint

The dev server exposes a `/status` endpoint for monitoring:

```bash
# GET current application state
curl http://localhost:5173/status

# POST to update application state
curl -X POST http://localhost:5173/status -H "Content-Type: application/json" -d '{"status":"active"}'
```

### Project Structure

```
spooky-game/
├── index.html                      # Entry HTML with Babylon.js CDN
├── main.js                         # Main application entry point
├── style.css                       # Minimal styles
├── vite.config.js                  # Vite configuration with status server
├── package.json                    # Dependencies
├── src/
│   ├── editor/
│   │   ├── EditorManager.js        # Main editor orchestrator
│   │   ├── CameraManager.js        # Dual camera system
│   │   ├── SelectionManager.js     # Object selection with highlighting
│   │   ├── SerializationManager.js # Scene save/load
│   │   ├── ObjectPalette.js        # Object creation UI
│   │   ├── PropertyPanel.js        # Property editing UI
│   │   ├── SceneHierarchy.js       # Scene tree view UI
│   │   └── SettingsPanel.js        # Post-processing settings UI
│   ├── monitor/
│   │   ├── MonitorController.js    # Interactive CRT monitor system
│   │   ├── frames/                 # HTML frame files
│   │   │   ├── main-menu.html      # Main menu screen
│   │   │   ├── game-start.html     # Game start screen
│   │   │   ├── credits.html        # Credits screen
│   │   │   └── frames-config.json  # Frame configuration
│   │   └── README.md               # Monitor system documentation
│   └── scene/
│       └── ObjectFactory.js        # Centralized object creation
├── docs/
│   ├── PERFORMANCE.md              # Performance metrics and analysis
│   ├── ARCHITECTURE.md             # System design documentation
│   ├── GAME_DESIGN.md              # Gameplay mechanics and design
│   ├── CHANGELOG.md                # Version history
│   └── STEERING.md                 # Architectural decisions and standards
└── PRE_PUSH_VALIDATION_REPORT.md   # Comprehensive validation report
```

## Security

- No hardcoded credentials or API keys
- `.env` files properly gitignored
- Dependencies scanned for vulnerabilities

### Known Vulnerabilities
⚠️ **esbuild** (moderate): Development-only vulnerability in Vite's esbuild dependency
- **Impact**: Development server only, not production builds
- **CVSS Score**: 5.3 (Medium)
- **CWE**: CWE-346 (Origin Validation Error)
- **Fix Available**: Upgrade to Vite 7.x (breaking changes)
- **Risk Assessment**: Low - only affects development environment, not production builds

## Browser Compatibility

- Modern browsers with WebGL 2.0 support
- Tested on Chrome, Firefox, Edge
- Requires pointer lock API support

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run validation: `npm run build`
5. Submit a pull request

## Roadmap

### Completed ✅
- [x] Implement material pooling (performance) ✅ v1.1.0
- [x] Add resource disposal methods (memory leaks) ✅ v1.1.0
- [x] Enable mesh instancing (VRAM optimization) ✅ v1.1.0
- [x] Add object deletion feature ✅ v1.1.0
- [x] Implement save/load scene functionality ✅ v1.1.0
- [x] Add more object types (cylinders, cones, torus, plane) ✅ v1.1.0
- [x] Lighting controls in GUI ✅ v1.1.0
- [x] Dual camera system (editor + player) ✅ v1.1.0
- [x] Scene hierarchy panel ✅ v1.1.0
- [x] GLTF model import ✅ v1.1.0
- [x] Object duplication ✅ v1.1.0
- [x] Transform gizmos (Move, Rotate, Scale) ✅ v1.1.0

### Planned 🎯
- [ ] Story progression system (complete machine interactions)
- [ ] Physics integration (collision detection, gravity)
- [ ] Texture support and texture editor
- [ ] Performance monitoring GUI (FPS, draw calls, memory)
- [ ] Undo/Redo system
- [ ] Multi-selection support
- [ ] Grid and snapping
- [ ] Prefab system
- [ ] Animation timeline
- [ ] Monitor frame animations (fade, slide transitions)
- [ ] Multiple monitor support
- [ ] Mouse support for monitor (raycasting)
- [ ] Audio system (ambient sounds, interaction feedback)
