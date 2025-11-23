# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **Transform Gizmos**: Interactive visual manipulation tools
  - Move Gizmo: Position objects with visual handles
  - Scale Gizmo: Scale objects with uniform/non-uniform modes
  - Uniform Scaling: Lock aspect ratio checkbox for proportional scaling
  - Gizmo toggle buttons in Property Panel
- **Object Factory**: Centralized object creation with material pooling
- **Keyboard Shortcuts**: E (mode toggle), Delete, Ctrl+D, Ctrl+S, Ctrl+O, F, Escape
- **Object Types**: Cylinder, Cone, Plane, Torus primitives
- **Light Types**: Point, Directional, Spot, Hemispheric lights
- **GLTF Import**: Load .gltf and .glb 3D models
- **Object Duplication**: Clone objects with Ctrl+D
- **Camera Focus**: Focus on selected object with F key
- **Object Renaming**: Edit object names in property panel
- Material pooling system with 10 reusable materials per object type
- Mesh instancing for boxes and spheres (80% VRAM reduction)
- Resource disposal methods for proper cleanup
- Cleanup on page unload (beforeunload event)

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
- **README.md**: Added transform gizmos (Move, Scale), uniform scaling feature, camera focus (F key), updated bundle size (37.45 KB app code), updated roadmap with rotation gizmo as next planned feature
- **GAME_DESIGN.md**: Added transform gizmo mechanics (Move, Scale with uniform mode), gizmo UI controls in Property Panel, interactive manipulation workflows
- **CHANGELOG.md**: Added transform gizmo features to v1.1.0 release notes
- **PRE_PUSH_VALIDATION_REPORT.md**: Comprehensive pre-push validation with code quality, security, performance, and build verification (current run)

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
