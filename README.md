# Spooky Game

A 3D first-person spooky game built with Babylon.js. Features a dark atmospheric environment with flickering lights and eerie ambiance. Includes developer tools for real-time object manipulation during development.

## Features

- **First-Person Camera**: WASD movement with mouse look (pointer lock)
- **Spooky Atmosphere**: Dark environment with flickering lights and eerie ambiance
- **Enclosed Room**: 20x20 unit space with oppressive walls and dim lighting

### Developer Tools (Development Mode)
- **Object Creation**: Add boxes and spheres for testing
- **Property Panel**: Adjust position and color of objects via GUI sliders
- **Real-time Manipulation**: Select and modify objects in the scene

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

- **WASD**: Move camera
- **Mouse**: Look around (click canvas to lock pointer)
- **Left Click**: Select objects
- **GUI Buttons**: Add Box, Add Sphere, Delete Selected
- **Property Sliders**: Adjust position (X, Y, Z) and color (RGB) of selected objects

## Architecture

### Core Classes

- **CameraController**: Manages first-person camera with WASD controls and pointer lock
- **SceneManager**: Handles scene setup, room geometry, lighting, and object management
- **GUIManager**: Creates and manages the developer GUI panel with buttons and property editors

### Scene Structure

- **Room**: 20x20 unit enclosed space with floor, walls, and ceiling
- **Lighting**: Dim hemispheric light + flickering point light for atmosphere
- **Objects**: Dynamically created boxes and spheres with random colors

## Performance

**Status**: ✅ Optimized (v1.1.0)

### Key Metrics
- **Bundle Size**: 5.56 MB (1.22 MB gzipped)
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

- **Babylon.js 7.31.0**: 3D engine
- **Babylon.js GUI 7.31.0**: UI system
- **Vite 5.4.11**: Build tool and dev server
- **ESLint 8.57.0**: Code quality

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
├── index.html              # Entry HTML
├── main.js                 # Main application code
├── style.css               # Minimal styles
├── vite.config.js          # Vite configuration with status server
├── package.json            # Dependencies
├── PERFORMANCE.md          # Performance metrics and analysis
├── ARCHITECTURE.md         # System design documentation
├── GAME_DESIGN.md          # Gameplay mechanics and design
└── CHANGELOG.md            # Version history
```

## Security

- No hardcoded credentials or API keys
- `.env` files properly gitignored
- Dependencies scanned for vulnerabilities

### Known Vulnerabilities
⚠️ **esbuild** (moderate): Development-only vulnerability in Vite's esbuild dependency
- **Impact**: Development server only, not production builds
- **Fix Available**: Upgrade to Vite 7.x (breaking changes)

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

- [x] Implement material pooling (performance) ✅ v1.1.0
- [x] Add resource disposal methods (memory leaks) ✅ v1.1.0
- [x] Enable mesh instancing (VRAM optimization) ✅ v1.1.0
- [x] Add object deletion feature ✅ v1.1.0
- [ ] Implement save/load scene functionality
- [ ] Add more object types (cylinders, cones, custom meshes)
- [ ] Physics integration (collision detection)
- [ ] Texture support
- [ ] Lighting controls in GUI
- [ ] Performance monitoring GUI (FPS, draw calls)
