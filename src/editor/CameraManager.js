// CameraManager.js
// Manages dual camera system for editor and play modes

export class CameraManager {
  constructor(scene, canvas) {
    this.scene = scene;
    this.canvas = canvas;
    this.editorCamera = null;
    this.playerCamera = null;
    this.activeCamera = null;
  }
  
  createPlayerCamera() {
    // Create UniversalCamera at eye level position (0, 1.6, -5)
    const camera = new BABYLON.UniversalCamera(
      "playerCamera",
      new BABYLON.Vector3(0, 1.6, -5),
      this.scene
    );

    // Configure camera target to look forward
    camera.setTarget(new BABYLON.Vector3(0, 1.6, 0));

    // Set camera movement speed to 0.1 units per frame
    camera.speed = 0.1;

    // Configure mouse sensitivity and pointer lock
    // Lower angularSensibility = higher sensitivity (inverse relationship)
    camera.angularSensibility = 2000;

    // Set up WASD key mappings for movement controls
    camera.keysUp = [87];    // W key
    camera.keysDown = [83];  // S key
    camera.keysLeft = [65];  // A key
    camera.keysRight = [68]; // D key

    console.log('Player camera (UniversalCamera) created');
    
    this.playerCamera = camera;
    return camera;
  }
  
  createEditorCamera() {
    // Create ArcRotateCamera for editor mode
    const camera = new BABYLON.ArcRotateCamera(
      "editorCamera",
      Math.PI / 2,      // alpha
      Math.PI / 3,      // beta
      15,               // radius
      new BABYLON.Vector3(0, 1.5, 0),  // target
      this.scene
    );
    
    // Configure camera controls
    camera.panningSensibility = 1000; // Higher value = less sensitive panning
    camera.wheelPrecision = 50;
    camera.angularSensibilityX = 1000;
    camera.angularSensibilityY = 1000;
    
    // Set radius limits
    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 100;
    
    // Set beta limits to prevent floor clipping and flipping
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2;
    
    // Configure mouse buttons for rotation and panning
    // By default: left button (0) = rotation, right button (2) = panning
    // We want: right button (2) = rotation, Alt+right = panning
    camera.inputs.attached.pointers.buttons = [2, 1, 0]; // Right, middle, left
    
    console.log('Editor camera (ArcRotateCamera) created');
    
    this.editorCamera = camera;
    return camera;
  }
  
  switchToEditorCamera() {
    if (!this.editorCamera) {
      this.createEditorCamera();
    }
    
    // Exit pointer lock if active
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }
    
    // Detach player camera controls
    if (this.playerCamera) {
      this.playerCamera.detachControl();
    }
    
    // Attach editor camera controls
    this.editorCamera.attachControl(this.canvas, true);
    this.scene.activeCamera = this.editorCamera;
    this.activeCamera = this.editorCamera;
    
    console.log('Switched to editor camera');
  }
  
  switchToPlayerCamera() {
    if (!this.playerCamera) {
      this.createPlayerCamera();
    }
    
    // Detach editor camera controls
    if (this.editorCamera) {
      this.editorCamera.detachControl();
    }
    
    // Attach player camera controls
    this.playerCamera.attachControl(this.canvas, true);
    this.scene.activeCamera = this.playerCamera;
    this.activeCamera = this.playerCamera;
    
    // Request pointer lock for immersive first-person controls
    this.canvas.requestPointerLock();
    
    console.log('Switched to player camera');
  }
  
  initialize() {
    // Create both cameras
    this.createPlayerCamera();
    this.createEditorCamera();
    
    // Start with editor camera active
    this.switchToEditorCamera();
  }
}
