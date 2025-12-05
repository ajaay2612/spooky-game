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
    // Create HighlightLayer for interactive element outlines
    this.highlightLayer = new BABYLON.HighlightLayer('interactiveHighlight', this.scene, {
      isStroke: true,
      blurHorizontalSize: 0.01,
      blurVerticalSize: 0.01
    });
    this.originalMaterials = new Map();
    this.highlightedMeshes = [];
    
    // Create interaction prompt UI
    this.createPromptUI();
    
    // Create crosshair for aiming
    this.createCrosshair();
    
    // Register interactable objects (initial scan)
    this.registerInteractableObjects();
    
    // NETWORK FIX: Extended retry schedule for slow network connections
    // Retry at 1s, 2s, 3s, 5s, 7s, 10s to catch late-loading meshes
    const retrySchedule = [1000, 2000, 3000, 5000, 7000, 10000];
    retrySchedule.forEach(delay => {
      setTimeout(() => {
        console.log(`Re-scanning for interactables after ${delay/1000} seconds...`);
        this.registerInteractableObjects();
      }, delay);
    });
    
    // NETWORK FIX: Continuous monitoring for new meshes (every 2 seconds for first 30 seconds)
    this.meshMonitoringInterval = setInterval(() => {
      this.checkForNewMeshes();
    }, 2000);
    
    // Stop continuous monitoring after 30 seconds
    setTimeout(() => {
      if (this.meshMonitoringInterval) {
        clearInterval(this.meshMonitoringInterval);
        this.meshMonitoringInterval = null;
        console.log('✓ Mesh monitoring stopped after 30 seconds');
      }
    }, 30000);
    
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
      bottom: 1.7vw;
      left: 50%;
      transform: translateX(-50%);
      background: transparent;
      color: #9A9A9A;
      padding: 10px 0;
      border: none;
      font-family: Arial, sans-serif;
      font-size: 1.5vw;
      font-weight: normal;
      display: none;
      z-index: 1000;
      text-align: center;
    `;
    this.promptElement.innerHTML = 'Press <span style="color: #fff;">[ F ]</span> to Interact';
    document.body.appendChild(this.promptElement);
    
    // Create exit prompt for locked-on mode
    this.exitPromptElement = document.createElement('div');
    this.exitPromptElement.id = 'exit-prompt';
    this.exitPromptElement.style.cssText = `
      position: fixed;
      bottom: 1.7vw;
      left: 50%;
      transform: translateX(-50%);
      background: transparent;
      color: #9A9A9A;
      padding: 10px 0;
      border: none;
      font-family: Arial, sans-serif;
      font-size: 1.5vw;
      font-weight: normal;
      display: none;
      z-index: 1000;
      text-align: center;
    `;
    this.exitPromptElement.innerHTML = 'Press <span style="color: #fff;">[ Esc ]</span> to Exit';
    document.body.appendChild(this.exitPromptElement);
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
      'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.002',
      'monitorFrame',
      'Base_Low_Material_0',
      'SM_Radio4.001_primitive0',
      'SM_Radio4.001_primitive1',
      'SM_Radio4_primitive0',
      'SM_Radio4_primitive1'
    ];
    
    console.log('=== Scanning scene for interactable objects ===');
    console.log('Total meshes in scene:', this.scene.meshes.length);
    
    // Search for radio meshes specifically
    console.log('🔍 Searching for radio meshes...');
    const radioMeshes = this.scene.meshes.filter(m => m.name.toLowerCase().includes('radio'));
    if (radioMeshes.length > 0) {
      console.log('Found radio-related meshes:');
      radioMeshes.forEach(m => {
        console.log(`  - ${m.name} | Pickable: ${m.isPickable} | Visible: ${m.isVisible} | Enabled: ${m.isEnabled()}`);
      });
    } else {
      console.log('❌ No radio meshes found in scene!');
    }
    
    // Only register the specific allowed meshes
    this.scene.meshes.forEach(mesh => {
      if (allowedMeshNames.includes(mesh.name)) {
        // Force mesh to be pickable
        mesh.isPickable = true;
        this.interactableObjects.push(mesh);
        console.log('✓ Registered interactable:', mesh.name, '| Pickable:', mesh.isPickable);
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
  
  checkForNewMeshes() {
    // NETWORK FIX: Check if any expected meshes are missing and try to add them
    const allowedMeshNames = [
      'SM_ComputerParts_C05_N1_54_StaticMeshComponent0',
      'Cube18_StaticMeshComponent0',
      'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.001',
      'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.002',
      'monitorFrame',
      'Base_Low_Material_0',
      'SM_Radio4.001_primitive0',
      'SM_Radio4.001_primitive1',
      'SM_Radio4_primitive0',
      'SM_Radio4_primitive1'
    ];
    
    let newMeshesFound = false;
    
    allowedMeshNames.forEach(meshName => {
      // Check if this mesh is already registered
      const alreadyRegistered = this.interactableObjects.some(m => m.name === meshName);
      
      if (!alreadyRegistered) {
        // Try to find it in the scene
        const mesh = this.scene.getMeshByName(meshName);
        if (mesh) {
          // Found a new mesh! Register it
          mesh.isPickable = true;
          this.interactableObjects.push(mesh);
          console.log(`🆕 NEW MESH DETECTED: ${meshName} - added to interactables`);
          newMeshesFound = true;
        }
      }
    });
    
    if (newMeshesFound) {
      console.log(`✓ Total interactable objects now: ${this.interactableObjects.length}`);
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
    
    // Don't update if effects are playing - hide all UI
    if (window.effectsPlaying) {
      this.clearFocusedObject();
      // Hide crosshair
      if (this.crosshairElement) {
        this.crosshairElement.style.display = 'none';
      }
      // Hide exit prompt
      if (this.exitPromptElement) {
        this.exitPromptElement.style.display = 'none';
      }
      return;
    }
    
    // Show crosshair when effects are not playing AND not locked on
    if (this.crosshairElement && this.crosshairElement.style.display === 'none' && !this.isLockedOn) {
      this.crosshairElement.style.display = 'block';
    }
    
    // Show exit prompt when effects are not playing and locked on
    if (this.exitPromptElement && this.exitPromptElement.style.display === 'none' && this.isLockedOn) {
      this.exitPromptElement.style.display = 'block';
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
    
    // Debug: Check what we're hitting (every 30 frames for more frequent updates)
    if (this.scene.getFrameId() % 30 === 0) {
      // Use multiPickWithRay to see ALL meshes in the ray path
      const allHits = this.scene.multiPickWithRay(ray);
      if (allHits && allHits.length > 0) {
        console.log('🎯 HOVERING OVER (all meshes in ray):');
        allHits.forEach((hit, index) => {
          if (hit.pickedMesh) {
            console.log(`  ${index + 1}. ${hit.pickedMesh.name} | Distance: ${hit.distance.toFixed(2)}`);
          }
        });
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
    
    // Check if device is unlocked before showing prompt
    const deviceName = this.getDeviceNameFromMesh(mesh);
    const isUnlocked = this.isDeviceUnlocked(deviceName);
    console.log(`👁️ Looking at mesh: ${mesh.name} → deviceName: ${deviceName}, unlocked: ${isUnlocked}`);
    if (deviceName && !isUnlocked) {
      console.log(`🔒 Device ${deviceName} is locked - hiding prompt`);
      // Device is locked, don't show prompt or highlight
      return;
    }
    console.log(`✅ Device ${deviceName} is unlocked - showing prompt`);
    
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
  
  getDeviceNameFromMesh(mesh) {
    // Map mesh names to device names (must match eventTrigger names)
    const meshName = mesh.name.toLowerCase();
    if (meshName.includes('c05') || meshName.includes('computerparts')) {
      return 'cassette';
    } else if (meshName.includes('monitor') && meshName.includes('.002')) {
      return 'monitor2'; // Second monitor (check before 'monitor')
    } else if (meshName.includes('monitor') || meshName.includes('monitorframe')) {
      return 'monitor';
    } else if (meshName.includes('cube18')) {
      return 'equalizer_game';
    } else if (meshName.includes('radio')) {
      return 'military_radio';
    } else if (meshName.includes('base_low')) {
      return 'power_source';
    }
    return null;
  }
  
  isDeviceUnlocked(deviceName) {
    // Check global machineInteractions instance for unlock state
    if (window.machineInteractions) {
      return window.machineInteractions.isDeviceUnlocked(deviceName);
    }
    // Default to unlocked if machineInteractions not available
    return true;
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
    
    // Hide center cursor when locked on
    this.updateCursorVisibility();
    
    // Show exit prompt
    if (this.exitPromptElement) {
      this.exitPromptElement.style.display = 'block';
    }
    
    // Disable FXAA post-processing only when locking on to monitor
    const isMonitor = this.focusedObject.name === 'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.001' || 
                      this.focusedObject.name === 'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.002' ||
                      this.focusedObject.name === 'monitorFrame';
    
    if (isMonitor && window.postProcessingPipeline && window.postProcessingPipeline.fxaaEnabled !== undefined) {
      this.fxaaWasEnabled = window.postProcessingPipeline.fxaaEnabled;
      window.postProcessingPipeline.fxaaEnabled = false;
      console.log('✓ FXAA disabled for monitor lock-on');
      
      // Set monitor lock-on state
      if (this.focusedObject.name === 'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.001' && window.monitorController) {
        window.monitorController.isLockedOn = true;
        // Capture screen on lock-on
        if (window.monitorController.captureIframeToTexture) {
          window.monitorController.captureIframeToTexture();
          setTimeout(() => {
            if (window.monitorController.isLockedOn) {
              window.monitorController.captureIframeToTexture();
            }
          }, 1000);
        }
      } else if (this.focusedObject.name === 'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.002' && window.monitor2Controller) {
        window.monitor2Controller.isLockedOn = true;
        // Capture screen on lock-on
        if (window.monitor2Controller.captureIframeToTexture) {
          window.monitor2Controller.captureIframeToTexture();
          setTimeout(() => {
            if (window.monitor2Controller.isLockedOn) {
              window.monitor2Controller.captureIframeToTexture();
            }
          }, 1000);
        }
      } else if (window.monitorController) {
        window.monitorController.isLockedOn = true;
        // Capture screen on lock-on
        if (window.monitorController.captureIframeToTexture) {
          window.monitorController.captureIframeToTexture();
          setTimeout(() => {
            if (window.monitorController.isLockedOn) {
              window.monitorController.captureIframeToTexture();
            }
          }, 1000);
        }
      }
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
        // Check if this is the monitor and if it's powered on
        const isMonitor = machineConfig.id === 'computer_monitor' || machineConfig.id === 'monitor_frame';
        const monitorPoweredOn = window.monitorController && window.monitorController.isPoweredOn;
        
        console.log('🔍 Monitor check:', {
          isMonitor,
          monitorExists: !!window.monitorController,
          isPoweredOn: window.monitorController?.isPoweredOn,
          hasPoweredOnConfig: !!machineConfig.cameraPositionPoweredOn
        });
        
        // Use powered-on position if monitor is on and has that config
        if (isMonitor && monitorPoweredOn && machineConfig.cameraPositionPoweredOn) {
          targetPosition = new BABYLON.Vector3(
            machineConfig.cameraPositionPoweredOn.x,
            machineConfig.cameraPositionPoweredOn.y,
            machineConfig.cameraPositionPoweredOn.z
          );
          targetRotation = new BABYLON.Vector3(
            machineConfig.cameraRotationPoweredOn.x,
            machineConfig.cameraRotationPoweredOn.y,
            machineConfig.cameraRotationPoweredOn.z
          );
          console.log('✅ Using POWERED-ON camera config for machine:', machineConfig.displayName);
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
    
    // Normalize rotation to find shortest path
    const currentRotation = this.camera.rotation.clone();
    const normalizedTarget = targetRotation.clone();
    
    // Normalize Y rotation to find shortest path (most common rotation axis)
    const currentY = currentRotation.y;
    const targetY = normalizedTarget.y;
    
    // Calculate difference and normalize to [-π, π]
    let deltaY = targetY - currentY;
    while (deltaY > Math.PI) deltaY -= 2 * Math.PI;
    while (deltaY < -Math.PI) deltaY += 2 * Math.PI;
    
    // Adjust target to take shortest path
    normalizedTarget.y = currentY + deltaY;
    
    // Do the same for X rotation
    let deltaX = normalizedTarget.x - currentRotation.x;
    while (deltaX > Math.PI) deltaX -= 2 * Math.PI;
    while (deltaX < -Math.PI) deltaX += 2 * Math.PI;
    normalizedTarget.x = currentRotation.x + deltaX;
    
    // And Z rotation
    let deltaZ = normalizedTarget.z - currentRotation.z;
    while (deltaZ > Math.PI) deltaZ -= 2 * Math.PI;
    while (deltaZ < -Math.PI) deltaZ += 2 * Math.PI;
    normalizedTarget.z = currentRotation.z + deltaZ;
    
    // Rotation animation
    const rotationAnimation = new BABYLON.Animation(
      'cameraRotationAnimation',
      'rotation',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    rotationAnimation.setKeys([
      { frame: 0, value: currentRotation },
      { frame: animationDuration, value: normalizedTarget }
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
      
      // Highlight interactive elements after camera animation completes
      this.highlightInteractiveElements();
      
      // Activate monitor controllers after camera animation completes
      // Monitor 2 auto-activates, Monitor 1 requires power button press
      if (this.focusedObject.name === 'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.002' && window.monitor2Controller) {
        window.monitor2Controller.activate();
        console.log('✓ Monitor 2 activated after camera animation');
      }
      // Monitor 1 does NOT auto-activate - requires power button press
      
      // Start radio animation if locked on to radio
      const isRadio = this.focusedObject.name.includes('SM_Radio4');
      if (isRadio && window.machineInteractions) {
        window.machineInteractions.startRadioAnimation();
        console.log('✓ Radio animation started');
      }
    });
    
    console.log('Locking on to:', this.focusedObject.name);
    
    // Trigger interaction event (can be extended)
    this.onObjectInteract(this.focusedObject);
  }
  
  exitLockOn() {
    if (!this.isLockedOn) {
      return;
    }
    
    // Clear all highlights when exiting lock-on
    this.clearHighlights();
    
    // Stop radio animation if exiting from radio
    const isRadio = this.focusedObject && this.focusedObject.name.includes('SM_Radio4');
    if (isRadio && window.machineInteractions) {
      window.machineInteractions.stopRadioAnimation();
      console.log('✓ Radio animation stopped');
    }
    
    this.isLockedOn = false;
    
    // Show center cursor when exiting lock-on
    this.updateCursorVisibility();
    
    // Hide exit prompt
    if (this.exitPromptElement) {
      this.exitPromptElement.style.display = 'none';
    }
    
    // Re-enable FXAA post-processing only if it was disabled (monitor lock-on)
    const isMonitor = this.focusedObject && (
      this.focusedObject.name === 'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.001' || 
      this.focusedObject.name === 'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.002' ||
      this.focusedObject.name === 'monitorFrame'
    );
    
    // Deactivate monitor controllers
    if (this.focusedObject && this.focusedObject.name === 'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.001' && window.monitorController) {
      window.monitorController.deactivate();
      console.log('✓ Monitor 1 deactivated');
    } else if (this.focusedObject && this.focusedObject.name === 'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.002' && window.monitor2Controller) {
      window.monitor2Controller.deactivate();
      console.log('✓ Monitor 2 deactivated');
    }
    
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
      
      // Normalize rotation to find shortest path back to original
      const currentRotation = this.camera.rotation.clone();
      const normalizedTarget = this.originalCameraRotation.clone();
      
      // Normalize Y rotation to find shortest path
      const currentY = currentRotation.y;
      const targetY = normalizedTarget.y;
      
      let deltaY = targetY - currentY;
      while (deltaY > Math.PI) deltaY -= 2 * Math.PI;
      while (deltaY < -Math.PI) deltaY += 2 * Math.PI;
      normalizedTarget.y = currentY + deltaY;
      
      // Normalize X rotation
      let deltaX = normalizedTarget.x - currentRotation.x;
      while (deltaX > Math.PI) deltaX -= 2 * Math.PI;
      while (deltaX < -Math.PI) deltaX += 2 * Math.PI;
      normalizedTarget.x = currentRotation.x + deltaX;
      
      // Normalize Z rotation
      let deltaZ = normalizedTarget.z - currentRotation.z;
      while (deltaZ > Math.PI) deltaZ -= 2 * Math.PI;
      while (deltaZ < -Math.PI) deltaZ += 2 * Math.PI;
      normalizedTarget.z = currentRotation.z + deltaZ;
      
      // Rotation animation
      const rotationAnimation = new BABYLON.Animation(
        'cameraReturnRotationAnimation',
        'rotation',
        60,
        BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      );
      
      rotationAnimation.setKeys([
        { frame: 0, value: currentRotation },
        { frame: animationDuration, value: normalizedTarget }
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
      
      if (this.focusedObject) {
        this.promptElement.style.display = 'block';
      }
    }
    
    // Hide cursor
    this.canvas.style.cursor = 'default';
    
    console.log('Exited lock-on mode');
  }
  
  updateCursorVisibility() {
    // New function to manage cursor visibility based on lock-on state
    if (!this.crosshairElement) {
      return;
    }
    
    if (this.isLockedOn) {
      // Hide crosshair when locked on
      this.crosshairElement.style.display = 'none';
      console.log('✓ Center cursor hidden (locked on)');
    } else {
      // Show crosshair when not locked on (unless effects are playing)
      if (!window.effectsPlaying) {
        this.crosshairElement.style.display = 'block';
        console.log('✓ Center cursor shown (not locked on)');
      }
    }
  }
  
  onObjectInteract(mesh) {
    // This method can be extended to trigger specific interactions
    // For example, activate monitor, open UI, etc.
    console.log('Interacting with:', mesh.name);
    
    // Monitor activation is now handled by M key only
    // F key just locks camera view
  }
  
  highlightInteractiveElements() {
    // Get the machine config for the focused object
    const machineConfig = getMachineByMeshName(this.focusedObject.name);
    
    if (!machineConfig) {
      console.warn('No machine config found for highlighting');
      return;
    }
    
    console.log('🌟 Highlighting interactive elements for:', machineConfig.displayName);
    
    // Get all interactive elements from the config
    const interactiveElements = machineConfig.interactiveElements;
    
    if (!interactiveElements) {
      console.warn('No interactive elements defined in config');
      return;
    }
    
    // Highlight each interactive element
    Object.entries(interactiveElements).forEach(([elementId, elementConfig]) => {
      const mesh = this.scene.getMeshByName(elementConfig.meshName);
      
      if (!mesh) {
        console.warn(`Interactive element mesh not found: ${elementConfig.meshName}`);
        return;
      }
      
      // Create a subtle glow effect
      this.createGlowEffect(mesh);
      
      console.log(`✨ Highlighted: ${elementConfig.meshName}`);
    });
  }
  
  createGlowEffect(mesh) {
    if (!this.highlightLayer) {
      console.warn('HighlightLayer not available');
      return;
    }
    
    // Add mesh to highlight layer with full white color (full opacity)
    this.highlightLayer.addMesh(mesh, new BABYLON.Color3(1.0, 1.0, 1.0));
    this.highlightedMeshes.push(mesh);
    
    // Fade out after 1 second
    setTimeout(() => {
      this.fadeOutHighlight(mesh);
    }, 1000);
    
    console.log(`✨ Outline glow applied to: ${mesh.name}`);
  }
  
  fadeOutHighlight(mesh) {
    if (!this.highlightLayer) {
      return;
    }
    
    // Animate the highlight color alpha to 0 over 500ms
    const startColor = new BABYLON.Color3(1.0, 1.0, 1.0);
    const endColor = new BABYLON.Color3(0, 0, 0);
    const duration = 500; // ms
    const startTime = Date.now();
    
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Lerp between start and end color
      const currentColor = BABYLON.Color3.Lerp(startColor, endColor, progress);
      
      // Update highlight color
      this.highlightLayer.removeMesh(mesh);
      this.highlightLayer.addMesh(mesh, currentColor);
      
      if (progress >= 1) {
        clearInterval(fadeInterval);
        this.highlightLayer.removeMesh(mesh);
        const index = this.highlightedMeshes.indexOf(mesh);
        if (index > -1) {
          this.highlightedMeshes.splice(index, 1);
        }
      }
    }, 16); // ~60fps
  }
  
  clearHighlights() {
    if (!this.highlightLayer) {
      return;
    }
    
    // Remove all highlighted meshes
    this.highlightedMeshes.forEach(mesh => {
      this.highlightLayer.removeMesh(mesh);
    });
    
    this.highlightedMeshes = [];
    
    console.log('✓ Cleared all highlights');
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
    
    if (this.exitPromptElement) {
      this.exitPromptElement.remove();
    }
    
    if (this.crosshairElement) {
      this.crosshairElement.remove();
    }
    
    // NETWORK FIX: Clean up mesh monitoring interval
    if (this.meshMonitoringInterval) {
      clearInterval(this.meshMonitoringInterval);
      this.meshMonitoringInterval = null;
    }
    
    console.log('InteractionSystem disposed');
  }
}
