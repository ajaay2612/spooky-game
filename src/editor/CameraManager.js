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
    // Create UniversalCamera at sitting position (chair height)
    const camera = new BABYLON.UniversalCamera(
      "playerCamera",
      new BABYLON.Vector3(-0.10, 2.50, 0.35),
      this.scene
    );

    // Configure camera target to look at specific direction (slightly upward)
    camera.setTarget(new BABYLON.Vector3(3.60, 1.55, 0.50));

    // Disable movement - player is sitting in chair
    camera.speed = 0;

    // Configure mouse sensitivity for rotation only
    // Lower angularSensibility = higher sensitivity (inverse relationship)
    camera.angularSensibility = 2000;

    // Disable WASD key movement - player cannot move from chair
    camera.keysUp = [];
    camera.keysDown = [];
    camera.keysLeft = [];
    camera.keysRight = [];

    // Improve camera visibility settings
    camera.minZ = 0.1;  // Near clipping plane - very close
    camera.maxZ = 1000; // Far clipping plane - see far
    camera.fov = 0.6;   // Field of view (narrower for less distortion)

    // Clamp vertical rotation to prevent looking at chair
    // Use onBeforeRenderObservable to enforce limits every frame
    const minRotationX = -1.4;  // Limit looking up (~-80 degrees, negative is up)
    const maxRotationX = 0.39;  // Limit looking down (~22 degrees, positive is down)
    
    this.scene.onBeforeRenderObservable.add(() => {
      if (camera.rotation.x < minRotationX) {
        camera.rotation.x = minRotationX;
      }
      if (camera.rotation.x > maxRotationX) {
        camera.rotation.x = maxRotationX;
      }
    });

    console.log('Player camera (UniversalCamera) created - sitting mode (rotation only)');
    
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
