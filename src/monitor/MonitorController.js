/**
 * MonitorController - Manages monitor screen with Babylon.js GUI
 * Interactive menu system with keyboard controls
 */

import { MonitorDebugPanel } from './MonitorDebugPanel.js';

export class MonitorController {
  constructor(scene) {
    this.scene = scene;
    this.monitorMesh = null;
    this.guiTexture = null;
    this.originalMaterial = null;
    this.isActive = false;
    this.isPoweredOn = false; // Monitor starts powered off
    this.debugPanel = null;
    
    // Menu state
    this.currentScreen = 'main'; // 'main', 'start', 'credits'
    this.selectedOption = 0;
    this.menuOptions = [];
    
    // Frame transition state
    this.currentFrame = 1;
    this.frameTimer = 0;
    this.frameDuration = 5000; // 5 seconds per frame
    
    // Settings
    this.textureWidth = 2048;
    this.textureHeight = 1536;
    
    console.log('MonitorController initialized (GUI mode)');
  }

  /**
   * Initialize the monitor system
   */
  async initialize() {
    try {
      // Find or create monitor mesh
      this.setupMonitorMesh();
      
      console.log('MonitorController initialized - GUI pattern ready');
      return true;
    } catch (error) {
      console.error('Failed to initialize MonitorController:', error);
      return false;
    }
  }

  /**
   * Find or create monitor mesh in scene
   */
  setupMonitorMesh() {
    // Try to find existing monitor mesh by name
    this.monitorMesh = this.scene.getMeshByName('SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.screen');
    
    if (!this.monitorMesh) {
      this.monitorMesh = this.scene.getMeshByName('monitor_screen');
    }
    
    if (this.monitorMesh) {
      console.log('✓ Monitor mesh found:', this.monitorMesh.name);
      this.applyMaterialToMesh();
      return true;
    }
    
    // Set up observer to wait for it
    console.log('Monitor mesh not found yet, waiting for scene to load...');
    this.setupMeshObserver();
    return false;
  }
  
  /**
   * Setup observer to watch for monitor mesh being added to scene
   */
  setupMeshObserver() {
    const checkInterval = setInterval(() => {
      this.monitorMesh = this.scene.getMeshByName('SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.screen');
      
      if (!this.monitorMesh) {
        this.monitorMesh = this.scene.getMeshByName('monitor_screen');
      }
      
      if (this.monitorMesh) {
        console.log('✓ Monitor mesh found:', this.monitorMesh.name);
        clearInterval(checkInterval);
        this.applyMaterialToMesh();
      }
    }, 200);
    
    // Stop checking after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!this.monitorMesh) {
        console.warn('⚠ Monitor mesh not found after 10s');
      }
    }, 10000);
  }
  
  /**
   * Load a specific frame
   */
  async loadFrame(frameNumber) {
    if (!this.guiTexture) return;
    
    try {
      const response = await fetch(`textures/monitorFrame${frameNumber}.json`);
      const guiData = await response.json();
      
      // Clear existing controls
      this.guiTexture.rootContainer.clearControls();
      
      // Load the root container from JSON
      if (guiData.root && guiData.root.children) {
        guiData.root.children.forEach(childData => {
          const control = this.createControlFromJSON(childData);
          if (control) {
            this.guiTexture.addControl(control);
          }
        });
      }
      
      console.log(`✓ Frame ${frameNumber} loaded with`, guiData.root?.children?.length || 0, 'controls');
    } catch (error) {
      console.error(`Failed to load frame ${frameNumber}:`, error);
    }
  }
  
  /**
   * Apply GUI texture to the monitor mesh
   */
  async applyMaterialToMesh() {
    if (!this.monitorMesh) return;

    console.log('✓ Monitor mesh found:', this.monitorMesh.name);
    
    // Store original material
    this.originalMaterial = this.monitorMesh.material;
    
    // Create GUI texture for mesh (start with black screen)
    this.guiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMeshTexture(
      this.monitorMesh,
      this.textureWidth,
      this.textureHeight
    );
    
    // Start with black screen (powered off)
    this.showBlackScreen();
    
    // Apply calibrated alignment values for monitor GUI
    // Monitor GUI Alignment: rotation: 270°, uAng: π (180° flip)
    this.guiTexture.rootContainer.rotation = 4.7124; // 270° in radians
    this.guiTexture.rootContainer.scaleX = 1.00;
    this.guiTexture.rootContainer.scaleY = 1.00;
    this.guiTexture.rootContainer.left = 0;
    this.guiTexture.rootContainer.top = 0;
    
    // Texture UV transform - flip horizontally with 180° U rotation
    this.guiTexture.uScale = 1.00;
    this.guiTexture.vScale = 1.00;
    this.guiTexture.uOffset = 0.00;
    this.guiTexture.vOffset = 0.00;
    this.guiTexture.uAng = Math.PI; // 3.14159... (180°)
    this.guiTexture.vAng = 0.00;
    this.guiTexture.wAng = 0.00;
    
    console.log('✓ GUI texture created');
    
    // Apply to the original material
    if (this.originalMaterial) {
      // PBR Material
      if (this.originalMaterial.albedoTexture !== undefined) {
        this.originalMaterial.albedoTexture = this.guiTexture;
        this.originalMaterial.emissiveTexture = this.guiTexture;
        this.originalMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.originalMaterial.emissiveIntensity = 1;
        this.originalMaterial.unlit = true;
      } 
      // Standard Material
      else {
        this.originalMaterial.diffuseTexture = this.guiTexture;
        this.originalMaterial.emissiveTexture = this.guiTexture;
        this.originalMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.originalMaterial.disableLighting = true;
      }
    }
    
    // GUI is loaded from JSON, no need to draw test pattern
    
    // Create debug panel (disabled by default)
    // this.debugPanel = new MonitorDebugPanel(this);
    
    console.log('✓ Monitor ready');
    console.log('  Press G to toggle debug panel');
  }
  
  /**
   * Create a GUI control from JSON data
   */
  createControlFromJSON(data) {
    let control = null;
    
    switch(data.className) {
      case 'Rectangle':
        control = new BABYLON.GUI.Rectangle(data.name);
        if (data.background) control.background = data.background;
        if (data.color) control.color = data.color;
        if (data.thickness !== undefined) control.thickness = data.thickness;
        if (data.cornerRadius !== undefined) control.cornerRadius = data.cornerRadius;
        break;
      case 'TextBlock':
        control = new BABYLON.GUI.TextBlock(data.name);
        if (data.text) control.text = data.text;
        if (data.color) control.color = data.color;
        if (data.fontSize) control.fontSize = data.fontSize;
        if (data.fontFamily) control.fontFamily = data.fontFamily;
        if (data.fontStyle) control.fontStyle = data.fontStyle;
        if (data.fontWeight) control.fontWeight = data.fontWeight;
        if (data.textHorizontalAlignment !== undefined) control.textHorizontalAlignment = data.textHorizontalAlignment;
        if (data.textVerticalAlignment !== undefined) control.textVerticalAlignment = data.textVerticalAlignment;
        if (data.textWrapping !== undefined) control.textWrapping = data.textWrapping;
        break;
      case 'Ellipse':
        control = new BABYLON.GUI.Ellipse(data.name);
        if (data.background) control.background = data.background;
        if (data.color) control.color = data.color;
        if (data.thickness !== undefined) control.thickness = data.thickness;
        break;
      case 'Image':
        control = new BABYLON.GUI.Image(data.name, data.source);
        if (data.stretch !== undefined) control.stretch = data.stretch;
        if (data.sourceLeft !== undefined) control.sourceLeft = data.sourceLeft;
        if (data.sourceTop !== undefined) control.sourceTop = data.sourceTop;
        if (data.sourceWidth !== undefined) control.sourceWidth = data.sourceWidth;
        if (data.sourceHeight !== undefined) control.sourceHeight = data.sourceHeight;
        if (data.autoScale !== undefined) control.autoScale = data.autoScale;
        break;
      case 'Line':
        control = new BABYLON.GUI.Line(data.name);
        if (data.lineWidth !== undefined) control.lineWidth = data.lineWidth;
        if (data.color) control.color = data.color;
        if (data.x1 !== undefined) control.x1 = data.x1;
        if (data.y1 !== undefined) control.y1 = data.y1;
        if (data.x2 !== undefined) control.x2 = data.x2;
        if (data.y2 !== undefined) control.y2 = data.y2;
        if (data.dash !== undefined) control.dash = data.dash;
        if (data.connectedControl) control.connectedControl = data.connectedControl;
        break;
      case 'InputText':
        control = new BABYLON.GUI.InputText(data.name);
        if (data.text) control.text = data.text;
        if (data.color) control.color = data.color;
        if (data.background) control.background = data.background;
        if (data.fontSize) control.fontSize = data.fontSize;
        if (data.fontFamily) control.fontFamily = data.fontFamily;
        if (data.fontStyle) control.fontStyle = data.fontStyle;
        if (data.fontWeight) control.fontWeight = data.fontWeight;
        if (data.placeholderText) control.placeholderText = data.placeholderText;
        if (data.placeholderColor) control.placeholderColor = data.placeholderColor;
        if (data.thickness !== undefined) control.thickness = data.thickness;
        if (data.focusedBackground) control.focusedBackground = data.focusedBackground;
        if (data.textHighlightColor) control.textHighlightColor = data.textHighlightColor;
        if (data.highligherOpacity !== undefined) control.highligherOpacity = data.highligherOpacity;
        if (data.maxWidth) control.maxWidth = data.maxWidth;
        if (data.autoStretchWidth !== undefined) control.autoStretchWidth = data.autoStretchWidth;
        break;
      default:
        console.warn('Unknown control type:', data.className);
        return null;
    }
    
    if (control) {
      // Apply common properties
      if (data.width) control.width = data.width;
      if (data.height) control.height = data.height;
      if (data.left) control.left = data.left;
      if (data.top) control.top = data.top;
      if (data.horizontalAlignment !== undefined) control.horizontalAlignment = data.horizontalAlignment;
      if (data.verticalAlignment !== undefined) control.verticalAlignment = data.verticalAlignment;
      if (data.alpha !== undefined) control.alpha = data.alpha;
      if (data.isVisible !== undefined) control.isVisible = data.isVisible;
    }
    
    return control;
  }
  
  /**
   * Draw test pattern with corner markers
   */
  drawTestPattern() {
    if (!this.guiTexture) {
      console.error('GUI texture not initialized');
      return;
    }
    
    // Clear existing controls
    this.guiTexture.rootContainer.clearControls();
    
    // Visible screen area: 312x215 pixels
    const screenWidth = 312;
    const screenHeight = 215;
    
    // Background - full screen black
    const background = new BABYLON.GUI.Rectangle();
    background.width = '100%';
    background.height = '100%';
    background.background = '#000000';
    background.thickness = 0;
    this.guiTexture.addControl(background);
    
    // Visible area rectangle (for reference)
    const visibleArea = new BABYLON.GUI.Rectangle();
    visibleArea.width = screenWidth + 'px';
    visibleArea.height = screenHeight + 'px';
    visibleArea.background = '#0a0a0a';
    visibleArea.thickness = 2;
    visibleArea.color = '#00ff00';
    visibleArea.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    visibleArea.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this.guiTexture.addControl(visibleArea);
    
    const cornerSize = 50;
    const offset = 10;
    
    // Top-Left (RED)
    const topLeft = new BABYLON.GUI.Rectangle();
    topLeft.width = cornerSize + 'px';
    topLeft.height = cornerSize + 'px';
    topLeft.background = '#ff0000';
    topLeft.thickness = 0;
    topLeft.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    topLeft.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    topLeft.left = offset;
    topLeft.top = offset;
    this.guiTexture.addControl(topLeft);
    
    const topLeftText = new BABYLON.GUI.TextBlock();
    topLeftText.text = 'TOP-LEFT\nRED';
    topLeftText.color = '#ffffff';
    topLeftText.fontSize = 20;
    topLeftText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    topLeftText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    topLeftText.left = offset + 5;
    topLeftText.top = offset + cornerSize + 5;
    this.guiTexture.addControl(topLeftText);
    
    // Top-Right (BLUE)
    const topRight = new BABYLON.GUI.Rectangle();
    topRight.width = cornerSize + 'px';
    topRight.height = cornerSize + 'px';
    topRight.background = '#0000ff';
    topRight.thickness = 0;
    topRight.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    topRight.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    topRight.left = -offset;
    topRight.top = offset;
    this.guiTexture.addControl(topRight);
    
    const topRightText = new BABYLON.GUI.TextBlock();
    topRightText.text = 'TOP-RIGHT\nBLUE';
    topRightText.color = '#ffffff';
    topRightText.fontSize = 20;
    topRightText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    topRightText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    topRightText.left = -offset - 5;
    topRightText.top = offset + cornerSize + 5;
    this.guiTexture.addControl(topRightText);
    
    // Bottom-Left (YELLOW)
    const bottomLeft = new BABYLON.GUI.Rectangle();
    bottomLeft.width = cornerSize + 'px';
    bottomLeft.height = cornerSize + 'px';
    bottomLeft.background = '#ffff00';
    bottomLeft.thickness = 0;
    bottomLeft.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    bottomLeft.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    bottomLeft.left = offset;
    bottomLeft.top = -offset;
    this.guiTexture.addControl(bottomLeft);
    
    const bottomLeftText = new BABYLON.GUI.TextBlock();
    bottomLeftText.text = 'BOTTOM-LEFT\nYELLOW';
    bottomLeftText.color = '#000000';
    bottomLeftText.fontSize = 20;
    bottomLeftText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    bottomLeftText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    bottomLeftText.left = offset + 5;
    bottomLeftText.top = -offset - cornerSize - 30;
    this.guiTexture.addControl(bottomLeftText);
    
    // Bottom-Right (MAGENTA)
    const bottomRight = new BABYLON.GUI.Rectangle();
    bottomRight.width = cornerSize + 'px';
    bottomRight.height = cornerSize + 'px';
    bottomRight.background = '#ff00ff';
    bottomRight.thickness = 0;
    bottomRight.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    bottomRight.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    bottomRight.left = -offset;
    bottomRight.top = -offset;
    this.guiTexture.addControl(bottomRight);
    
    const bottomRightText = new BABYLON.GUI.TextBlock();
    bottomRightText.text = 'BOTTOM-RIGHT\nMAGENTA';
    bottomRightText.color = '#ffffff';
    bottomRightText.fontSize = 20;
    bottomRightText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    bottomRightText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    bottomRightText.left = -offset - 5;
    bottomRightText.top = -offset - cornerSize - 30;
    this.guiTexture.addControl(bottomRightText);
    
    // Center (GREEN)
    const center = new BABYLON.GUI.Rectangle();
    center.width = '200px';
    center.height = '200px';
    center.background = '#00ff00';
    center.thickness = 0;
    center.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    center.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this.guiTexture.addControl(center);
    
    const centerText = new BABYLON.GUI.TextBlock();
    centerText.text = 'CENTER\nGREEN';
    centerText.color = '#000000';
    centerText.fontSize = 40;
    centerText.fontWeight = 'bold';
    centerText.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    centerText.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this.guiTexture.addControl(centerText);
    
    console.log('✓ Test pattern drawn');
  }
  
  /**
   * Draw main menu screen
   */
  drawMainMenu() {
    // Use test pattern for alignment
    this.drawTestPattern();
  }
  
  /**
   * Create a menu button
   */
  createMenuButton(text, index, topOffset, parent) {
    const button = new BABYLON.GUI.TextBlock();
    button.text = text;
    button.color = '#00ff00';
    button.fontSize = 16;
    button.fontFamily = 'Courier New';
    button.top = topOffset;
    parent.addControl(button);
    return button;
  }
  
  /**
   * Highlight selected menu option
   */
  highlightOption(index) {
    this.menuOptions.forEach((option, i) => {
      if (i === index) {
        option.color = '#ffff00'; // Yellow for selected
        option.text = '> ' + option.text.replace('> ', '').replace(' <', '') + ' <';
      } else {
        option.color = '#00ff00'; // Green for unselected
        option.text = option.text.replace('> ', '').replace(' <', '');
      }
    });
  }
  
  /**
   * Handle keyboard input
   */
  handleInput(key) {
    // G key toggles debug panel (works even when inactive)
    if (key === 'g' || key === 'G') {
      if (this.debugPanel) {
        this.debugPanel.toggle();
      }
      return;
    }
    
    if (!this.isActive) return;
    
    // Debug controls for GUI alignment (keyboard shortcuts)
    if (key === '1') {
      this.debugPanel?.handleAction('rotate-cw');
    } else if (key === '2') {
      this.debugPanel?.handleAction('rotate-ccw');
    } else if (key === '3') {
      this.debugPanel?.handleAction('flip-h');
    } else if (key === '4') {
      this.debugPanel?.handleAction('flip-v');
    } else if (key === '0') {
      this.debugPanel?.handleAction('reset');
    } else if (key === 'q' || key === 'Q') {
      this.debugPanel?.handleAction('rotate-plus');
    } else if (key === 'e' || key === 'E') {
      this.debugPanel?.handleAction('rotate-minus');
    } else if (key === 'c' || key === 'C') {
      this.debugPanel?.handleAction('copy');
    }
    
    // Menu navigation
    if (key === 'ArrowUp') {
      this.selectedOption = (this.selectedOption - 1 + this.menuOptions.length) % this.menuOptions.length;
      this.highlightOption(this.selectedOption);
    } else if (key === 'ArrowDown') {
      this.selectedOption = (this.selectedOption + 1) % this.menuOptions.length;
      this.highlightOption(this.selectedOption);
    } else if (key === 'Enter') {
      this.selectOption();
    }
  }
  
  /**
   * Select current menu option
   */
  selectOption() {
    if (this.currentScreen === 'main') {
      if (this.selectedOption === 0) {
        this.showStartScreen();
      } else if (this.selectedOption === 1) {
        this.showCreditsScreen();
      }
    } else {
      // Go back to main menu
      this.drawMainMenu();
    }
  }
  
  /**
   * Show start screen
   */
  showStartScreen() {
    this.guiTexture.rootContainer.clearControls();
    this.menuOptions = [];
    
    const screenWidth = 312;
    const screenHeight = 215;
    
    const background = new BABYLON.GUI.Rectangle();
    background.width = '100%';
    background.height = '100%';
    background.background = '#000000';
    background.thickness = 0;
    this.guiTexture.addControl(background);
    
    const container = new BABYLON.GUI.Rectangle();
    container.width = screenWidth + 'px';
    container.height = screenHeight + 'px';
    container.background = '#0a0a0a';
    container.thickness = 0;
    container.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this.guiTexture.addControl(container);
    
    const text = new BABYLON.GUI.TextBlock();
    text.text = 'GAME STARTING...\n\nPress ENTER to return';
    text.color = '#00ff00';
    text.fontSize = 14;
    text.fontFamily = 'Courier New';
    text.textWrapping = true;
    container.addControl(text);
    
    this.currentScreen = 'start';
  }
  
  /**
   * Show credits screen
   */
  showCreditsScreen() {
    this.guiTexture.rootContainer.clearControls();
    this.menuOptions = [];
    
    const screenWidth = 312;
    const screenHeight = 215;
    
    const background = new BABYLON.GUI.Rectangle();
    background.width = '100%';
    background.height = '100%';
    background.background = '#000000';
    background.thickness = 0;
    this.guiTexture.addControl(background);
    
    const container = new BABYLON.GUI.Rectangle();
    container.width = screenWidth + 'px';
    container.height = screenHeight + 'px';
    container.background = '#0a0a0a';
    container.thickness = 0;
    container.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    this.guiTexture.addControl(container);
    
    const text = new BABYLON.GUI.TextBlock();
    text.text = 'CREDITS\n\nCreated by: BLACK NOVA\nEngine: Babylon.js\n\nPress ENTER to return';
    text.color = '#00ff00';
    text.fontSize = 12;
    text.fontFamily = 'Courier New';
    text.textWrapping = true;
    container.addControl(text);
    
    this.currentScreen = 'credits';
  }



  /**
   * Show black screen (powered off state)
   */
  showBlackScreen() {
    if (!this.guiTexture) return;
    
    this.guiTexture.rootContainer.clearControls();
    
    const background = new BABYLON.GUI.Rectangle();
    background.width = '100%';
    background.height = '100%';
    background.background = '#000000';
    background.thickness = 0;
    this.guiTexture.addControl(background);
  }

  /**
   * Power on the monitor and load frame 1
   */
  async powerOn() {
    if (this.isPoweredOn) return;
    
    this.isPoweredOn = true;
    this.currentFrame = 1;
    this.frameTimer = 0;
    
    // Load frame 1
    try {
      const response = await fetch('textures/monitorFrame1.json');
      const guiData = await response.json();
      
      this.guiTexture.rootContainer.clearControls();
      
      if (guiData.root && guiData.root.children) {
        guiData.root.children.forEach(childData => {
          const control = this.createControlFromJSON(childData);
          if (control) {
            this.guiTexture.addControl(control);
          }
        });
      }
      
      console.log('✓ Monitor powered on - Frame 1 loaded');
    } catch (error) {
      console.error('Failed to load frame 1:', error);
    }
  }

  /**
   * Activate monitor (enable keyboard input)
   */
  activate() {
    if (!this.isPoweredOn) {
      this.powerOn();
    }
    this.isActive = true;
    console.log('✓ Monitor activated');
  }

  deactivate() {
    this.isActive = false;
    console.log('✓ Monitor deactivated');
  }

  update() {
    // Handle frame transitions only if powered on
    if (this.isPoweredOn && this.guiTexture && this.currentFrame === 1) {
      this.frameTimer += this.scene.getEngine().getDeltaTime();
      
      if (this.frameTimer >= this.frameDuration) {
        this.currentFrame = 2;
        this.loadFrame(2);
        console.log('✓ Transitioned to frame 2');
      }
    }
  }

  /**
   * Dispose resources
   */
  dispose() {
    if (this.guiTexture) {
      this.guiTexture.dispose();
    }
    
    console.log('MonitorController disposed');
  }
}
