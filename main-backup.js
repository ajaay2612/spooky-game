import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

// Entry point for the game
console.log('Game initializing with improved UX...');

// Get canvas element
const canvas = document.getElementById('renderCanvas');

// Edit mode state
let isEditMode = false;

// Application state for status tracking
let appState = {
  status: 'active',
  errors: [],
  scene: {
    objectCount: 0,
    rendering: true,
    fps: 0
  },
  startTime: Date.now()
};

// Global function to update app status
window.updateAppStatus = (updates) => {
  appState = { ...appState, ...updates };
};

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Application error:', event.error);
  const errorInfo = {
    message: event.error?.message || 'Unknown error',
    timestamp: Date.now(),
    stack: event.error?.stack || ''
  };
  appState.status = 'error';
  appState.errors.push(errorInfo);
  window.updateAppStatus({ status: 'error', errors: appState.errors });
});

// Catch unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  const errorInfo = {
    message: event.reason?.message || String(event.reason),
    timestamp: Date.now(),
    stack: event.reason?.stack || ''
  };
  appState.status = 'error';
  appState.errors.push(errorInfo);
  window.updateAppStatus({ status: 'error', errors: appState.errors });
});

// Initialize Babylon.js engine
const engine = new BABYLON.Engine(canvas, true);

// Create scene with spooky atmosphere
const scene = new BABYLON.Scene(engine);

// Spooky atmosphere configuration
scene.clearColor = new BABYLON.Color3(0.02, 0.02, 0.05); // Very dark blue-black
scene.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.15); // Dim ambient
scene.collisionsEnabled = false; // Simple movement without collision

// CameraController class
class CameraController {
  constructor(scene, canvas) {
    this.scene = scene;
    this.canvas = canvas;
    this.camera = null;
    this.moveSpeed = 0.5;
    this.setupCamera();
    this.setupPointerLock();
  }

  setupCamera() {
    // Universal Camera for first-person controls
    this.camera = new BABYLON.UniversalCamera(
      "playerCamera",
      new BABYLON.Vector3(0, 1.6, -5), // Eye level at 1.6m
      this.scene
    );

    this.camera.attachControl(this.canvas, true);
    this.camera.speed = this.moveSpeed;
    this.camera.angularSensibility = 2000;

    // Set up WASD keys
    this.camera.keysUp = [87]; // W
    this.camera.keysDown = [83]; // S
    this.camera.keysLeft = [65]; // A
    this.camera.keysRight = [68]; // D

  }

  setupPointerLock() {
    // Request pointer lock on canvas click
    this.canvas.addEventListener('click', () => {
      this.canvas.requestPointerLock();
    });

  }

  getCamera() {
    return this.camera;
  }
}

// SceneManager class
class SceneManager {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
    this.selectedObject = null;
    this.flickerObserver = null;

    // Material pools for reuse
    this.boxMaterials = [];
    this.sphereMaterials = [];

    // Master meshes for instancing
    this.masterBox = null;
    this.masterSphere = null;

    this.createMaterialPools();
    this.createMasterMeshes();
    this.setupRoom();
    this.setupLights();
    this.addPlaceholderObjects();
  }

  createMaterialPools() {
    // Create 10 reusable materials for boxes and spheres
    const colors = [
      new BABYLON.Color3(0.8, 0.2, 0.2), // Red
      new BABYLON.Color3(0.2, 0.8, 0.2), // Green
      new BABYLON.Color3(0.2, 0.2, 0.8), // Blue
      new BABYLON.Color3(0.8, 0.8, 0.2), // Yellow
      new BABYLON.Color3(0.8, 0.2, 0.8), // Magenta
      new BABYLON.Color3(0.2, 0.8, 0.8), // Cyan
      new BABYLON.Color3(0.9, 0.5, 0.2), // Orange
      new BABYLON.Color3(0.5, 0.2, 0.9), // Purple
      new BABYLON.Color3(0.7, 0.7, 0.7), // Gray
      new BABYLON.Color3(0.9, 0.9, 0.9), // White
    ];

    colors.forEach((color, i) => {
      const boxMat = new BABYLON.StandardMaterial(`boxMat_${i}`, this.scene);
      boxMat.diffuseColor = color;
      this.boxMaterials.push(boxMat);

      const sphereMat = new BABYLON.StandardMaterial(`sphereMat_${i}`, this.scene);
      sphereMat.diffuseColor = color;
      this.sphereMaterials.push(sphereMat);
    });
  }

  createMasterMeshes() {
    // Create master meshes for instancing (hidden)
    this.masterBox = BABYLON.MeshBuilder.CreateBox("masterBox", { size: 1 }, this.scene);
    this.masterBox.isVisible = false;

    this.masterSphere = BABYLON.MeshBuilder.CreateSphere("masterSphere", { diameter: 1 }, this.scene);
    this.masterSphere.isVisible = false;
  }

  setupRoom() {
    // Floor - dark, worn appearance
    const floor = BABYLON.MeshBuilder.CreateGround(
      "floor",
      { width: 20, height: 20 },
      this.scene
    );
    const floorMat = new BABYLON.StandardMaterial("floorMat", this.scene);
    floorMat.diffuseColor = new BABYLON.Color3(0.15, 0.12, 0.1); // Dark brown
    floorMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05); // Minimal shine
    floor.material = floorMat;

    // Walls (4 planes) - dark, oppressive
    const wallHeight = 5;
    const roomSize = 20;

    // Back wall
    const backWall = BABYLON.MeshBuilder.CreatePlane(
      "backWall",
      { width: roomSize, height: wallHeight },
      this.scene
    );
    backWall.position = new BABYLON.Vector3(0, wallHeight / 2, roomSize / 2);

    // Front wall
    const frontWall = BABYLON.MeshBuilder.CreatePlane(
      "frontWall",
      { width: roomSize, height: wallHeight },
      this.scene
    );
    frontWall.position = new BABYLON.Vector3(0, wallHeight / 2, -roomSize / 2);
    frontWall.rotation.y = Math.PI;

    // Left wall
    const leftWall = BABYLON.MeshBuilder.CreatePlane(
      "leftWall",
      { width: roomSize, height: wallHeight },
      this.scene
    );
    leftWall.position = new BABYLON.Vector3(-roomSize / 2, wallHeight / 2, 0);
    leftWall.rotation.y = Math.PI / 2;

    // Right wall
    const rightWall = BABYLON.MeshBuilder.CreatePlane(
      "rightWall",
      { width: roomSize, height: wallHeight },
      this.scene
    );
    rightWall.position = new BABYLON.Vector3(roomSize / 2, wallHeight / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;

    // Apply spooky wall material - dark gray with slight green tint
    const wallMat = new BABYLON.StandardMaterial("wallMat", this.scene);
    wallMat.diffuseColor = new BABYLON.Color3(0.2, 0.25, 0.2); // Dark greenish-gray
    wallMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    [backWall, frontWall, leftWall, rightWall].forEach(wall => {
      wall.material = wallMat;
    });

    // Ceiling - very dark, barely visible
    const ceiling = BABYLON.MeshBuilder.CreateGround(
      "ceiling",
      { width: roomSize, height: roomSize },
      this.scene
    );
    ceiling.position.y = wallHeight;
    ceiling.rotation.z = Math.PI;
    const ceilingMat = new BABYLON.StandardMaterial("ceilingMat", this.scene);
    ceilingMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.12); // Almost black
    ceiling.material = ceilingMat;

  }

  setupLights() {
    // Very dim hemispheric light for minimal ambient lighting
    const hemiLight = new BABYLON.HemisphericLight(
      "hemiLight",
      new BABYLON.Vector3(0, 1, 0),
      this.scene
    );
    hemiLight.intensity = 0.15; // Very dim
    hemiLight.groundColor = new BABYLON.Color3(0.05, 0.05, 0.1); // Dark blue ground

    // Flickering point light for eerie atmosphere
    const pointLight = new BABYLON.PointLight(
      "pointLight",
      new BABYLON.Vector3(0, 4, 0),
      this.scene
    );
    pointLight.intensity = 0.3; // Dim, barely illuminating
    pointLight.diffuse = new BABYLON.Color3(0.8, 0.7, 0.5); // Sickly yellow-orange

    // Add smooth flickering animation to the point light
    let targetIntensity = 0.3;
    let currentIntensity = 0.3;
    let flickerTimer = 0;

    this.flickerObserver = this.scene.onBeforeRenderObservable.add(() => {
      flickerTimer++;

      // Change target intensity every 15 frames for smoother transitions
      if (flickerTimer % 15 === 0) {
        targetIntensity = 0.3 + (Math.random() - 0.5) * 0.2;
      }

      // Smoothly interpolate towards target intensity
      currentIntensity += (targetIntensity - currentIntensity) * 0.1;
      pointLight.intensity = currentIntensity;
    });
  }

  addPlaceholderObjects() {
    // Add a box
    this.addBox(new BABYLON.Vector3(-3, 1, 0));

    // Add a sphere
    this.addSphere(new BABYLON.Vector3(3, 1.5, 0));
  }

  addBox(position = new BABYLON.Vector3(0, 1, 0)) {
    // Create instance instead of new mesh
    const box = this.masterBox.createInstance(`box_${Date.now()}`);
    box.position = position;

    // Reuse material from pool
    const materialIndex = this.objects.length % this.boxMaterials.length;
    box.material = this.boxMaterials[materialIndex];

    this.objects.push(box);
    return box;
  }

  addSphere(position = new BABYLON.Vector3(0, 1.5, 0)) {
    // Create instance instead of new mesh
    const sphere = this.masterSphere.createInstance(`sphere_${Date.now()}`);
    sphere.position = position;

    // Reuse material from pool
    const materialIndex = this.objects.length % this.sphereMaterials.length;
    sphere.material = this.sphereMaterials[materialIndex];

    this.objects.push(sphere);
    return sphere;
  }

  removeObject(mesh) {
    const index = this.objects.indexOf(mesh);
    if (index > -1) {
      this.objects.splice(index, 1);
    }

    if (this.selectedObject === mesh) {
      this.selectedObject = null;
    }

    // Dispose instance (not material since it's shared)
    mesh.dispose(false, true);
  }

  dispose() {
    // Dispose all objects
    this.objects.forEach(obj => obj.dispose());
    this.objects = [];

    // Dispose master meshes
    if (this.masterBox) this.masterBox.dispose();
    if (this.masterSphere) this.masterSphere.dispose();

    // Dispose material pools
    this.boxMaterials.forEach(mat => mat.dispose());
    this.sphereMaterials.forEach(mat => mat.dispose());

    // Unregister flicker animation
    if (this.flickerObserver) {
      this.scene.onBeforeRenderObservable.remove(this.flickerObserver);
    }
  }

  selectObject(mesh) {
    // Deselect previous
    if (this.selectedObject && this.selectedObject.material) {
      this.selectedObject.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
    }

    // Select new
    this.selectedObject = mesh;
    if (mesh && mesh.material) {
      mesh.material.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0);
    }

    return mesh;
  }

  getSelectedObject() {
    return this.selectedObject;
  }

  getObjects() {
    return this.objects;
  }
}

// GUIManager class
class GUIManager {
  constructor(scene, sceneManager) {
    this.scene = scene;
    this.sceneManager = sceneManager;
    this.advancedTexture = null;
    this.mainPanel = null;
    this.propertyPanel = null;
    this.isVisible = true;

    this.setupGUI();
  }

  setupGUI() {
    // Create full screen GUI
    this.advancedTexture = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Create main panel
    this.mainPanel = new GUI.StackPanel();
    this.mainPanel.width = "300px";
    this.mainPanel.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.mainPanel.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.mainPanel.top = "10px";
    this.mainPanel.left = "-10px";
    this.advancedTexture.addControl(this.mainPanel);

    // Add object creation buttons
    this.createButton("Add Box", () => {
      this.sceneManager.addBox();
    });

    this.createButton("Add Sphere", () => {
      this.sceneManager.addSphere();
    });

    this.createButton("Delete Selected", () => {
      const selected = this.sceneManager.getSelectedObject();
      if (selected) {
        this.sceneManager.removeObject(selected);
        this.updateForSelectedObject(null);
      }
    });

    // Property editor panel (initially empty)
    this.propertyPanel = new GUI.StackPanel();
    this.propertyPanel.width = "280px";
    this.mainPanel.addControl(this.propertyPanel);
  }

  createButton(text, onClick) {
    const buttonName = `btn_${text.replace(/\s+/g, '_')}_${Date.now()}`;
    const button = GUI.Button.CreateSimpleButton(buttonName, text);
    button.width = "280px";
    button.height = "40px";
    button.color = "white";
    button.background = "green";
    button.onPointerClickObservable.add(onClick);
    this.mainPanel.addControl(button);

    // Add spacing
    const spacer = new GUI.Container();
    spacer.height = "5px";
    this.mainPanel.addControl(spacer);
  }

  updateForSelectedObject(mesh) {
    this.selectedObject = mesh;

    // Clear existing property controls
    this.propertyPanel.clearControls();

    if (!mesh) return;

    // Add title
    const title = new GUI.TextBlock();
    title.text = "Selected Object";
    title.height = "30px";
    title.color = "white";
    this.propertyPanel.addControl(title);

    // Position sliders
    this.createSlider("X Position", mesh.position.x, -10, 10, (value) => {
      mesh.position.x = value;
    });

    this.createSlider("Y Position", mesh.position.y, 0, 5, (value) => {
      mesh.position.y = value;
    });

    this.createSlider("Z Position", mesh.position.z, -10, 10, (value) => {
      mesh.position.z = value;
    });

    // Color picker
    this.createColorPicker(mesh);
  }

  createSlider(label, initialValue, min, max, onChange) {
    const header = new GUI.TextBlock();
    header.text = label;
    header.height = "20px";
    header.color = "white";
    this.propertyPanel.addControl(header);

    const slider = new GUI.Slider();
    slider.minimum = min;
    slider.maximum = max;
    slider.value = initialValue;
    slider.height = "20px";
    slider.width = "260px";
    slider.color = "green";
    slider.background = "gray";
    slider.onValueChangedObservable.add(onChange);
    this.propertyPanel.addControl(slider);

    // Spacer
    const spacer = new GUI.Container();
    spacer.height = "5px";
    this.propertyPanel.addControl(spacer);
  }

  createColorPicker(mesh) {
    const header = new GUI.TextBlock();
    header.text = "Color";
    header.height = "20px";
    header.color = "white";
    this.propertyPanel.addControl(header);

    // Simple RGB sliders for color picking
    const currentColor = mesh.material.diffuseColor;

    this.createSlider("Red", currentColor.r, 0, 1, (value) => {
      mesh.material.diffuseColor.r = value;
    });

    this.createSlider("Green", currentColor.g, 0, 1, (value) => {
      mesh.material.diffuseColor.g = value;
    });

    this.createSlider("Blue", currentColor.b, 0, 1, (value) => {
      mesh.material.diffuseColor.b = value;
    });
  }

  toggleVisibility() {
    this.isVisible = !this.isVisible;
    this.mainPanel.isVisible = this.isVisible;
  }

  dispose() {
    if (this.advancedTexture) {
      this.advancedTexture.dispose();
    }
  }
}

// Initialize camera controller
const cameraController = new CameraController(scene, canvas);

// Initialize scene manager
const sceneManager = new SceneManager(scene);

// Initialize GUI manager
const guiManager = new GUIManager(scene, sceneManager);

// Set up object selection on click
scene.onPointerDown = (evt, pickResult) => {
  if (pickResult.hit && pickResult.pickedMesh) {
    const mesh = pickResult.pickedMesh;

    // Only select objects we've added (not room geometry)
    if (sceneManager.getObjects().includes(mesh)) {
      sceneManager.selectObject(mesh);
      guiManager.updateForSelectedObject(mesh);
    }
  }
};

// Scene error handling (only if observable exists)
if (scene.onErrorObservable) {
  scene.onErrorObservable.add((error) => {
    console.error('Scene error:', error);
    const errorInfo = {
      message: error?.message || 'Scene error',
      timestamp: Date.now(),
      stack: ''
    };
    appState.status = 'error';
    appState.errors.push(errorInfo);
    window.updateAppStatus({ status: 'error', errors: appState.errors });
  });
}

// Update app status with scene info
window.updateAppStatus({
  scene: {
    objectCount: sceneManager.getObjects().length,
    rendering: true,
    fps: 0
  }
});

// Set up render loop
engine.runRenderLoop(() => {
  scene.render();
  appState.scene.fps = engine.getFps();
});

// Handle window resize
window.addEventListener('resize', () => {
  engine.resize();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  sceneManager.dispose();
  guiManager.dispose();
  scene.dispose();
  engine.dispose();
});
