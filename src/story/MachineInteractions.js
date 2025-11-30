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
    
    // Equalizer puzzle state - 5 columns, 2 levers per column
    this.rightSequence = this.generateRandomSequence();
    this.currentSequence = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; // Current lever positions (1-10 for 10 levers)
    this.solvedColumns = [false, false, false, false, false]; // 5 columns
    
    // Lever drag state tracking
    this.currentDraggingLever = null;
    this.leverObserversSetup = false;
    
    this.initialize();
  }
  
  generateRandomSequence() {
    // Fixed target sequence for 5 columns (each column controlled by 2 levers)
    const sequence = [4, 3, 8, 2, 6]; // 5 target heights for 5 columns
    console.log('🎯 Target sequence (5 columns):', sequence);
    return sequence;
  }
  
  initialize() {
    // Setup global lever observers (once for all levers)
    this.setupGlobalLeverObservers();
    
    // Register all interactive elements from config
    this.registerAllInteractiveElements();
    
    console.log('MachineInteractions initialized');
  }
  
  registerAllInteractiveElements() {
    // Loop through all machines in config
    for (const [machineId, machineConfig] of Object.entries(INTERACTIVE_MACHINES)) {
      const elements = machineConfig.interactiveElements;
      
      // Register buttons, dials, and levers
      for (const [elementId, elementConfig] of Object.entries(elements)) {
        // Create unique ID by combining machine ID and element ID
        const uniqueId = `${machineId}_${elementId}`;
        
        if (elementConfig.type === 'button') {
          this.registerButton(uniqueId, elementConfig);
        } else if (elementConfig.type === 'dial') {
          this.registerDialFromConfig(uniqueId, elementConfig);
        } else if (elementConfig.type === 'lever') {
          this.registerLever(uniqueId, elementConfig);
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
      // Check which machine this button belongs to
      if (buttonId.includes('computer_monitor')) {
        this.toggleMonitorPower();
      } else if (buttonId.includes('computer_audio_machine')) {
        this.toggleCassettePlayerPower();
      } else if (buttonId.includes('cube18_machine')) {
        this.toggleRadioPower();
      } else if (window.monitorController) {
        window.monitorController.activate();
        console.log('✓ Monitor activated');
      }
    }
  }
  
  toggleMonitorPower() {
    if (!window.monitorController) {
      console.warn('Monitor controller not found');
      return;
    }
    
    // Toggle monitor power
    if (window.monitorController.isActive) {
      window.monitorController.deactivate();
      this.setMonitorLED(false);
      console.log('✓ Monitor powered off');
    } else {
      window.monitorController.activate();
      this.setMonitorLED(true);
      console.log('✓ Monitor powered on');
    }
  }
  
  setMonitorLED(isOn) {
    // Find the LED mesh
    const ledMesh = this.scene.getMeshByName('SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.powerled');
    
    if (!ledMesh) {
      console.warn('Monitor LED mesh not found');
      // Try again after delay
      setTimeout(() => this.setMonitorLED(isOn), 500);
      return;
    }
    
    // Create unique LED material (clone to avoid affecting other meshes)
    if (!ledMesh.material || ledMesh.material.name !== 'monitorLEDMat') {
      const newMaterial = new BABYLON.StandardMaterial('monitorLEDMat', this.scene);
      ledMesh.material = newMaterial;
    }
    
    if (isOn) {
      // Green emission for power on
      ledMesh.material.emissiveColor = new BABYLON.Color3(0, 1, 0);
      ledMesh.material.diffuseColor = new BABYLON.Color3(0, 0.5, 0);
    } else {
      // Dark/off state
      ledMesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
      ledMesh.material.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    }
  }
  
  async toggleCassettePlayerPower() {
    // Find the cassette display mesh (the screen part)
    const displayMesh = this.scene.getMeshByName('SM_ComputerParts_C05_N1_54_StaticMeshComponent0.screen');
    
    if (!displayMesh) {
      console.warn('Cassette display mesh not found');
      setTimeout(() => this.toggleCassettePlayerPower(), 500);
      return;
    }
    
    // Verify the material name is cassetedisplay
    if (displayMesh.material && displayMesh.material.name !== 'cassetedisplay') {
      console.warn('Expected material "cassetedisplay" but found:', displayMesh.material.name);
    }
    
    // Initialize power state if not set
    if (this.cassettePlayerPowered === undefined) {
      this.cassettePlayerPowered = false;
    }
    
    this.cassettePlayerPowered = !this.cassettePlayerPowered;
    
    if (this.cassettePlayerPowered) {
      // Power on - load GUI texture
      await this.loadCassettePlayerGUI(displayMesh);
      this.playCassetteAudio();
      console.log('✓ Cassette player powered on');
    } else {
      // Power off - show black screen
      if (this.cassetteGUITexture) {
        this.cassetteGUITexture.rootContainer.clearControls();
      }
      this.stopCassetteAudio();
      console.log('✓ Cassette player powered off');
    }
  }
  
  async loadCassettePlayerGUI(displayMesh) {
    // Create GUI texture for the display mesh if not exists
    if (!this.cassetteGUITexture) {
      this.cassetteGUITexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMeshTexture(
        displayMesh,
        1024,
        1024
      );
      
      // Apply calibrated alignment values (same as monitor)
      // Monitor GUI Alignment: rotation: 270°, uAng: π (180° flip)
      this.cassetteGUITexture.rootContainer.rotation = 4.7124; // 270° in radians
      this.cassetteGUITexture.rootContainer.scaleX = 1.00;
      this.cassetteGUITexture.rootContainer.scaleY = 1.00;
      this.cassetteGUITexture.rootContainer.left = 0;
      this.cassetteGUITexture.rootContainer.top = 0;
      
      // Texture UV transform - flip horizontally with 180° U rotation
      this.cassetteGUITexture.uScale = 1.00;
      this.cassetteGUITexture.vScale = 1.00;
      this.cassetteGUITexture.uOffset = 0.00;
      this.cassetteGUITexture.vOffset = 0.00;
      this.cassetteGUITexture.uAng = Math.PI; // 3.14159... (180°)
      this.cassetteGUITexture.vAng = 0.00;
      this.cassetteGUITexture.wAng = 0.00;
      
      // Store original material
      this.cassetteOriginalMaterial = displayMesh.material;
      
      // Apply GUI texture to material
      if (this.cassetteOriginalMaterial) {
        // PBR Material
        if (this.cassetteOriginalMaterial.albedoTexture !== undefined) {
          this.cassetteOriginalMaterial.albedoTexture = this.cassetteGUITexture;
          this.cassetteOriginalMaterial.emissiveTexture = this.cassetteGUITexture;
          this.cassetteOriginalMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
          this.cassetteOriginalMaterial.emissiveIntensity = 1;
          this.cassetteOriginalMaterial.unlit = true;
        } 
        // Standard Material
        else {
          this.cassetteOriginalMaterial.diffuseTexture = this.cassetteGUITexture;
          this.cassetteOriginalMaterial.emissiveTexture = this.cassetteGUITexture;
          this.cassetteOriginalMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
          this.cassetteOriginalMaterial.disableLighting = true;
        }
      }
      
      console.log('✓ Cassette GUI texture created');
    }
    
    // Load frame1.json
    try {
      const response = await fetch('textures/casseteplayer/frame1.json');
      const guiData = await response.json();
      
      // Clear existing controls
      this.cassetteGUITexture.rootContainer.clearControls();
      
      // Load controls from JSON
      if (guiData.root && guiData.root.children) {
        for (const childData of guiData.root.children) {
          const control = await this.createControlFromJSON(childData);
          if (control) {
            this.cassetteGUITexture.addControl(control);
            
            // Store reference to time text (look for the time display text)
            if (control.name === 'Textblock' && childData.text && childData.text.includes(':')) {
              this.cassetteTimeText = control;
              console.log('✓ Found time text control');
            }
          }
        }
      }
      
      console.log('✓ Cassette player GUI loaded');
    } catch (error) {
      console.error('Failed to load cassette player GUI:', error);
    }
  }
  
  async createControlFromJSON(data) {
    const className = data.className;
    let control = null;
    
    // Create control based on className
    if (className === 'Image') {
      control = new BABYLON.GUI.Image(data.name, data.source);
      if (data.stretch !== undefined) control.stretch = data.stretch;
    } else if (className === 'TextBlock') {
      control = new BABYLON.GUI.TextBlock(data.name, data.text);
      if (data.textHorizontalAlignment !== undefined) control.textHorizontalAlignment = data.textHorizontalAlignment;
      if (data.textVerticalAlignment !== undefined) control.textVerticalAlignment = data.textVerticalAlignment;
      if (data.fontSize) control.fontSize = data.fontSize;
      if (data.fontFamily) control.fontFamily = data.fontFamily;
      if (data.color) control.color = data.color;
    } else if (className === 'Rectangle') {
      control = new BABYLON.GUI.Rectangle(data.name);
      if (data.background) control.background = data.background;
      if (data.thickness !== undefined) control.thickness = data.thickness;
      if (data.cornerRadius !== undefined) control.cornerRadius = data.cornerRadius;
    } else if (className === 'Container') {
      control = new BABYLON.GUI.Container(data.name);
    } else if (className === 'StackPanel') {
      control = new BABYLON.GUI.StackPanel(data.name);
    } else if (className === 'Button') {
      control = BABYLON.GUI.Button.CreateSimpleButton(data.name, data.text || '');
      if (data.background) control.background = data.background;
    } else if (className === 'Ellipse') {
      control = new BABYLON.GUI.Ellipse(data.name);
      if (data.background) control.background = data.background;
      if (data.thickness !== undefined) control.thickness = data.thickness;
    }
    
    if (!control) {
      console.warn(`Unsupported control type: ${className}`);
      return null;
    }
    
    // Apply common properties
    if (data.width) control.width = data.width;
    if (data.height) control.height = data.height;
    if (data.left) control.left = data.left;
    if (data.top) control.top = data.top;
    if (data.horizontalAlignment !== undefined) control.horizontalAlignment = data.horizontalAlignment;
    if (data.verticalAlignment !== undefined) control.verticalAlignment = data.verticalAlignment;
    if (data.isVisible !== undefined) control.isVisible = data.isVisible;
    if (data.color) control.color = data.color;
    if (data.alpha !== undefined) control.alpha = data.alpha;
    
    return control;
  }
  
  playCassetteAudio() {
    // Create HTML5 audio if not exists
    if (!this.cassetteAudio) {
      console.log('🎵 Creating cassette audio with HTML5 Audio...');
      this.cassetteAudio = new Audio('textures/casseteplayer/audio.mp3');
      this.cassetteAudio.volume = 0.5;
      this.cassetteAudio.loop = false;
      
      // Add event listener for when audio ends
      this.cassetteAudio.addEventListener('ended', () => {
        console.log('🎵 Cassette audio finished - powering off');
        this.cassettePlayerPowered = false;
        if (this.cassetteGUITexture) {
          this.cassetteGUITexture.rootContainer.clearControls();
        }
        this.stopTimeUpdate();
      });
      
      // Add error handler
      this.cassetteAudio.addEventListener('error', (e) => {
        console.error('🎵 Audio error:', e);
      });
      
      // Add loaded handler
      this.cassetteAudio.addEventListener('canplaythrough', () => {
        console.log('🎵 Audio loaded and ready');
      });
    }
    
    // Play audio
    console.log('🎵 Attempting to play audio...');
    const playPromise = this.cassetteAudio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('🎵 Audio playing successfully!');
          this.startTimeUpdate();
        })
        .catch(error => {
          console.error('🎵 Failed to play audio:', error);
        });
    }
  }
  
  startTimeUpdate() {
    // Update time display every 100ms
    this.timeUpdateInterval = setInterval(() => {
      if (this.cassetteAudio && this.cassetteTimeText) {
        const currentTime = this.cassetteAudio.currentTime;
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);
        const timeString = `00:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.cassetteTimeText.text = timeString;
      }
    }, 100);
  }
  
  stopTimeUpdate() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }
  
  stopCassetteAudio() {
    // Stop audio
    if (this.cassetteAudio) {
      this.cassetteAudio.pause();
      this.cassetteAudio.currentTime = 0;
      console.log('🎵 Cassette audio stopped');
    }
    this.stopTimeUpdate();
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
        
        // Clamp angle for volume control (-π/2 to +π/2 range: left 90° = 0%, center = 50%, right 90° = 100%)
        if (dialData.action === 'adjustVolume') {
          dialData.currentAngle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, dialData.currentAngle));
        }
        
        // Apply rotation
        const rotationQuat = BABYLON.Quaternion.RotationAxis(dialData.rotationAxis, dialData.currentAngle);
        dial.rotationQuaternion = dialData.originalRotation.multiply(rotationQuat);
        
        // Real-time action update (e.g., volume adjustment)
        if (dialData.action === 'adjustVolume') {
          this.adjustCassetteVolume(dialData.currentAngle);
        }
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
      this.adjustCassetteVolume(currentAngle);
    }
  }
  
  adjustCassetteVolume(angle) {
    if (!this.cassetteAudio) {
      return;
    }
    
    // Map angle to volume (0 to 1) - inverted
    // Range: -π/2 (left 90°) = 100%, 0 (center) = 50%, +π/2 (right 90°) = 0%
    // Then invert: right = 100%, center = 50%, left = 0%
    let volumeRatio = 1 - ((angle + Math.PI / 2) / Math.PI);
    
    // Clamp between 0 and 1
    const volume = Math.max(0, Math.min(1, volumeRatio));
    
    this.cassetteAudio.volume = volume;
    console.log(`🔊 Volume: ${(volume * 100).toFixed(0)}% (angle: ${angle.toFixed(2)})`);
  }
  
  async toggleRadioPower() {
    // Find the radio display mesh
    const displayMesh = this.scene.getMeshByName('Cube18_StaticMeshComponent0.screen');
    
    if (!displayMesh) {
      console.warn('Radio display mesh not found');
      setTimeout(() => this.toggleRadioPower(), 500);
      return;
    }
    
    // Verify the material name is radiodisplay
    if (displayMesh.material && displayMesh.material.name !== 'radiodisplay') {
      console.warn('Expected material "radiodisplay" but found:', displayMesh.material.name);
    }
    
    // Initialize power state if not set
    if (this.radioPowered === undefined) {
      this.radioPowered = false;
    }
    
    this.radioPowered = !this.radioPowered;
    
    if (this.radioPowered) {
      // Power on - load GUI texture
      await this.loadRadioGUI(displayMesh);
      console.log('✓ Radio powered on');
    } else {
      // Power off - show black screen
      if (this.radioGUITexture) {
        this.radioGUITexture.rootContainer.clearControls();
      }
      console.log('✓ Radio powered off');
    }
  }
  
  async loadRadioGUI(displayMesh) {
    // Create GUI texture for the display mesh if not exists
    if (!this.radioGUITexture) {
      this.radioGUITexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMeshTexture(
        displayMesh,
        1024,
        1024
      );
      
      // Apply calibrated alignment values
      this.radioGUITexture.rootContainer.rotation = 1.5708; // 90° in radians
      this.radioGUITexture.rootContainer.scaleX = 1.00;
      this.radioGUITexture.rootContainer.scaleY = 1.00;
      this.radioGUITexture.rootContainer.left = -553;
      this.radioGUITexture.rootContainer.top = -2;
      
      // Texture UV transform
      this.radioGUITexture.uScale = 1.00;
      this.radioGUITexture.vScale = 1.00;
      this.radioGUITexture.uOffset = 0.00;
      this.radioGUITexture.vOffset = 0.00;
      this.radioGUITexture.uAng = 3.14; // 180°
      this.radioGUITexture.vAng = 0.00;
      this.radioGUITexture.wAng = 0.00;
      
      // Store original material
      this.radioOriginalMaterial = displayMesh.material;
      
      // Apply GUI texture to material
      if (this.radioOriginalMaterial) {
        // PBR Material
        if (this.radioOriginalMaterial.albedoTexture !== undefined) {
          this.radioOriginalMaterial.albedoTexture = this.radioGUITexture;
          this.radioOriginalMaterial.emissiveTexture = this.radioGUITexture;
          this.radioOriginalMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
          this.radioOriginalMaterial.emissiveIntensity = 1;
          this.radioOriginalMaterial.unlit = true;
        } 
        // Standard Material
        else {
          this.radioOriginalMaterial.diffuseTexture = this.radioGUITexture;
          this.radioOriginalMaterial.emissiveTexture = this.radioGUITexture;
          this.radioOriginalMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
          this.radioOriginalMaterial.disableLighting = true;
        }
      }
      
      console.log('✓ Radio GUI texture created');
    }
    
    // Load radioframe1.json
    try {
      const response = await fetch('textures/radio/radioframe1.json');
      const guiData = await response.json();
      
      // Clear existing controls
      this.radioGUITexture.rootContainer.clearControls();
      
      // IMPORTANT: Clear bar references since controls were just deleted
      this.columnBars = {}; // Reset all column bar references
      this.columnNumbers = {}; // Reset number text references
      
      // Load controls from JSON and store references
      this.radioBarControls = []; // Array of arrays - each column has multiple bars
      this.radioNumberControls = []; // Store number text controls
      this.radioAllControls = []; // Store all controls for debugging
      
      if (guiData.root && guiData.root.children) {
        for (let i = 0; i < guiData.root.children.length; i++) {
          const childData = guiData.root.children[i];
          const control = await this.createControlFromJSON(childData);
          if (control) {
            // IMPORTANT: Set background image behind bars
            if (childData.className === 'Image') {
              control.zIndex = -1; // Behind all bars
              control.isPointerBlocker = false; // Don't block pointer events
            }
            
            this.radioGUITexture.addControl(control);
            this.radioAllControls.push({ control, data: childData });
            
            // Store references to controls
            if (childData.className === 'Rectangle') {
              this.radioBarControls.push(control);
            } else if (childData.className === 'TextBlock') {
              this.radioNumberControls.push(control);
            }
          }
        }
      }
      
      console.log('✓ Radio GUI loaded');
      console.log(`  Total controls: ${this.radioAllControls.length}`);
      console.log(`  Rectangle controls: ${this.radioBarControls.length}`);
      console.log(`  TextBlock controls: ${this.radioNumberControls.length}`);
      
      // Initialize all columns with their current positions
      this.initializeAllColumns();
    } catch (error) {
      console.error('Failed to load radio GUI:', error);
    }
  }
  
  initializeAllColumns() {
    // Render all 5 columns (each controlled by 2 levers)
    console.log('🎚️ Initializing all equalizer columns (5 columns, 2 levers each)...');
    
    // IMPORTANT: Only initialize if radio is powered on
    if (!this.radioPowered) {
      console.log('⚠️ Radio is OFF - skipping column initialization');
      return;
    }
    
    // First, read current lever positions from the 3D meshes
    for (let leverIndex = 0; leverIndex < 10; leverIndex++) {
      const leverId = `cube18_machine_lever${leverIndex + 1}`;
      const leverData = this.interactiveButtons.get(leverId);
      
      if (leverData && leverData.currentOffset !== undefined) {
        // Convert offset (-1 to +1) to bar height (1 to 10)
        const barHeight = Math.round(((leverData.currentOffset + 1) / 2) * 9) + 1;
        this.currentSequence[leverIndex] = barHeight;
        console.log(`  Lever ${leverIndex + 1}: offset=${leverData.currentOffset.toFixed(2)}, height=${barHeight}`);
      }
    }
    
    // Now render all 5 columns based on actual lever positions
    for (let columnIndex = 0; columnIndex < 5; columnIndex++) {
      const lever1Index = columnIndex * 2;
      const lever2Index = columnIndex * 2 + 1;
      const lever1Height = this.currentSequence[lever1Index];
      const lever2Height = this.currentSequence[lever2Index];
      const combinedHeight = Math.round((lever1Height + lever2Height) / 2);
      
      this.updateEqualizerDisplay(columnIndex, combinedHeight);
      
      // Check if this column matches the target sequence
      this.checkLeverMatch(columnIndex, combinedHeight);
    }
    console.log('✓ All 5 columns initialized from current lever positions');
  }
  
  registerLever(leverId, config) {
    const lever = this.scene.getMeshByName(config.meshName);
    
    if (!lever) {
      console.warn(`Lever mesh not found: ${config.meshName}`);
      setTimeout(() => this.registerLever(leverId, config), 1000);
      return;
    }
    
    lever.isPickable = true;
    
    const originalPosition = lever.position.clone();
    
    this.interactiveButtons.set(leverId, {
      mesh: lever,
      originalPosition: originalPosition,
      minOffset: new BABYLON.Vector3(config.minOffset.x, config.minOffset.y, config.minOffset.z),
      maxOffset: new BABYLON.Vector3(config.maxOffset.x, config.maxOffset.y, config.maxOffset.z),
      currentOffset: 0, // 0 = center, -1 = bottom, +1 = top
      isDragging: false,
      lastMouseY: 0,
      sensitivity: 0.01 // Vertical drag sensitivity (increased)
    });
    
    this.setupLeverDrag(lever, leverId);
    
    console.log(`✓ Lever registered: ${config.meshName}`);
  }
  
  setupLeverDrag(lever, leverId) {
    const leverData = this.interactiveButtons.get(leverId);
    
    // Extract lever number from ID (e.g., "cube18_machine_lever1" -> 0)
    const leverMatch = leverId.match(/lever(\d+)/);
    const leverIndex = leverMatch ? parseInt(leverMatch[1]) - 1 : -1;
    
    // Store lever ID in leverData for filtering
    leverData.leverId = leverId;
    leverData.leverIndex = leverIndex;
    
    lever.actionManager = new BABYLON.ActionManager(this.scene);
    
    lever.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPointerOverTrigger,
        () => {
          document.body.style.cursor = 'ns-resize';
        }
      )
    );
    
    lever.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPointerOutTrigger,
        () => {
          if (!leverData.isDragging) {
            document.body.style.cursor = 'default';
          }
        }
      )
    );
    
    lever.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnPickDownTrigger,
        (evt) => {
          leverData.isDragging = true;
          leverData.lastMouseY = this.scene.pointerY;
          this.currentDraggingLever = leverId; // Track which lever is being dragged
          document.body.style.cursor = 'ns-resize';
          console.log('🎚️ Started dragging lever', leverIndex + 1);
        }
      )
    );
  }
  
  setupGlobalLeverObservers() {
    // Single global observer for all lever movements (called once in initialize)
    if (this.leverObserversSetup) return;
    this.leverObserversSetup = true;
    
    // Mouse move - drag lever vertically
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE && this.currentDraggingLever) {
        const leverData = this.interactiveButtons.get(this.currentDraggingLever);
        if (!leverData || !leverData.isDragging) return;
        
        const deltaY = this.scene.pointerY - leverData.lastMouseY;
        leverData.lastMouseY = this.scene.pointerY;
        
        // Update offset based on vertical mouse movement (inverted so drag up = positive)
        leverData.currentOffset -= deltaY * leverData.sensitivity;
        
        // Clamp offset between -1 and +1
        leverData.currentOffset = Math.max(-1, Math.min(1, leverData.currentOffset));
        
        // Calculate position based on offset
        // -1 = minOffset, 0 = center (original), +1 = maxOffset
        const offsetVector = leverData.minOffset.scale((1 - leverData.currentOffset) / 2)
          .add(leverData.maxOffset.scale((1 + leverData.currentOffset) / 2));
        
        leverData.mesh.position = leverData.originalPosition.add(offsetVector);
        
        // Map lever to column: 2 levers per column (0-1→col0, 2-3→col1, 4-5→col2, 6-7→col3, 8-9→col4)
        const leverIndex = leverData.leverIndex;
        if (leverIndex >= 0 && leverIndex < 10) {
          const barHeight = Math.round(((leverData.currentOffset + 1) / 2) * 9) + 1; // 1 to 10
          this.currentSequence[leverIndex] = barHeight;
          
          // Calculate which column this lever controls (2 levers per column)
          const columnIndex = Math.floor(leverIndex / 2); // 0-1→0, 2-3→1, 4-5→2, 6-7→3, 8-9→4
          
          // Calculate combined height from both levers in this column
          const lever1Index = columnIndex * 2;
          const lever2Index = columnIndex * 2 + 1;
          const lever1Height = this.currentSequence[lever1Index];
          const lever2Height = this.currentSequence[lever2Index];
          const combinedHeight = Math.round((lever1Height + lever2Height) / 2); // Average of both levers
          
          this.updateEqualizerDisplay(columnIndex, combinedHeight);
          
          // Hide number while dragging (will show again on mouse up if correct)
          if (this.columnNumbers && this.columnNumbers[columnIndex]) {
            this.columnNumbers[columnIndex].isVisible = false;
          }
        }
      }
    });
    
    // Mouse up - stop dragging
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP && this.currentDraggingLever) {
        const leverData = this.interactiveButtons.get(this.currentDraggingLever);
        if (!leverData) return;
        
        leverData.isDragging = false;
        document.body.style.cursor = 'default';
        
        const leverIndex = leverData.leverIndex;
        if (leverIndex >= 0 && leverIndex < 10) {
          const leverHeight = this.currentSequence[leverIndex];
          const columnIndex = Math.floor(leverIndex / 2);
          
          // Calculate combined height from both levers
          const lever1Index = columnIndex * 2;
          const lever2Index = columnIndex * 2 + 1;
          const lever1Height = this.currentSequence[lever1Index];
          const lever2Height = this.currentSequence[lever2Index];
          const combinedHeight = Math.round((lever1Height + lever2Height) / 2);
          
          console.log(`🎚️ Lever ${leverIndex + 1} set to ${leverHeight}/10 → Column ${columnIndex + 1} = ${combinedHeight}/10`);
          this.checkLeverMatch(columnIndex, combinedHeight);
        }
        
        this.currentDraggingLever = null; // Clear dragging state
      }
    });
  }
  
  updateEqualizerDisplay(leverIndex, barHeight) {
    // Update ONLY this column - complete isolation
    if (!this.radioGUITexture) return;
    
    // IMPORTANT: Only update GUI if radio is powered on
    if (!this.radioPowered) {
      console.log(`⚠️ Radio is OFF - skipping GUI update for column ${leverIndex + 1}`);
      return;
    }
    
    // Initialize column bars if not exists
    if (!this.columnBars) {
      this.columnBars = {}; // Store bars for each column
    }
    
    // IMPORTANT: Dispose old bars for this column to prevent overlap
    if (this.columnBars[leverIndex]) {
      this.columnBars[leverIndex].forEach(bar => {
        if (bar && !bar.isDisposed) {
          this.radioGUITexture.removeControl(bar);
          bar.dispose();
        }
      });
    }
    
    // Create fresh array for this column
    this.columnBars[leverIndex] = [];
    const column = this.columnBars[leverIndex];
    
    // Determine the correct color for this column
    const isColumnSolved = this.solvedColumns[leverIndex];
    const barColor = isColumnSolved ? '#A2E723FF' : '#E77123FF'; // Green if solved, orange otherwise
    
    // Create bars from bottom to top (only up to barHeight)
    for (let i = 0; i < barHeight; i++) {
      // Create new bar with unique z-index per bar
      const bar = new BABYLON.GUI.Rectangle(`col${leverIndex}_bar${i}`);
      bar.width = "108px";  // 90 * 1.2 = 108 (total 1.8x from original)
      bar.height = "18px";  // 15 * 1.2 = 18 (total 1.8x from original)
      bar.thickness = 0;
      bar.background = barColor;
      
      // Position: 5 columns with tighter spacing (140px between columns)
      bar.left = -280 + (leverIndex * 140);
      bar.top = -144 - (i * 22); // 18 * 1.2 = 21.6 ≈ 22
      bar.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      bar.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
      
      // Unique z-index: column * 100 + bar position (ensures no overlap)
      bar.zIndex = 100 + (leverIndex * 10) + i;
      
      this.radioGUITexture.addControl(bar);
      column[i] = bar;
    }
    
    console.log(`✓ Column ${leverIndex + 1}: Rendered ${barHeight} bars (${isColumnSolved ? 'GREEN' : 'ORANGE'})`);
  }
  
  checkLeverMatch(columnIndex, barHeight) {
    // columnIndex is 0-4 (5 columns)
    const targetHeight = this.rightSequence[columnIndex];
    
    if (barHeight === targetHeight) {
      // Correct! Mark as solved and show number
      if (!this.solvedColumns[columnIndex]) {
        this.solvedColumns[columnIndex] = true;
        console.log(`✅ Column ${columnIndex + 1} CORRECT! (${barHeight}/10)`);
      }
      
      // Always update GUI to show green and display number (even if already solved)
      this.showCorrectColumn(columnIndex, barHeight);
      
      // Check if all columns are solved
      if (this.solvedColumns.every(solved => solved)) {
        console.log('🎉 PUZZLE SOLVED! All 5 columns correct!');
        this.onPuzzleSolved();
      }
    } else if (this.solvedColumns[columnIndex] && barHeight !== targetHeight) {
      // Was correct, now wrong
      this.solvedColumns[columnIndex] = false;
      console.log(`❌ Column ${columnIndex + 1} no longer correct`);
      this.showIncorrectColumn(columnIndex);
    }
  }
  
  showCorrectColumn(columnIndex, barHeight) {
    // Update the GUI to show this column in green with the number
    console.log(`🟢 Column ${columnIndex + 1} turned green, showing number ${barHeight}`);
    
    // IMPORTANT: Redraw the column with green color (updateEqualizerDisplay reads solvedColumns state)
    this.updateEqualizerDisplay(columnIndex, barHeight);
    
    // Create or show number text above the stack
    if (!this.columnNumbers) {
      this.columnNumbers = {};
    }
    
    if (!this.columnNumbers[columnIndex]) {
      // Create number text
      const numberText = new BABYLON.GUI.TextBlock(`column${columnIndex}_number`, barHeight.toString());
      numberText.width = "80px";
      numberText.height = "50px";
      numberText.color = "#A2E723FF"; // Green
      numberText.fontSize = "45px"; // Increased from 30px
      numberText.fontFamily = "Print Char";
      numberText.left = -280 + (columnIndex * 140); // Match column spacing
      numberText.top = -144 - (barHeight * 22) - 35; // Margin below number (22 = new spacing)
      numberText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
      numberText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
      numberText.zIndex = 200 + columnIndex; // High z-index above all bars
      
      this.radioGUITexture.addControl(numberText);
      this.columnNumbers[columnIndex] = numberText;
    } else {
      // Update existing number
      this.columnNumbers[columnIndex].text = barHeight.toString();
      this.columnNumbers[columnIndex].top = -144 - (barHeight * 22) - 35; // Margin below number (22 = new spacing)
      this.columnNumbers[columnIndex].isVisible = true;
    }
  }
  
  showIncorrectColumn(columnIndex) {
    // Update the GUI to show this column in orange (default color)
    console.log(`🟠 Column ${columnIndex + 1} back to orange`);
    
    // IMPORTANT: Redraw the column with orange color (updateEqualizerDisplay reads solvedColumns state)
    const lever1Index = columnIndex * 2;
    const lever2Index = columnIndex * 2 + 1;
    const lever1Height = this.currentSequence[lever1Index];
    const lever2Height = this.currentSequence[lever2Index];
    const combinedHeight = Math.round((lever1Height + lever2Height) / 2);
    
    this.updateEqualizerDisplay(columnIndex, combinedHeight);
    
    // Hide the number
    if (this.columnNumbers && this.columnNumbers[columnIndex]) {
      this.columnNumbers[columnIndex].isVisible = false;
    }
  }
  
  onPuzzleSolved() {
    // Puzzle complete! Trigger whatever should happen
    console.log('🎊 EQUALIZER PUZZLE COMPLETE!');
    // You can trigger a door unlock, play a sound, etc.
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
