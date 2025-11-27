/**
 * MonitorController - Manages interactive CRT monitor with HTML frame rendering
 * Renders HTML content onto a 3D monitor screen texture
 */

import { BootSequenceRenderer } from './BootSequenceRenderer.js';

export class MonitorController {
  constructor(scene) {
    this.scene = scene;
    this.monitorMesh = null;
    this.screenMaterial = null;
    this.dynamicTexture = null;
    
    // Frame management
    this.config = null;
    this.currentFrame = null;
    this.frames = new Map();
    
    // HTML rendering
    this.hiddenIframe = null;
    this.renderCanvas = null;
    this.renderContext = null;
    
    // Keyboard input
    this.isActive = false;
    this.selectedElementIndex = 0;
    this.interactiveElements = [];
    this.inputBuffer = '';
    this.activeInputField = null;
    
    // Settings
    this.textureWidth = 2048;
    this.textureHeight = 1536;
    this.refreshRate = 30; // FPS for texture updates
    this.lastRenderTime = 0;
    
    console.log('MonitorController initialized');
  }

  /**
   * Initialize the monitor system
   */
  async initialize() {
    try {
      // Load configuration
      await this.loadConfig();
      
      // Setup HTML rendering infrastructure
      this.setupRenderingInfrastructure();
      
      // Find or create monitor mesh (non-blocking if not found yet)
      const meshFound = this.setupMonitorMesh();
      
      // Don't load HTML frame initially - show corner markers for alignment
      // Frame will load when user activates monitor with M key
      
      // Setup keyboard input
      this.setupKeyboardInput();
      
      console.log('MonitorController initialized - showing alignment pattern');
      return true;
    } catch (error) {
      console.error('Failed to initialize MonitorController:', error);
      return false;
    }
  }

  /**
   * Load frames configuration from JSON
   */
  async loadConfig() {
    try {
      const response = await fetch('/src/monitor/frames/frames-config.json');
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }
      this.config = await response.json();
      console.log('Frames config loaded:', this.config);
    } catch (error) {
      console.error('Error loading frames config:', error);
      throw error;
    }
  }

  /**
   * Setup HTML rendering infrastructure (hidden iframe and canvas)
   */
  setupRenderingInfrastructure() {
    // Create hidden iframe for loading HTML
    this.hiddenIframe = document.createElement('iframe');
    this.hiddenIframe.style.cssText = `
      position: fixed;
      top: -9999px;
      left: -9999px;
      width: ${this.textureWidth}px;
      height: ${this.textureHeight}px;
      border: none;
      visibility: hidden;
    `;
    document.body.appendChild(this.hiddenIframe);

    // Create offscreen canvas for rendering
    this.renderCanvas = document.createElement('canvas');
    this.renderCanvas.width = this.textureWidth;
    this.renderCanvas.height = this.textureHeight;
    this.renderContext = this.renderCanvas.getContext('2d');
    
    console.log('Rendering infrastructure setup complete');
  }

  /**
   * Find or create monitor mesh in scene
   */
  setupMonitorMesh() {
    // Try to find existing monitor mesh by name
    this.monitorMesh = this.scene.getMeshByName('SM_Prop_ComputerMonitor_A_29_screen_mesh');
    
    // If not found, try alternative name
    if (!this.monitorMesh) {
      this.monitorMesh = this.scene.getMeshByName('monitor_screen');
    }
    
    if (this.monitorMesh) {
      console.log('Monitor mesh found:', this.monitorMesh.name);
      this.applyMaterialToMesh();
      return true;
    }
    
    // If not found, set up observer to wait for it
    console.log('Monitor mesh not found yet, waiting for scene to load...');
    this.setupMeshObserver();
    return false;
  }
  
  /**
   * Setup observer to watch for monitor mesh being added to scene
   */
  setupMeshObserver() {
    // Check periodically for the mesh
    const checkInterval = setInterval(() => {
      this.monitorMesh = this.scene.getMeshByName('SM_Prop_ComputerMonitor_A_29_screen_mesh');
      
      if (!this.monitorMesh) {
        this.monitorMesh = this.scene.getMeshByName('monitor_screen');
      }
      
      if (this.monitorMesh) {
        console.log('Monitor mesh found:', this.monitorMesh.name);
        clearInterval(checkInterval);
        this.applyMaterialToMesh();
        
        // Don't load frame yet - show corner markers for alignment
      }
    }, 200); // Check every 200ms
    
    // Stop checking after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!this.monitorMesh) {
        console.warn('Monitor mesh not found, creating test plane');
        this.monitorMesh = BABYLON.MeshBuilder.CreatePlane(
          'monitor_screen',
          { width: 2, height: 1.5 },
          this.scene
        );
        this.monitorMesh.position = new BABYLON.Vector3(0, 1.5, -3);
        this.applyMaterialToMesh();
        // Don't load frame yet - show corner markers for alignment
      }
    }, 10000);
  }
  
  /**
   * Apply material and texture to the monitor mesh
   */
  applyMaterialToMesh() {
    if (!this.monitorMesh) return;

    // Create dynamic texture
    this.dynamicTexture = new BABYLON.DynamicTexture(
      'monitorTexture',
      { width: this.textureWidth, height: this.textureHeight },
      this.scene,
      false
    );
    
    // Lock texture coordinates to prevent camera-dependent distortion
    // Use EXPLICIT_MODE to force UV mapping (not spherical/cubic/etc)
    this.dynamicTexture.coordinatesMode = BABYLON.Texture.EXPLICIT_MODE;
    this.dynamicTexture.coordinatesIndex = 0; // Use first UV channel
    this.dynamicTexture.getAlphaFromRGB = false;
    
    // Disable any automatic texture coordinate generation
    this.dynamicTexture.level = 1.0; // No level adjustment
    this.dynamicTexture.hasAlpha = false; // No alpha channel
    
    // Store original material for potential restoration
    this.originalMaterial = this.monitorMesh.material;
    console.log('Original material:', this.originalMaterial);
    console.log('Original material name:', this.originalMaterial?.name);
    console.log('Original material type:', this.originalMaterial?.getClassName());
    
    // Check if we found the monitorscreen material
    if (this.originalMaterial && this.originalMaterial.name === 'monitorscreen') {
      console.log('Found monitorscreen material, modifying it...');
      
      // Modify the existing material
      // Check if it's a PBR material or Standard material
      if (this.originalMaterial.albedoTexture !== undefined) {
        // PBR Material
        this.originalMaterial.albedoTexture = this.dynamicTexture;
        this.originalMaterial.emissiveTexture = this.dynamicTexture;
        this.originalMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.originalMaterial.emissiveIntensity = 1;
        this.originalMaterial.unlit = true; // Make it self-illuminated
        
        // Disable texture transforms that could cause distortion
        this.originalMaterial.useParallax = false;
        this.originalMaterial.useParallaxOcclusion = false;
        
        // Fix UV mapping - calibrated settings
        this.dynamicTexture.wAng = (270 * Math.PI) / 180;
        this.dynamicTexture.uScale = 1.37;
        this.dynamicTexture.vScale = -0.98;
        this.dynamicTexture.uOffset = -0.18;
        this.dynamicTexture.vOffset = 0.79;
        
        // Lock texture wrapping to prevent stretching
        this.dynamicTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        this.dynamicTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        
        console.log('Modified PBR material with dynamic texture (calibrated UV mapping)');
      } else {
        // Standard Material
        this.originalMaterial.diffuseTexture = this.dynamicTexture;
        this.originalMaterial.emissiveTexture = this.dynamicTexture;
        this.originalMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.originalMaterial.disableLighting = true;
        
        // Disable parallax if available
        if (this.originalMaterial.useParallax !== undefined) {
          this.originalMaterial.useParallax = false;
        }
        
        // Fix UV mapping - calibrated settings
        this.dynamicTexture.wAng = (270 * Math.PI) / 180;
        this.dynamicTexture.uScale = 1.37;
        this.dynamicTexture.vScale = -0.98;
        this.dynamicTexture.uOffset = -0.18;
        this.dynamicTexture.vOffset = 0.79;
        
        // Lock texture wrapping to prevent stretching
        this.dynamicTexture.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
        this.dynamicTexture.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
        
        console.log('Modified Standard material with dynamic texture (calibrated UV mapping)');
      }
      
      this.screenMaterial = this.originalMaterial;
    } else {
      // Create our own material if original not found
      console.log('Creating new material...');
      this.screenMaterial = new BABYLON.StandardMaterial('monitorMaterial', this.scene);
      this.screenMaterial.diffuseTexture = this.dynamicTexture;
      this.screenMaterial.emissiveTexture = this.dynamicTexture;
      this.screenMaterial.disableLighting = true;
      this.screenMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
      this.screenMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
      this.screenMaterial.backFaceCulling = false;
      
      // Apply our material
      this.monitorMesh.material = this.screenMaterial;
    }
    
    console.log('Material applied to monitor mesh');
    console.log('Mesh name:', this.monitorMesh.name);
    console.log('Final material:', this.monitorMesh.material?.name);
    console.log('Texture size:', this.dynamicTexture.getSize());
    
    // CRITICAL: Freeze the mesh to prevent texture coordinate recalculation
    // This prevents the texture from appearing to shift when camera moves
    this.monitorMesh.freezeWorldMatrix();
    this.monitorMesh.doNotSyncBoundingInfo = true;
    
    // Ensure the mesh uses its own UV coordinates, not computed ones
    if (this.monitorMesh.geometry) {
      this.monitorMesh.geometry.doNotSerialize = false;
    }
    
    console.log('✓ Monitor mesh frozen to prevent texture distortion');
    
    // Draw initial corner markers test pattern AFTER UV settings are applied
    this.drawCornerMarkersPattern();
  }
  
  /**
   * Draw corner markers test pattern for alignment verification
   */
  drawCornerMarkersPattern() {
    const ctx = this.dynamicTexture.getContext();
    
    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.textureWidth, this.textureHeight);
    
    // Green border
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, this.textureWidth - 10, this.textureHeight - 10);
    
    const size = 100;
    const offset = 20;
    
    // Top-left (RED)
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(offset, offset, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('TOP-LEFT', offset + 5, offset + 130);
    
    // Top-right (BLUE)
    ctx.fillStyle = '#0000ff';
    ctx.fillRect(this.textureWidth - offset - size, offset, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText('TOP-RIGHT', this.textureWidth - offset - 5, offset + 130);
    
    // Bottom-left (YELLOW)
    ctx.fillStyle = '#ffff00';
    ctx.fillRect(offset, this.textureHeight - offset - size, size, size);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.fillText('BOTTOM-LEFT', offset + 5, this.textureHeight - offset - 110);
    
    // Bottom-right (MAGENTA)
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(this.textureWidth - offset - size, this.textureHeight - offset - size, size, size);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText('BOTTOM-RIGHT', this.textureWidth - offset - 5, this.textureHeight - offset - 110);
    
    // Center marker (GREEN)
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(this.textureWidth / 2 - 50, this.textureHeight / 2 - 50, 100, 100);
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('CENTER', this.textureWidth / 2, this.textureHeight / 2 + 5);
    
    this.dynamicTexture.update();
    console.log('Corner markers test pattern drawn');
  }

  /**
   * Load and display an HTML frame
   */
  async loadFrame(frameId) {
    if (!this.config.frames[frameId]) {
      console.error(`Frame ${frameId} not found in config`);
      return false;
    }

    const frameConfig = this.config.frames[frameId];
    const framePath = `/src/monitor/frames/${frameConfig.file}`;

    try {
      // Load HTML into hidden iframe
      const response = await fetch(framePath);
      if (!response.ok) {
        throw new Error(`Failed to load frame: ${response.statusText}`);
      }
      
      const htmlContent = await response.text();
      
      // Write HTML to iframe
      const iframeDoc = this.hiddenIframe.contentDocument || this.hiddenIframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();

      // Wait for iframe to load
      await new Promise(resolve => {
        if (this.hiddenIframe.contentWindow.document.readyState === 'complete') {
          resolve();
        } else {
          this.hiddenIframe.onload = resolve;
        }
      });

      // Store current frame info
      this.currentFrame = frameConfig;
      
      // Find interactive elements
      this.findInteractiveElements();
      
      // Render frame to texture
      await this.renderFrameToTexture();
      
      console.log(`Frame loaded: ${frameId}`);
      return true;
    } catch (error) {
      console.error(`Error loading frame ${frameId}:`, error);
      return false;
    }
  }

  /**
   * Find interactive elements in current frame
   */
  findInteractiveElements() {
    const iframeDoc = this.hiddenIframe.contentDocument || this.hiddenIframe.contentWindow.document;
    
    // Find all elements with data-transition attribute
    const transitionElements = Array.from(iframeDoc.querySelectorAll('[data-transition]'));
    
    // Find all input fields
    const inputElements = Array.from(iframeDoc.querySelectorAll('input, textarea'));
    
    // Combine and store
    this.interactiveElements = [...transitionElements, ...inputElements];
    this.selectedElementIndex = 0;
    
    // Highlight first element
    if (this.interactiveElements.length > 0) {
      this.highlightElement(0);
    }
    
    console.log(`Found ${this.interactiveElements.length} interactive elements`);
  }

  /**
   * Highlight selected element
   */
  highlightElement(index) {
    const iframeDoc = this.hiddenIframe.contentDocument || this.hiddenIframe.contentWindow.document;
    
    // Remove previous highlights
    iframeDoc.querySelectorAll('.selected').forEach(el => {
      el.classList.remove('selected');
    });
    
    // Add highlight to current element
    if (this.interactiveElements[index]) {
      this.interactiveElements[index].classList.add('selected');
      this.selectedElementIndex = index;
    }
  }

  /**
   * Render iframe content to canvas and update texture
   */
  async renderFrameToTexture() {
    try {
      // Check if this is the boot sequence frame - use direct rendering
      if (this.currentFrame && this.currentFrame.id === 'boot-sequence') {
        await this.renderBootSequenceDirect();
        return;
      }

      const iframeDoc = this.hiddenIframe.contentDocument || this.hiddenIframe.contentWindow.document;
      const iframeBody = iframeDoc.body;

      if (!iframeBody) {
        console.error('Iframe body not found');
        return;
      }

      // Use html2canvas to render HTML to canvas
      if (typeof html2canvas !== 'undefined') {
        // Wait for fonts to load
        await iframeDoc.fonts.ready;
        
        console.log('Rendering HTML to canvas...');
        const canvas = await html2canvas(iframeBody, {
          canvas: this.renderCanvas,
          backgroundColor: '#0a0a0a',
          scale: 1,
          logging: false,
          width: this.textureWidth,
          height: this.textureHeight,
          letterRendering: true,
          allowTaint: true,
          useCORS: true,
          imageTimeout: 0
        });

        // Update Babylon.js dynamic texture
        const ctx = this.dynamicTexture.getContext();
        ctx.clearRect(0, 0, this.textureWidth, this.textureHeight);
        ctx.drawImage(canvas, 0, 0);
        this.dynamicTexture.update();
        
        console.log('Texture updated successfully');
      } else {
        // Fallback: simple text rendering if html2canvas not available
        console.warn('html2canvas not available, using fallback rendering');
        this.renderFallback();
      }
    } catch (error) {
      console.error('Error rendering frame to texture:', error);
      this.renderFallback();
    }
  }

  /**
   * Render boot sequence directly to texture (bypasses html2canvas)
   */
  async renderBootSequenceDirect() {
    try {
      console.log('Rendering boot sequence directly...');
      
      const renderer = new BootSequenceRenderer(this.textureWidth, this.textureHeight);
      const canvas = await renderer.render();
      
      // Update Babylon.js dynamic texture
      const ctx = this.dynamicTexture.getContext();
      ctx.clearRect(0, 0, this.textureWidth, this.textureHeight);
      ctx.drawImage(canvas, 0, 0);
      this.dynamicTexture.update();
      
      console.log('Boot sequence rendered directly');
    } catch (error) {
      console.error('Error rendering boot sequence directly:', error);
      this.renderFallback();
    }
  }

  /**
   * Fallback rendering method (simple text)
   */
  renderFallback() {
    console.log('Using fallback rendering');
    const ctx = this.dynamicTexture.getContext();
    
    // Clear with black background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, this.textureWidth, this.textureHeight);
    
    // Draw green border for visibility
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, this.textureWidth - 20, this.textureHeight - 20);
    
    // Draw text
    ctx.fillStyle = '#00ff00';
    ctx.font = '48px "Courier New"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.currentFrame?.name || 'MONITOR ACTIVE', this.textureWidth / 2, this.textureHeight / 2);
    
    // Draw status text
    ctx.font = '24px "Courier New"';
    ctx.fillText('Press M to toggle', this.textureWidth / 2, this.textureHeight / 2 + 60);
    
    this.dynamicTexture.update();
    console.log('Fallback rendering complete');
  }

  /**
   * Setup keyboard input handling
   */
  setupKeyboardInput() {
    window.addEventListener('keydown', (event) => {
      if (!this.isActive) return;
      
      this.handleKeyPress(event);
    });
    
    console.log('Keyboard input setup complete');
  }

  /**
   * Handle keyboard input
   */
  async handleKeyPress(event) {
    const key = event.key;
    
    // Check if we're in an input field
    const currentElement = this.interactiveElements[this.selectedElementIndex];
    const isInputField = currentElement && (currentElement.tagName === 'INPUT' || currentElement.tagName === 'TEXTAREA');
    
    if (isInputField && this.activeInputField) {
      // Handle text input
      if (key.length === 1) {
        // Regular character
        currentElement.value += key;
        await this.renderFrameToTexture();
      } else if (key === 'Backspace') {
        currentElement.value = currentElement.value.slice(0, -1);
        await this.renderFrameToTexture();
        event.preventDefault();
      } else if (key === 'Escape') {
        // Exit input mode
        this.activeInputField = null;
      }
    } else {
      // Navigation mode
      if (key === 'ArrowDown' || key === 's' || key === 'S') {
        // Move selection down
        this.selectedElementIndex = (this.selectedElementIndex + 1) % this.interactiveElements.length;
        this.highlightElement(this.selectedElementIndex);
        await this.renderFrameToTexture();
        event.preventDefault();
      } else if (key === 'ArrowUp' || key === 'w' || key === 'W') {
        // Move selection up
        this.selectedElementIndex = (this.selectedElementIndex - 1 + this.interactiveElements.length) % this.interactiveElements.length;
        this.highlightElement(this.selectedElementIndex);
        await this.renderFrameToTexture();
        event.preventDefault();
      } else if (key === 'Enter') {
        // Activate selected element
        await this.activateElement(currentElement);
        event.preventDefault();
      }
    }
  }

  /**
   * Activate selected element (transition or input)
   */
  async activateElement(element) {
    if (!element) return;
    
    // Check if it's a transition element
    const transitionTo = element.getAttribute('data-transition');
    if (transitionTo) {
      await this.transitionToFrame(transitionTo);
      return;
    }
    
    // Check if it's an input field
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      this.activeInputField = element;
      element.focus();
      console.log('Entered input mode');
    }
  }

  /**
   * Transition to another frame
   */
  async transitionToFrame(frameId) {
    // Validate transition
    if (!this.currentFrame.transitions.includes(frameId)) {
      console.warn(`Invalid transition from ${this.currentFrame.id} to ${frameId}`);
      return false;
    }
    
    // Load new frame
    await this.loadFrame(frameId);
    
    // Update config
    this.config.activeFrame = frameId;
    
    return true;
  }

  /**
   * Activate monitor (enable keyboard input)
   */
  activate() {
    this.isActive = true;
    
    // Load the first frame when activating
    if (this.currentFrame === null && this.config) {
      this.loadFrame(this.config.activeFrame);
    }
    
    console.log('Monitor activated');
  }

  /**
   * Deactivate monitor (disable keyboard input)
   */
  deactivate() {
    this.isActive = false;
    this.activeInputField = null;
    console.log('Monitor deactivated');
  }

  /**
   * Update loop (call from render loop)
   */
  update() {
    // Throttle rendering to refresh rate
    const now = Date.now();
    if (now - this.lastRenderTime > 1000 / this.refreshRate) {
      // Could add animation updates here
      this.lastRenderTime = now;
    }
  }

  /**
   * Debug: Force render a test pattern
   */
  debugTestPattern() {
    const ctx = this.dynamicTexture.getContext();
    
    // Alternate colors for visibility test
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, this.textureWidth, this.textureHeight);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 128px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DEBUG', this.textureWidth / 2, this.textureHeight / 2);
    this.dynamicTexture.update();
    
    console.log('Debug test pattern rendered with color:', color);
  }
  
  /**
   * Debug: Adjust texture rotation
   * @param {number} degrees - Rotation in degrees (0, 90, 180, 270)
   */
  debugRotateTexture(degrees) {
    const radians = (degrees * Math.PI) / 180;
    this.dynamicTexture.wAng = radians;
    this.dynamicTexture.update();
    console.log(`Texture rotated to ${degrees}°`);
  }
  
  /**
   * Debug: Adjust texture scale
   * @param {number} uScale - Horizontal scale
   * @param {number} vScale - Vertical scale
   */
  debugScaleTexture(uScale, vScale) {
    this.dynamicTexture.uScale = uScale;
    this.dynamicTexture.vScale = vScale;
    this.dynamicTexture.update();
    console.log(`Texture scaled to U:${uScale}, V:${vScale}`);
  }

  /**
   * Dispose resources
   */
  dispose() {
    if (this.hiddenIframe) {
      document.body.removeChild(this.hiddenIframe);
    }
    
    if (this.dynamicTexture) {
      this.dynamicTexture.dispose();
    }
    
    if (this.screenMaterial) {
      this.screenMaterial.dispose();
    }
    
    console.log('MonitorController disposed');
  }
}
