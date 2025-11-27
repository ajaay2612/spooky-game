/**
 * MachineInteractions - Handles interactive elements on machines
 * Features:
 * - Button press animations
 * - Click detection on specific meshes
 * - State management for machine components
 */

import { INTERACTIVE_MACHINES } from './InteractiveMachinesConfig.js';

export class MachineInteractions {
  constructor(scene) {
    this.scene = scene;
    this.interactiveButtons = new Map();
    this.buttonStates = new Map();
    
    this.initialize();
  }
  
  initialize() {
    // Register all interactive elements from config
    this.registerAllInteractiveElements();
    
    console.log('MachineInteractions initialized');
  }
  
  registerAllInteractiveElements() {
    // Loop through all machines in config
    for (const [machineId, machineConfig] of Object.entries(INTERACTIVE_MACHINES)) {
      const elements = machineConfig.interactiveElements;
      
      // Register buttons
      for (const [elementId, elementConfig] of Object.entries(elements)) {
        // Create unique ID by combining machine ID and element ID
        const uniqueId = `${machineId}_${elementId}`;
        
        if (elementConfig.type === 'button') {
          this.registerButton(uniqueId, elementConfig);
        } else if (elementConfig.type === 'dial') {
          this.registerDialFromConfig(uniqueId, elementConfig);
        }
      }
    }
  }
  
  registerButton(buttonId, config) {
    const button = this.scene.getMeshByName(config.meshName);
    
    if (!button) {
      console.warn(`Button mesh not found: ${config.meshName}`);
      // Try again after delay
      setTimeout(() => this.registerButton(buttonId, config), 1000);
      return;
    }
    
    // Make button pickable
    button.isPickable = true;
    
    // Store original position
    const originalPosition = button.position.clone();
    
    // Register button
    this.interactiveButtons.set(buttonId, {
      mesh: button,
      originalPosition: originalPosition,
      pressDepth: config.pressOffset,
      isPressed: false,
      action: config.action
    });
    
    // Add action manager
    button.actionManager = new BABYLON.ActionManager(this.scene);
    
    button.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPointerOverTrigger,
        () => { document.body.style.cursor = 'pointer'; }
      )
    );
    
    button.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPointerOutTrigger,
        () => { document.body.style.cursor = 'default'; }
      )
    );
    
    button.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickTrigger,
        () => { this.pressButton(buttonId); }
      )
    );
    
    console.log(`✓ Button registered: ${config.meshName}`);
  }
  
  pressButton(buttonId) {
    const buttonData = this.interactiveButtons.get(buttonId);
    
    if (!buttonData || buttonData.isPressed) {
      return;
    }
    
    buttonData.isPressed = true;
    const button = buttonData.mesh;
    
    console.log(`🔘 Button pressed: ${buttonId}`);
    
    // Calculate press position
    const pressOffset = new BABYLON.Vector3(
      buttonData.pressDepth.x,
      buttonData.pressDepth.y,
      buttonData.pressDepth.z
    );
    const pressedPosition = buttonData.originalPosition.add(pressOffset);
    
    // Animate button press
    const pressAnimation = new BABYLON.Animation(
      'buttonPressAnimation',
      'position',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    pressAnimation.setKeys([
      { frame: 0, value: button.position.clone() },
      { frame: 5, value: pressedPosition }
    ]);
    
    const releaseAnimation = new BABYLON.Animation(
      'buttonReleaseAnimation',
      'position',
      60,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    
    releaseAnimation.setKeys([
      { frame: 0, value: pressedPosition },
      { frame: 10, value: buttonData.originalPosition }
    ]);
    
    button.animations = [pressAnimation];
    this.scene.beginAnimation(button, 0, 5, false, 2, () => {
      button.animations = [releaseAnimation];
      this.scene.beginAnimation(button, 0, 10, false, 1, () => {
        buttonData.isPressed = false;
        this.onButtonPressed(buttonId, buttonData.action);
      });
    });
  }
  
  onButtonPressed(buttonId, action) {
    console.log(`⚡ Button action: ${action}`);
    
    // Handle different button actions
    if (action === 'togglePower') {
      if (window.monitorController) {
        window.monitorController.activate();
        console.log('✓ Monitor activated');
      }
    }
  }
  

  
  registerDialFromConfig(dialId, config) {
    const dial = this.scene.getMeshByName(config.meshName);
    
    if (!dial) {
      console.warn(`Dial mesh not found: ${config.meshName}`);
      setTimeout(() => this.registerDialFromConfig(dialId, config), 1000);
      return;
    }
    
    dial.isPickable = true;
    
    const originalRotation = dial.rotationQuaternion ? dial.rotationQuaternion.clone() : 
                            BABYLON.Quaternion.FromEulerAngles(dial.rotation.x, dial.rotation.y, dial.rotation.z);
    
    this.interactiveButtons.set(dialId, {
      mesh: dial,
      originalRotation: originalRotation,
      currentAngle: 0,
      rotationAxis: new BABYLON.Vector3(config.rotationAxis.x, config.rotationAxis.y, config.rotationAxis.z).normalize(),
      isDragging: false,
      lastMouseX: 0,
      sensitivity: config.sensitivity,
      action: config.action
    });
    
    this.setupDialDrag(dial, dialId);
    
    console.log(`✓ Dial registered: ${config.meshName}`);
  }
  
  registerDial() {
    const dial = this.scene.getMeshByName('SM_ComputerParts_C05_N1_54_StaticMeshComponent0.dial');
    
    if (!dial) {
      console.warn('Dial mesh not found');
      // Try again after delay (model might not be loaded yet)
      setTimeout(() => this.registerDial(), 1000);
      return;
    }
    
    // Make dial pickable and enable pointer events
    dial.isPickable = true;
    
    // Store original rotation
    const originalRotation = dial.rotationQuaternion ? dial.rotationQuaternion.clone() : 
                            BABYLON.Quaternion.FromEulerAngles(dial.rotation.x, dial.rotation.y, dial.rotation.z);
    
    // Register dial with drag state (using correct Z-axis rotation)
    this.interactiveButtons.set('dial', {
      mesh: dial,
      originalRotation: originalRotation,
      currentAngle: 0,
      rotationAxis: new BABYLON.Vector3(0.00, 0.00, 1.00).normalize(), // Pure Z-axis rotation
      isDragging: false,
      lastMouseX: 0,
      sensitivity: 0.01 // Rotation sensitivity
    });
    
    // Setup drag interaction
    this.setupDialDrag(dial);
    
    console.log('✓ Dial registered:', dial.name);
  }
  
  setupDialDrag(dial, dialId) {
    const dialData = this.interactiveButtons.get(dialId);
    
    // Mouse down - start dragging
    dial.actionManager = new BABYLON.ActionManager(this.scene);
    
    dial.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPointerOverTrigger,
        () => {
          document.body.style.cursor = 'grab';
        }
      )
    );
    
    dial.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPointerOutTrigger,
        () => {
          if (!dialData.isDragging) {
            document.body.style.cursor = 'default';
          }
        }
      )
    );
    
    dial.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickDownTrigger,
        (evt) => {
          dialData.isDragging = true;
          dialData.lastMouseX = this.scene.pointerX;
          document.body.style.cursor = 'grabbing';
          console.log('🎛️ Started dragging dial');
        }
      )
    );
    
    // Mouse move - rotate dial
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE && dialData.isDragging) {
        const deltaX = this.scene.pointerX - dialData.lastMouseX;
        dialData.lastMouseX = this.scene.pointerX;
        
        // Update angle based on horizontal mouse movement (negated for correct direction)
        dialData.currentAngle -= deltaX * dialData.sensitivity;
        
        // Apply rotation
        const rotationQuat = BABYLON.Quaternion.RotationAxis(dialData.rotationAxis, dialData.currentAngle);
        dial.rotationQuaternion = dialData.originalRotation.multiply(rotationQuat);
      }
    });
    
    // Mouse up - stop dragging
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP && dialData.isDragging) {
        dialData.isDragging = false;
        document.body.style.cursor = 'grab';
        console.log('🎛️ Stopped dragging dial at angle:', dialData.currentAngle.toFixed(2));
        this.onDialRotated(dialId, dialData.currentAngle, dialData.action);
      }
    });
  }
  
  onDialRotated(dialId, currentAngle, action) {
    console.log(`🎛️ Dial ${dialId} rotated to angle:`, currentAngle.toFixed(2), 'radians');
    
    // Handle different dial actions
    if (action === 'adjustVolume') {
      console.log('🔊 Volume adjusted');
    }
  }
  
  dispose() {
    // Clean up action managers
    this.interactiveButtons.forEach(buttonData => {
      if (buttonData.mesh.actionManager) {
        buttonData.mesh.actionManager.dispose();
      }
    });
    
    this.interactiveButtons.clear();
    console.log('MachineInteractions disposed');
  }
}
