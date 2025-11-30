/**
 * InteractionSystem - Handles object interaction in play mode
 * Features:
 * - Raycast detection for objects in camera view
 * - Highlight effect when looking at interactable objects
 * - "Interact (F)" prompt display
 * - Lock-on mode with cursor unlock for UI interaction
 */

import { getMachineByMeshName } from './InteractiveMachinesConfig.js';

export class InteractionSystem {
  constructor(scene, camera, canvas) {
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;
    
    this.focusedObject = null;
    this.isLockedOn = false;
    this.interactableObjects = [];
    this.enabled = false; // Start disabled (enabled in play mode)
    
    // UI elements
    this.promptElement = null;
    this.highlightLayer = null;
    
    // Raycast settings
    this.raycastDistance = 5; // Maximum interaction distance
    this.raycastThrottle = 0; // Frame counter for throttling raycasts
    this.raycastInterval = 5; // Only raycast every N frames (performance optimization)
    
    // FXAA state tracking
    this.fxaaWasEnabled = true; // Track previous FXAA state
    
    this.initialize();
  }
  
  initialize() {
    // Disable HighlightLayer for maximum performance - use CSS crosshair instead
    this.highlightLayer = null;
    this.originalMaterials = new Map();
    
    // Create interaction prompt UI
    this.createPromptUI();
    
    // Create crosshair for aiming
    this.createCrosshair();
    
    // Register interactable objects (initial scan)
    this.registerInteractableObjects();
    
    // Re-scan after delays to catch late-loading models
    setTimeout(() => {
      console.log('Re-scanning for interactables after 1 second...');
      this.registerInteractableObjects();
    }, 1000);
    
    setTimeout(() => {
      console.log('Re-scanning for interactables after 3 seconds...');
      this.registerInteractableObjects();
    }, 3000);
    
    // Setup keyboard listener for F key
    this.setupKeyboardListener();
    
    console.log('InteractionSystem initialized');
  }
  
  createPromptUI() {
    // Create prompt element at bottom center
    this.promptElement = document.createElement('div');
    this.promptElement.id = 'interaction-prompt';
    this.promptElement.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: #00ff00;
      padding: 15px 30px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 18px;
      font-weight: bold;
      border: 2px solid #00ff00;
      box-shadow: 0 0 20px rgba(0, 255, 0, 0.5);
      display: none;
      z-index: 1000;
      text-align: center;
    `;
    this.promptElement.innerHTML = 'Press <span style="color: #ffff00;">[F]</span> to Interact';
    document.body.appendChild(this.promptElement);
  }
  
  createCrosshair() {
    // Create simple crosshair at screen center
    this.crosshairElement = document.createElement('div');
    this.crosshairElement.id = 'interaction-crosshair';
    this.crosshairElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 4px;
      height: 4px;
      background: rgba(255, 255, 255, 0.5);
      border: 1px solid rgba(0, 0, 0, 0.5);
      border-radius: 50%;
      pointer-events: none;
      z-index: 999;
      transition: all 0.1s ease;
    `;
    document.body.appendChild(this.crosshairElement);
  }
  
  registerInteractableObjects() {
    // Clear existing list to avoid duplicates on re-scan
    this.interactableObjects = [];
    
    // Only register specific meshes for performance
    const allowedMeshNames = [
      'SM_ComputerParts_C05_N1_54_StaticMeshComponent0',
      'Cube18_StaticMeshComponent0',
      'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.001',
      'monitorFrame'
    ];
    
    console.log('=== Scanning scene for interactable objects ===');
    console.log('Total meshes in scene:', this.scene.meshes.length);
    
    // Only register the specific allowed meshes
    this.scene.meshes.forEach(mesh => {
      if (allowedMeshNames.includes(mesh.name) && mesh.isPickable !== false) {
        this.interactableObjects.push(mesh);
        console.log('✓ Registered interactable:', mesh.name);
      }
    });
    
    console.log(`=== Found ${this.interactableObjects.length} interactable objects ===`);
    if (this.interactableObjects.length === 0) {
      console.warn('⚠️ NO INTERACTABLE OBJECTS FOUND! Listing all meshes:');
      this.scene.meshes.slice(0, 20).forEach(m => {
        console.log('  -', m.name, '| Pickable:', m.isPickable);
      });
    }
  }
  
  setupKeyboardListener() {
    window.addEventListener('keydown', (evt) => {
      // F key - Enter lock-on mode only
      if (evt.key === 'f' || evt.key === 'F') {
        if (this.focusedObject && !this.isLockedOn) {
          this.lockOnToObject();
        }
      }
      
      // Escape key - Exit lock-on mode
      if (evt.key === 'Escape' && this.isLockedOn) {
        this.exitLockOn();
      }
    });
  }
  
  update() {
    // Don't update if system is disabled
    if (!this.enabled) {
      return;
    }
    
    // Don't update if camera is not available
    if (!this.camera) {
      return;
    }
    
    // Don't raycast if locked on to an object
    if (this.isLockedOn) {
      return;
    }
    
    // Throttle raycasts for performance - only check every N frames
    this.raycastThrottle++;
    if (this.raycastThrottle < this.raycastInterval) {
      return;
    }
    this.raycastThrottle = 0;
    
    // Create ray from camera position in forward direction
    const origin = this.camera.position;
    const forward = this.camera.getDirection(BABYLON.Axis.Z);
    const length = this.raycastDistance;
    
    const ray = new BABYLON.Ray(origin, forward, length);
    
    // Debug: Check what we're hitting (every 60 frames)
    if (this.scene.getFrameId() % 60 === 0) {
      const anyHit = this.scene.pickWithRay(ray);
      if (anyHit && anyHit.pickedMesh) {
        console.log('🎯 Looking at mesh:', anyHit.pickedMesh.name, '| Distance:', anyHit.distance.toFixed(2));
      } else {
        console.log('❌ Not looking at any mesh');
      }
    }
    
    // Only check interactable objects
    const hit = this.scene.pickWithRay(ray, (mesh) => {
      return this.interactableObjects.includes(mesh);
    });
    
    // Check if we hit an interactable object
    if (hit && hit.pickedMesh) {
      this.setFocusedObject(hit.pickedMesh);
    } else {
      this.clearFocusedObject();
    }
  }
  
  setFocusedObject(mesh) {
    // If already focused on this object, do nothing
    if (this.focusedObject === mesh) {
      return;
    }
    
    // Clear previous focus
    this.clearFocusedObject();
    
    // Set new focused object
    this.focusedObject = mesh;
    
    // Change crosshair color to indicate interactable object
    if (this.crosshairElement) {
      this.crosshairElement.style.background = '#00ff00';
      this.crosshairElement.style.width = '8px';
      this.crosshairElement.style.height = '8px';
      this.crosshairElement.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.8)';
    }
    
    // Show interaction prompt
    this.promptElement.style.display = 'block';
  }
  
  clearFocusedObject() {
    if (this.focusedObject) {
      this.focusedObject = null;
    }
    
    // Reset crosshair to default
    if (this.crosshairElement) {
      this.crosshairElement.style.background = 'rgba(255, 255, 255, 0.5)';
      this.crosshairElement.style.width = '4px';
      this.crosshairElement.style.height = '4px';
      this.crosshairElement.style.boxShadow = 'none';
    }
    
    // Hide prompt
    this.promptElement.style.display = 'none';
  }
  
  lockOnToObject() {
    if (!this.focusedObject) {
      return;
    }
    
    this.isLockedOn = true;
    
    // Disable FXAA post-processing only when locking on to monitor
    const isMonitor = this.focusedObject.name === 'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.001' || 
                      this.focusedObject.name === 'monitorFrame';
    
    if (isMonitor && window.postProcessingPipeline && window.postProcessingPipeline.fxaaEnabled !== undefined) {
      this.fxaaWasEnabled = window.postProcessingPipeline.fxaaEnabled;
      window.postProcessingPipeline.fxaaEnabled = false;
      console.log('✓ FXAA disabled for monitor lock-on');
      
      // Notify monitor controller that it's locked on
      if (window.monitorController) {
        window.monitorController.isLockedOn = true;
      }
    }
    
    // Hide crosshair when locked on
    if (this.crosshairElement) {
      this.crosshairElement.style.display = 'none';
    }
    
    // Hide interaction prompt
    this.promptElement.style.display = 'none';
    
    // Exit pointer lock to show cursor
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock();
    }
    
    // Show cursor
    this.canvas.style.cursor = 'pointer';
    
    // Stop any running animations first
    this.scene.stopAnimation(this.camera);
    
    // Disable camera rotation during animation
    this.camera.detachControl();
    
    // Store original camera state for exit
    this.originalCameraPosition = this.camera.position.clone();
    this.originalCameraRotation = this.camera.rotation.clone();
    
    // Store and temporarily disable rotation limits
    this.originalRotationLimits = {
      lowerRotationLimit: this.camera.lowerRotationLimit,
      upperRotationLimit: this.camera.upperRotationLimit
    };
    this.camera.lowerRotationLimit = null;
    this.camera.upperRotationLimit = null;
    
    console.log('Stored original camera:', this.originalCameraPosition.toString(), this.originalCameraRotation.toString());
    
    // Get camera position from machine config
    const machineConfig = getMachineByMeshName(this.focusedObject.name);
    
    let targetPosition, targetRotation;
    if (machineConfig) {
      // Check for live override from editor
      const override = window.lockOnOverrides && window.lockOnOverrides[machineConfig.id];
      
      if (override) {
        targetPosition = new BABYLON.Vector3(
          override.cameraPosition.x,
          override.cameraPosition.y,
          override.cameraPosition.z
        );
        targetRotation = new BABYLON.Vector3(
          override.cameraRotation.x,
          override.cameraRotation.y,
          override.cameraRotation.z
        );
        console.log('Using OVERRIDE camera config for machine:', machineConfig.displayName);
      } else {
        targetPosition = new BABYLON.Vector3(
          machineConfig.cameraPosition.x,
          machineConfig.cameraPosition.y,
          machineConfig.cameraPosition.z
        );
        targetRotation = new BABYLON.Vector3(
          machineConfig.cameraRotation.x,
          machineConfig.cameraRotation.y,
          machineConfig.cameraRotation.z
        );
        console.log('Using camera config for machine:', machineConfig.displayName);
      }
    } else {
      // Fallback to default position
      targetPosition = new BABYLON.Vector3(0.20, 2.30, 0.10);
      targetRotation = new BABYLON.Vector3(-0.01, 2.38, 0);
      console.warn('No camera config found for mesh:', this.focusedObject.name);
    }
    
    // Animate camera to target position
    const animationDuration = 60; // frames (1 second at 60fps)
    
    // Position animation
    const positionAnimation = new BABYLON.Animation(
      'cameraPositionAnimation',
      'position',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    positionAnimation.setKeys([
      { frame: 0, value: this.camera.position.clone() },
      { frame: animationDuration, value: targetPosition }
    ]);
    
    // Easing function for smooth movement
    const easingFunction = new BABYLON.CubicEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
    positionAnimation.setEasingFunction(easingFunction);
    
    // Rotation animation
    const rotationAnimation = new BABYLON.Animation(
      'cameraRotationAnimation',
      'rotation',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    rotationAnimation.setKeys([
      { frame: 0, value: this.camera.rotation.clone() },
      { frame: animationDuration, value: targetRotation }
    ]);
    
    rotationAnimation.setEasingFunction(easingFunction);
    
    // Clear any existing animations
    this.camera.animations = [];
    
    // Apply animations
    this.camera.animations = [positionAnimation, rotationAnimation];
    
    // Stop any existing animations before starting new ones
    this.scene.stopAnimation(this.camera);
    
    this.scene.beginAnimation(this.camera, 0, animationDuration, false, 1, () => {
      // Ensure final values are set exactly
      this.camera.position.copyFrom(targetPosition);
      this.camera.rotation.copyFrom(targetRotation);
      
      // Reset rotation quaternion to null so camera uses Euler angles
      this.camera.rotationQuaternion = null;
      
      console.log('Camera animation complete - locked on to:', this.focusedObject.name);
    });
    
    console.log('Locking on to:', this.focusedObject.name);
    
    // Trigger interaction event (can be extended)
    this.onObjectInteract(this.focusedObject);
  }
  
  exitLockOn() {
    if (!this.isLockedOn) {
      return;
    }
    
    this.isLockedOn = false;
    
    // Re-enable FXAA post-processing only if it was disabled (monitor lock-on)
    const isMonitor = this.focusedObject && (
      this.focusedObject.name === 'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.001' || 
      this.focusedObject.name === 'monitorFrame'
    );
    
    if (isMonitor && window.postProcessingPipeline && this.fxaaWasEnabled !== undefined) {
      window.postProcessingPipeline.fxaaEnabled = this.fxaaWasEnabled;
      console.log('✓ FXAA re-enabled after monitor lock-on exit');
      
      // Notify monitor controller that lock-on ended
      if (window.monitorController) {
        window.monitorController.isLockedOn = false;
      }
    }
    
    // Keep white highlight if still looking at object
    
    // Hide prompt during animation
    this.promptElement.style.display = 'none';
    
    // Animate camera back to original position
    if (this.originalCameraPosition && this.originalCameraRotation) {
      console.log('Returning to original camera:', this.originalCameraPosition.toString(), this.originalCameraRotation.toString());
      console.log('Current camera rotation:', this.camera.rotation.toString());
      
      // Stop any running animations first
      this.scene.stopAnimation(this.camera);
      
      // CRITICAL: Set rotation quaternion to null BEFORE animation
      this.camera.rotationQuaternion = null;
      
      const animationDuration = 60; // frames
      
      // Position animation
      const positionAnimation = new BABYLON.Animation(
        'cameraReturnPositionAnimation',
        'position',
        60,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      
      positionAnimation.setKeys([
        { frame: 0, value: this.camera.position.clone() },
        { frame: animationDuration, value: this.originalCameraPosition.clone() }
      ]);
      
      const easingFunction = new BABYLON.CubicEase();
      easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
      positionAnimation.setEasingFunction(easingFunction);
      
      // Rotation animation
      const rotationAnimation = new BABYLON.Animation(
        'cameraReturnRotationAnimation',
        'rotation',
        60,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      
      rotationAnimation.setKeys([
        { frame: 0, value: this.camera.rotation.clone() },
        { frame: animationDuration, value: this.originalCameraRotation.clone() }
      ]);
      
      rotationAnimation.setEasingFunction(easingFunction);
      
      // Clear any existing animations
      this.camera.animations = [];
      
      // Apply animations
      this.camera.animations = [positionAnimation, rotationAnimation];
      
      this.scene.beginAnimation(this.camera, 0, animationDuration, false, 1, () => {
        // Ensure final values are set exactly - do this multiple times to be sure
        this.camera.position.copyFrom(this.originalCameraPosition);
        this.camera.rotation.x = this.originalCameraRotation.x;
        this.camera.rotation.y = this.originalCameraRotation.y;
        this.camera.rotation.z = this.originalCameraRotation.z;
        
        // CRITICAL: Keep rotation quaternion null
        this.camera.rotationQuaternion = null;
        
        console.log('Set final rotation to:', this.camera.rotation.toString());
        
        // Restore rotation limits
        if (this.originalRotationLimits) {
          this.camera.lowerRotationLimit = this.originalRotationLimits.lowerRotationLimit;
          this.camera.upperRotationLimit = this.originalRotationLimits.upperRotationLimit;
        }
        
        // Small delay before re-attaching controls to ensure state is settled
        setTimeout(() => {
          // Double-check rotation is still correct
          this.camera.rotation.x = this.originalCameraRotation.x;
          this.camera.rotation.y = this.originalCameraRotation.y;
          this.camera.rotation.z = this.originalCameraRotation.z;
          this.camera.rotationQuaternion = null;
          
          // Re-enable camera controls after animation
          this.camera.attachControl(this.canvas, true);
          
          // Request pointer lock again
          this.canvas.requestPointerLock();
          
          // Show crosshair again
          if (this.crosshairElement) {
            this.crosshairElement.style.display = 'block';
          }
          
          // Show prompt again if still looking at object
          if (this.focusedObject) {
            this.promptElement.style.display = 'block';
          }
          
          console.log('Returned to original camera position and controls restored');
          console.log('Final camera rotation after attach:', this.camera.rotation.toString());
        }, 50);
      });
    } else {
      // No original position stored, just re-enable controls
      this.camera.attachControl(this.canvas, true);
      this.canvas.requestPointerLock();
      
      // Show crosshair again
      if (this.crosshairElement) {
        this.crosshairElement.style.display = 'block';
      }
      
      if (this.focusedObject) {
        this.promptElement.style.display = 'block';
      }
    }
    
    // Hide cursor
    this.canvas.style.cursor = 'default';
    
    console.log('Exited lock-on mode');
  }
  
  onObjectInteract(mesh) {
    // This method can be extended to trigger specific interactions
    // For example, activate monitor, open UI, etc.
    console.log('Interacting with:', mesh.name);
    
    // Monitor activation is now handled by M key only
    // F key just locks camera view
  }
  
  dispose() {
    // Dispose highlight layer
    if (this.highlightLayer) {
      this.highlightLayer.dispose();
      this.highlightLayer = null;
    }
    
    this.originalMaterials.clear();
    
    if (this.promptElement) {
      this.promptElement.remove();
    }
    
    if (this.crosshairElement) {
      this.crosshairElement.remove();
    }
    
    console.log('InteractionSystem disposed');
  }
}
