# Project Steering Rules

This document contains architectural decisions, coding standards, and development guidelines for the Spooky Game project.

## Project Overview

**Name**: Spooky Game  
**Type**: 3D First-Person Spooky Game  
**Engine**: Babylon.js 7.31.0  
**Build Tool**: Vite 5.4.11  
**Language**: JavaScript (ES6+)

## Architectural Decisions

### 1. Class-Based Architecture

**Decision**: Use ES6 classes for major components (CameraController, SceneManager, GUIManager)

**Rationale**:
- Clear separation of concerns
- Encapsulation of related functionality
- Easy to extend and maintain
- Familiar pattern for developers

**Implementation**:
```javascript
class ComponentName {
  constructor(dependencies) {
    // Initialize properties
  }
  
  methodName() {
    // Implementation
  }
}
```

### 2. Single Scene Architecture

**Decision**: Use one Babylon.js scene for the entire application

**Rationale**:
- Simpler state management
- No scene switching overhead
- Appropriate for single-level game
- Easy to serialize/deserialize

**Trade-offs**:
- Cannot easily switch environments
- All objects share same lighting
- Future: May need multi-scene for complex projects

### 3. GUI Overlay Pattern

**Decision**: Use Babylon.js GUI as overlay, not world-space UI

**Rationale**:
- Always visible and accessible
- No occlusion by 3D objects
- Consistent positioning
- Better for development/debug UI

### 4. No Physics by Default

**Decision**: Disable physics and collisions initially

**Rationale**:
- Editor mode needs free movement
- Physics adds complexity
- Can be enabled later for game mode
- Reduces performance overhead

**Implementation**:
```javascript
scene.collisionsEnabled = false;
```

### 5. Material-Per-Object Pattern (TO BE CHANGED)

**Current Decision**: Each object gets unique material

**Issue**: Causes performance problems (draw call proliferation)

**Future Decision**: Implement material pooling
- Create 10-20 shared materials
- Reuse materials across objects
- See `performance-fixes.md` for implementation

### 6. No State Management Library

**Decision**: Use plain JavaScript objects for state

**Rationale**:
- Simple application state
- No need for Redux/MobX complexity
- Easy to understand
- Can migrate later if needed

**Current State**:
```javascript
const appState = {
  status: 'active',
  errors: [],
  scene: { objectCount, rendering, fps }
};
```

## Coding Standards

### Naming Conventions

**Classes**: PascalCase
```javascript
class CameraController { }
class SceneManager { }
```

**Methods/Functions**: camelCase
```javascript
setupCamera() { }
addBox() { }
```

**Constants**: UPPER_SNAKE_CASE
```javascript
const MAX_OBJECTS = 100;
const DEFAULT_SPEED = 0.5;
```

**Private Properties**: Prefix with underscore (convention)
```javascript
this._internalState = {};
```

**Babylon.js Objects**: Descriptive names
```javascript
const floor = BABYLON.MeshBuilder.CreateGround("floor", ...);
const boxMat = new BABYLON.StandardMaterial("boxMat", scene);
```

### Code Organization

**File Structure**:
```
main.js
├── Global state and error handling
├── CameraController class
├── SceneManager class
├── GUIManager class
└── Initialization and render loop
```

**Class Structure**:
```javascript
class ClassName {
  // 1. Constructor
  constructor() { }
  
  // 2. Setup methods
  setupComponent() { }
  
  // 3. Public methods
  publicMethod() { }
  
  // 4. Private methods (underscore prefix)
  _privateMethod() { }
  
  // 5. Getters/Setters
  getProperty() { }
}
```

### Error Handling

**Global Handlers**: Catch all uncaught errors
```javascript
window.addEventListener('error', (event) => {
  console.error('Application error:', event.error);
  appState.errors.push(errorInfo);
});
```

**Scene Errors**: Use Babylon.js observables
```javascript
if (scene.onErrorObservable) {
  scene.onErrorObservable.add((error) => {
    // Handle scene errors
  });
}
```

**Defensive Checks**: Validate before operations
```javascript
if (mesh && mesh.material) {
  mesh.material.emissiveColor = color;
}
```

### Performance Guidelines

**DO**:
- Reuse materials when possible
- Use mesh instancing for duplicates
- Freeze world matrices for static objects
- Disable picking for non-interactive objects
- Dispose resources when done

**DON'T**:
- Create materials in loops
- Create new geometry for identical objects
- Update transforms unnecessarily
- Keep references to disposed objects
- Use console.log in production

### Memory Management

**Resource Lifecycle**:
1. Create → Use → Dispose
2. Always pair creation with disposal
3. Store references for cleanup
4. Unregister observers before disposal

**Disposal Pattern**:
```javascript
class Manager {
  dispose() {
    // Dispose managed resources
    this.objects.forEach(obj => obj.dispose());
    
    // Clear arrays
    this.objects = [];
    
    // Unregister observers
    if (this.observer) {
      scene.onBeforeRenderObservable.remove(this.observer);
    }
  }
}
```

## Development Workflow

### Before Committing

1. **Run build**: `npm run build`
2. **Check for errors**: Review console output
3. **Test in browser**: Verify functionality
4. **Review changes**: Check git diff
5. **Update documentation**: If API changed

### Before Pushing

1. **Run pre-push validation**: Use validation hook
2. **Review validation report**: Address critical issues
3. **Update CHANGELOG.md**: Document changes
4. **Check bundle size**: Ensure reasonable
5. **Verify no secrets**: Scan for credentials

### Adding New Features

1. **Plan architecture**: Consider impact on existing code
2. **Update steering docs**: Document decisions
3. **Implement feature**: Follow coding standards
4. **Add documentation**: Update README/ARCHITECTURE
5. **Test thoroughly**: Manual testing required
6. **Update CHANGELOG**: Document new feature

## Babylon.js Specific Guidelines

### Scene Setup

**Order of Operations**:
1. Create engine
2. Create scene
3. Create camera
4. Create lights
5. Create geometry
6. Setup materials
7. Start render loop

### Camera Configuration

**First-Person Camera**:
- Use `UniversalCamera` for FPS controls
- Position at eye level (1.6m)
- Configure WASD keys explicitly
- Enable pointer lock for mouse look

### Material Creation

**Standard Materials**:
```javascript
const mat = new BABYLON.StandardMaterial("name", scene);
mat.diffuseColor = new BABYLON.Color3(r, g, b);
mat.specularColor = new BABYLON.Color3(r, g, b);
```

**Material Pooling** (recommended):
```javascript
// Create pool in constructor
this.materials = [];
for (let i = 0; i < 10; i++) {
  const mat = new BABYLON.StandardMaterial(`mat_${i}`, scene);
  this.materials.push(mat);
}

// Reuse from pool
const mat = this.materials[index % this.materials.length];
```

### Mesh Creation

**Direct Creation**:
```javascript
const mesh = BABYLON.MeshBuilder.CreateBox("name", { size: 1 }, scene);
```

**Instancing** (recommended for duplicates):
```javascript
// Create master (once)
this.masterBox = BABYLON.MeshBuilder.CreateBox("master", { size: 1 }, scene);
this.masterBox.isVisible = false;

// Create instances
const instance = this.masterBox.createInstance("instance_name");
```

### GUI Creation

**FullscreenUI Pattern**:
```javascript
const advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
const panel = new GUI.StackPanel();
advancedTexture.addControl(panel);
```

**Control Naming**:
- Use descriptive names
- Include timestamp for uniqueness if dynamic
- Example: `btn_AddBox_${Date.now()}`

## Testing Strategy (Future)

### Unit Tests

**Framework**: Vitest (recommended)

**Coverage Targets**:
- Core classes: 80%+
- Utility functions: 90%+
- UI interactions: 60%+

**Test Structure**:
```javascript
describe('SceneManager', () => {
  it('should create box at specified position', () => {
    // Test implementation
  });
});
```

### Integration Tests

**Framework**: Playwright (recommended)

**Test Scenarios**:
- Object creation flow
- Selection and property editing
- Camera movement
- GUI interactions

### Performance Tests

**Metrics to Track**:
- FPS with varying object counts
- Memory usage over time
- Draw call count
- Bundle size

## Security Guidelines

### Secrets Management

**DO**:
- Use `.env` files for secrets (gitignored)
- Access via `import.meta.env.VITE_*`
- Never commit `.env` to repository
- Use `.env.example` for documentation

**DON'T**:
- Hardcode API keys in source
- Commit credentials to git
- Expose secrets in client-side code
- Log sensitive information

### Input Validation

**Current State**: Limited user input (sliders only)

**Future Considerations**:
- Validate text input if added
- Sanitize file uploads
- Limit object creation rate
- Validate position/rotation ranges

## Performance Targets

### Frame Rate

- **Target**: 60 fps
- **Minimum**: 30 fps
- **Action**: Reduce quality if below 30 fps

### Object Limits

- **Recommended**: 50 objects
- **Maximum**: 100 objects
- **Warning**: Display at 75 objects

### Bundle Size

- **Current**: 5.32 MB (acceptable for 3D engine)
- **Target**: < 5 MB
- **Action**: Code splitting if exceeds 10 MB

### Memory

- **Base**: 2.1 MB
- **Per Object**: 500 bytes (with optimizations)
- **Maximum**: 50 MB total

## Dependencies Policy

### Adding Dependencies

**Before Adding**:
1. Check bundle size impact
2. Review security vulnerabilities
3. Verify maintenance status
4. Consider alternatives
5. Document decision

**Prefer**:
- Well-maintained packages
- Small bundle size
- TypeScript definitions
- Active community

**Avoid**:
- Abandoned packages
- Known vulnerabilities
- Excessive dependencies
- Duplicate functionality

### Updating Dependencies

**Process**:
1. Review CHANGELOG for breaking changes
2. Update one major dependency at a time
3. Test thoroughly after update
4. Update documentation if API changed
5. Monitor for issues

## Documentation Standards

### Code Comments

**When to Comment**:
- Complex algorithms
- Non-obvious decisions
- Performance optimizations
- Workarounds for bugs
- Public API methods

**When NOT to Comment**:
- Obvious code
- Self-explanatory names
- Redundant descriptions

**JSDoc Format** (future):
```javascript
/**
 * Creates a new box mesh at the specified position
 * @param {BABYLON.Vector3} position - World position for the box
 * @returns {BABYLON.Mesh} The created box mesh
 */
addBox(position) { }
```

### README Updates

**Update When**:
- Adding new features
- Changing controls
- Modifying architecture
- Updating dependencies
- Changing requirements

### CHANGELOG Format

**Follow**: Keep a Changelog format

**Sections**:
- Added: New features
- Changed: Changes to existing
- Deprecated: Soon-to-be removed
- Removed: Removed features
- Fixed: Bug fixes
- Security: Security fixes

## Future Considerations

### TypeScript Migration

**When**: After core features stable

**Benefits**:
- Type safety
- Better IDE support
- Catch errors early
- Self-documenting code

**Migration Path**:
1. Add TypeScript to devDependencies
2. Create tsconfig.json
3. Rename .js to .ts incrementally
4. Add type annotations
5. Fix type errors

### State Management

**When**: State becomes complex

**Options**:
- Zustand (lightweight)
- Redux (full-featured)
- MobX (reactive)

**Trigger**: 
- Multiple components need shared state
- Complex state updates
- Need time-travel debugging

### Testing Infrastructure

**Priority**: High (currently 0% coverage)

**Implementation**:
1. Add Vitest for unit tests
2. Add Playwright for E2E tests
3. Setup CI/CD pipeline
4. Aim for 80% coverage

### Physics Integration

**When**: Adding game mode

**Library**: Babylon.js built-in (Cannon.js or Ammo.js)

**Considerations**:
- Performance impact
- Collision complexity
- Physics simulation cost
- Mobile compatibility

---

## Questions or Clarifications?

For architectural decisions not covered here, refer to:
- `ARCHITECTURE.md` - System design details
- `PERFORMANCE.md` - Performance metrics and optimization guide
- `GAME_DESIGN.md` - Gameplay mechanics and design

**When in doubt**: Follow existing patterns in the codebase.
