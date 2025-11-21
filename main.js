import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';

// Entry point for the game
console.log('Game initializing...');

// Get canvas element
const canvas = document.getElementById('renderCanvas');

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
  console.log('App status updated:', appState);
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
console.log('Engine initialized');

// Create scene with spooky atmosphere
const scene = new BABYLON.Scene(engine);

// Spooky atmosphere configuration
scene.clearColor = new BABYLON.Color3(0.02, 0.02, 0.05); // Very dark blue-black
scene.ambientColor = new BABYLON.Color3(0.1, 0.1, 0.15); // Dim ambient
scene.collisionsEnabled = false; // Simple movement without collision

console.log('Scene created with spooky atmosphere');

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
    
    console.log('Camera controller initialized at eye level (1.6m)');
  }

  setupPointerLock() {
    // Request pointer lock on canvas click
    this.canvas.addEventListener('click', () => {
      this.canvas.requestPointerLock();
    });
    
    console.log('Pointer lock configured');
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
    this.setupRoom();
    this.setupLights();
    this.addPlaceholderObjects();
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
    
    console.log('Spooky room environment created');
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
    
    this.scene.registerBeforeRender(() => {
      flickerTimer++;
      
      // Change target intensity every 15 frames for smoother transitions
      if (flickerTimer % 15 === 0) {
        targetIntensity = 0.3 + (Math.random() - 0.5) * 0.2;
      }
      
      // Smoothly interpolate towards target intensity
      currentIntensity += (targetIntensity - currentIntensity) * 0.1;
      pointLight.intensity = currentIntensity;
    });
    
    console.log('Atmospheric lighting configured with smooth flickering effect');
  }

  addPlaceholderObjects() {
    // Add a box
    this.addBox(new BABYLON.Vector3(-3, 1, 0));
    
    // Add a sphere
    this.addSphere(new BABYLON.Vector3(3, 1.5, 0));
    
    console.log('Placeholder objects added');
  }

  addBox(position = new BABYLON.Vector3(0, 1, 0)) {
    const box = BABYLON.MeshBuilder.CreateBox(
      `box_${Date.now()}`,
      { size: 1 },
      this.scene
    );
    box.position = position;
    
    const material = new BABYLON.StandardMaterial(`boxMat_${Date.now()}`, this.scene);
    material.diffuseColor = new BABYLON.Color3(
      Math.random(),
      Math.random(),
      Math.random()
    );
    box.material = material;
    
    this.objects.push(box);
    return box;
  }

  addSphere(position = new BABYLON.Vector3(0, 1.5, 0)) {
    const sphere = BABYLON.MeshBuilder.CreateSphere(
      `sphere_${Date.now()}`,
      { diameter: 1 },
      this.scene
    );
    sphere.position = position;
    
    const material = new BABYLON.StandardMaterial(`sphereMat_${Date.now()}`, this.scene);
    material.diffuseColor = new BABYLON.Color3(
      Math.random(),
      Math.random(),
      Math.random()
    );
    sphere.material = material;
    
    this.objects.push(sphere);
    return sphere;
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
      console.log('Box added via GUI');
    });
    
    this.createButton("Add Sphere", () => {
      this.sceneManager.addSphere();
      console.log('Sphere added via GUI');
    });
    
    console.log('Developer GUI system initialized');
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

  toggleVisibility() {
    this.isVisible = !this.isVisible;
    this.mainPanel.isVisible = this.isVisible;
    console.log(`GUI visibility toggled: ${this.isVisible}`);
  }
}

// Initialize camera controller
const cameraController = new CameraController(scene, canvas);

// Initialize scene manager
const sceneManager = new SceneManager(scene);

// Initialize GUI manager
const guiManager = new GUIManager(scene, sceneManager);

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

console.log('Render loop started');
