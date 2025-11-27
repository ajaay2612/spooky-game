# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### In Progress
- Additional machine interactions (buttons, dials, switches)
- Enhanced monitor frame system with animations
- Story progression mechanics

## [1.0.0] - 2025-11-21

### Added
- Initial release of Spooky Game
- First-person camera controller with WASD movement and mouse look
- Pointer lock support for immersive camera control
- Object creation system (boxes and spheres)
- Real-time object selection via mouse click
- Developer GUI panel with object creation buttons
- Property editor with position sliders (X, Y, Z)
- Color picker with RGB sliders for selected objects
- Spooky atmospheric environment with dark room
- Flickering point light for eerie ambiance
- Status server endpoint for application monitoring
- Global error handling and status tracking
- Vite-based development and build system

### Scene Features
- 20x20 unit enclosed room with floor, walls, and ceiling
- Dark atmospheric lighting (dim hemispheric + flickering point)
- Placeholder objects (1 box, 1 sphere) on scene load
- Material system with random colors for created objects

### Developer Experience
- Hot module replacement via Vite
- ESLint configuration for code quality
- Status endpoint at `/status` for health monitoring
- Console logging for debugging

### Documentation
- README.md with quick start guide
- performance-fixes.md with optimization recommendations
- performance-recommendations.md with detailed analysis
- Inline code comments and JSDoc

### Known Issues
- Material proliferation causing linear draw call growth
- No resource disposal leading to memory leaks
- No mesh instancing (full geometry per object)
- Console.log statements in production build
- Bundle size warning (5.32 MB, exceeds 500 KB recommendation)

### Security
- esbuild moderate vulnerability (development only)
- Proper .gitignore configuration for .env files
- No hardcoded credentials in codebase

### Performance Metrics
- Bundle Size: 5.32 MB (production)
- Base Draw Calls: 5-7
- Base VRAM: ~2.1 MB
- Target FPS: 60

## [Unreleased]

### Planned
- Performance monitoring GUI
- Scene optimizer integration
- Save/load scene functionality
- Physics integration
- Additional object types
- Texture support

## [1.1.0] - 2025-11-22

### Added
- **Editor System**: Complete scene editor with dual camera system
  - EditorManager: Main orchestrator with keyboard shortcuts
  - CameraManager: ArcRotateCamera (editor) + UniversalCamera (player)
  - SelectionManager: Object selection with HighlightLayer highlighting
  - SerializationManager: Scene save/load to JSON files
- **UI Components**: Three-panel editor interface
  - ObjectPalette: Create primitives, lights, and import GLTF models
  - PropertyPanel: Edit transform, material, and light properties
  - SceneHierarchy: Tree view of all scene objects
  - SettingsPanel: Post-processing controls (AA, bloom, grain, etc.)
  - HtmlMeshAlignPanel: Debug tool for aligning HTML content to 3D meshes
- **Transform Gizmos**: Interactive visual manipulation tools
  - Move Gizmo: Position objects with visual handles
  - Rotate Gizmo: Rotate objects around X, Y, Z axes
  - Scale Gizmo: Scale objects with uniform/non-uniform modes
  - Uniform Scaling: Lock aspect ratio checkbox for proportional scaling
  - Gizmo toggle buttons in Property Panel
- **Object Interaction System** (Play Mode)
  - InteractionSystem class for detecting and interacting with objects
  - Raycast-based detection (5 unit range, throttled to every 5 frames)
  - Visual crosshair feedback (white default, green when targeting interactables)
  - "Press [F] to Interact" prompt when targeting objects
  - Lock-on mode with smooth camera animation to interaction position
  - Configurable camera positions per machine (InteractiveMachinesConfig)
  - Exit lock-on with Escape or F key
  - Pointer lock management (unlocked during lock-on for UI interaction)
  - Optimized for 75+ FPS with minimal overhead
- **Interactive CRT Monitor System**
  - MonitorController class for managing HTML frame rendering
  - HtmlMeshMonitor for rendering HTML to 3D mesh using @babylonjs/addons
  - HTML-to-texture pipeline with html2canvas fallback
  - Keyboard-only navigation (Arrow keys/WASD + Enter)
  - Frame configuration system (frames-config.json)
  - Three sample frames (main menu, game start, credits)
  - Dynamic texture rendering on 3D monitor mesh
  - Text input support for interactive forms
  - Frame transition validation system
  - M key toggle for monitor activation/deactivation
  - Emissive material for CRT glow effect
  - Non-blocking initialization with mesh observer
  - UV mapping correction (270° rotation, calibrated scaling)
  - Debug tools for texture adjustment
  - Corner markers test pattern for alignment verification
- **Machine Interactions System**
  - MachineInteractions class for interactive buttons, dials, switches
  - Button press animations with smooth transitions
  - Dial rotation mechanics
  - InteractiveMachinesConfig for centralized configuration
  - Action manager integration for click detection
- **Object Factory**: Centralized object creation with material pooling
- **Keyboard Shortcuts**: E (mode toggle), Delete, Ctrl+D, Ctrl+S, Ctrl+O, F, Escape, M (monitor), H (alignment panel)
- **Object Types**: Cylinder, Cone, Plane, Torus primitives
- **Light Types**: Point, Directional, Spot, Hemispheric lights
- **GLTF Import**: Load .gltf and .glb 3D models with proper transform handling
- **Object Duplication**: Clone objects with Ctrl+D
- **Camera Focus**: Focus on selected object with F key
- **Object Renaming**: Edit object names in property panel
- **Post-Processing Pipeline**: MSAA, FXAA, tone mapping, vignette, chromatic aberration, grain, sharpen
- Material pooling system with 10 reusable materials per object type
- Mesh instancing for boxes and spheres (80% VRAM reduction)
- Resource disposal methods for proper cleanup
- Cleanup on page unload (beforeunload event)
- Debug helper tools (alignment, position, camera lock-on, button animation, dial rotation)

### Changed
- **Architecture**: Modular class-based design with separation of concerns
- **File Structure**: Organized into src/editor/ and src/scene/ directories
- **Camera System**: Dual camera with seamless mode switching
- **Selection**: Visual highlighting with yellow outline (HighlightLayer)
- **Property Editing**: Dynamic UI with transform, material, and light controls
- Objects now use instances instead of full geometry copies
- Materials are reused from pool instead of creating unique materials
- Flicker animation now uses stored observer reference for cleanup
- Default object spawn position changed to (0, 1, 0)

### Removed
- Old monolithic main.js structure (preserved in main-backup.js)
- Console.log statements from production code (moved to main.js for debugging)

### Fixed
- Memory leaks from undisposed materials and observers
- Material proliferation causing linear draw call growth
- Missing resource cleanup on scene destruction
- VRAM waste from duplicate geometry

### Performance
- Draw calls reduced from 5-7+N to 5-17 (capped)
- VRAM per object reduced from ~5 KB to ~500 bytes
- Memory leaks eliminated
- 5-10x performance improvement with 100+ objects

### Documentation
- **README.md**: Complete feature documentation including interaction system, monitor system, machine interactions, all UI panels, keyboard shortcuts, and project structure
- **GAME_DESIGN.md**: Comprehensive game design with mechanics, controls, object types, UI layout, monitor system, interaction system, and future roadmap
- **ARCHITECTURE.md**: System architecture with all 16 classes documented, data flow diagrams, component interactions, and extension points
- **PERFORMANCE.md**: Performance metrics, optimization results, bundle analysis, and testing guidelines
- **CHANGELOG.md**: Complete version history with detailed feature additions and technical changes
- **src/monitor/README.md**: Monitor system documentation with architecture, usage, API, and troubleshooting
- **PRE_PUSH_VALIDATION_REPORT.md**: Comprehensive pre-push validation report (this run)

---

## Version History

### Version Numbering
- **Major**: Breaking API changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, backward compatible

### Release Notes Format
- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security vulnerability fixes
