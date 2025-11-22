# Babylon.js Performance Optimization Recommendations

## Critical Issues

### 1. Material Proliferation (HIGHEST PRIORITY)
**Problem**: Each object creates a unique material, causing excessive draw calls.

**Current Code**:
```javascript
const material = new BABYLON.StandardMaterial(`boxMat_${Date.now()}`, this.scene);
```

**Solution**: Use a material pool or shared materials:
```javascript
// In SceneManager constructor
this.materialPool = new Map();

getMaterial(color) {
  const key = `${color.r}_${color.g}_${color.b}`;
  if (!this.materialPool.has(key)) {
    const mat = new BABYLON.StandardMaterial(`mat_${key}`, this.scene);
    mat.diffuseColor = color;
    this.materialPool.set(key, mat);
  }
  return this.materialPool.get(key);
}
```

**Impact**: Reduces draw calls from N to ~10-20 (number of unique colors)

### 2. Memory Leaks - No Disposal
**Problem**: Resources are never cleaned up.

**Solution**: Add disposal methods:
```javascript
// In SceneManager
removeObject(mesh) {
  const index = this.objects.indexOf(mesh);
  if (index > -1) {
    this.objects.splice(index, 1);
    if (mesh.material) {
      // Only dispose if not shared
      mesh.material.dispose();
    }
    mesh.dispose();
  }
}

// In GUIManager.updateForSelectedObject()
this.propertyPanel.children.forEach(child => child.dispose());
this.propertyPanel.clearControls();
```

### 3. Use Mesh Instancing
**Problem**: Each box/sphere creates new geometry.

**Solution**: Create master meshes and use instances:
```javascript
// In SceneManager constructor
this.masterBox = BABYLON.MeshBuilder.CreateBox("masterBox", { size: 1 }, this.scene);
this.masterBox.isVisible = false;
this.masterSphere = BABYLON.MeshBuilder.CreateSphere("masterSphere", { diameter: 1 }, this.scene);
this.masterSphere.isVisible = false;

addBox(position) {
  const instance = this.masterBox.createInstance(`box_${Date.now()}`);
  instance.position = position;
  const color = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
  instance.material = this.getMaterial(color);
  this.objects.push(instance);
  return instance;
}
```

**Impact**: Reduces VRAM usage by ~90% for geometry

## Medium Priority Issues

### 4. Optimize Flickering Light
**Problem**: `registerBeforeRender()` creates closure overhead.

**Solution**: Move to class properties:
```javascript
// In SceneManager
this.flickerTimer = 0;
this.targetIntensity = 0.3;
this.currentIntensity = 0.3;

this.scene.registerBeforeRender(() => {
  this.flickerTimer++;
  if (this.flickerTimer % 15 === 0) {
    this.targetIntensity = 0.3 + (Math.random() - 0.5) * 0.2;
  }
  this.currentIntensity += (this.targetIntensity - this.currentIntensity) * 0.1;
  pointLight.intensity = this.currentIntensity;
});
```

### 5. Enable Scene Optimizations
**Problem**: Missing Babylon.js optimization flags.

**Solution**: Add to scene setup:
```javascript
// After scene creation
scene.autoClear = false; // Don't clear every frame if not needed
scene.autoClearDepthAndStencil = false;

// If room is static
scene.blockMaterialDirtyMechanism = true;

// For static room geometry
floor.freezeWorldMatrix();
[backWall, frontWall, leftWall, rightWall, ceiling].forEach(wall => {
  wall.freezeWorldMatrix();
});
```

### 6. Add Object Limit Warning
**Problem**: No protection against creating too many objects.

**Solution**:
```javascript
addBox(position) {
  if (this.objects.length >= 100) {
    console.warn('Object limit reached. Performance may degrade.');
    return null;
  }
  // ... rest of code
}
```

## Low Priority Enhancements

### 7. Add Scene Statistics
**Solution**: Expose performance metrics:
```javascript
// In render loop
if (frameCount % 60 === 0) { // Every 60 frames
  console.log('Draw calls:', scene.getEngine().drawCalls);
  console.log('Active meshes:', scene.getActiveMeshes().length);
  console.log('Materials:', scene.materials.length);
}
```

### 8. Consider Hardware Scaling
**Solution**: Adjust quality based on FPS:
```javascript
// In render loop
if (engine.getFps() < 30) {
  // Reduce quality
  engine.setHardwareScalingLevel(2);
} else if (engine.getFps() > 55) {
  engine.setHardwareScalingLevel(1);
}
```

## Estimated Impact

| Optimization | Draw Calls | VRAM | CPU | Memory Leaks |
|--------------|------------|------|-----|--------------|
| Material Pool | -80% | -20% | -5% | Fixed |
| Instancing | -50% | -90% | -10% | - |
| Disposal | - | - | - | Fixed |
| Scene Opts | -10% | - | -15% | - |

## Physics & Collision Notes

**Current State**: 
- `scene.collisionsEnabled = false` - No physics active
- No physics impostors configured
- No collision layers needed

**If Adding Physics Later**:
1. Enable collisions: `scene.collisionsEnabled = true`
2. Add impostors: `mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 1 })`
3. Set collision groups to avoid unnecessary checks
4. Use `mesh.checkCollisions = true` for camera collision

## VRAM Estimation

**Current Scene**:
- 6 room meshes: ~50KB geometry
- 3 materials (floor, wall, ceiling): ~5KB
- 2 placeholder objects: ~10KB
- GUI textures: ~2MB
- **Total**: ~2.1MB (very light)

**With 100 Objects (current approach)**:
- 100 unique materials: ~500KB
- 100 meshes: ~500KB
- **Total**: ~3.1MB (still acceptable)

**With Optimizations**:
- 10-20 shared materials: ~50KB
- 100 instances (shared geometry): ~50KB
- **Total**: ~2.2MB (minimal increase)
