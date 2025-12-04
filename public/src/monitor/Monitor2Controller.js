/**
 * Monitor2Controller - Manages second monitor screen
 * Displays monitor-2-sequence.html
 */

export class Monitor2Controller {
  constructor(scene) {
    this.scene = scene;
    this.monitorMesh = null;
    this.dynamicTexture = null;
    this.originalMaterial = null;
    this.isActive = false;
    this.isPoweredOn = false;
    this.isLockedOn = false;
    
    // iframe for HTML rendering
    this.iframe = null;
    this.captureCanvas = null;
    
    // Settings
    this.textureWidth = 2048;
    this.textureHeight = 2048;
    
    console.log('Monitor2Controller initialized');
  }

  /**
   * Initialize the monitor system
   */
  async initialize() {
    try {
      // Create hidden iframe for HTML rendering
      this.createHiddenIframe();
      
      // Create capture canvas
      this.captureCanvas = document.createElement('canvas');
      this.captureCanvas.width = this.textureWidth;
      this.captureCanvas.height = this.textureHeight;
      
      // Find or create monitor mesh
      this.setupMonitorMesh();
      
      console.log('Monitor2Controller initialized - iframe rendering ready');
      return true;
    } catch (error) {
      console.error('Failed to initialize Monitor2Controller:', error);
      return false;
    }
  }
  
  /**
   * Create hidden iframe for rendering HTML frames
   */
  createHiddenIframe() {
    this.iframe = document.createElement('iframe');
    this.iframe.style.position = 'absolute';
    this.iframe.style.left = '-9999px';
    this.iframe.style.width = this.textureWidth + 'px';
    this.iframe.style.height = this.textureHeight + 'px';
    this.iframe.style.border = 'none';
    this.iframe.style.background = '#0a0a0a';
    document.body.appendChild(this.iframe);
    
    // Setup MutationObserver to capture on any DOM change
    this.iframe.addEventListener('load', () => {
      this.setupDOMObserver();
    });
    
    console.log('✓ Monitor2 hidden iframe created');
  }
  
  /**
   * Setup MutationObserver to watch for any DOM changes in iframe
   */
  setupDOMObserver() {
    if (!this.iframe || !this.iframe.contentDocument) {
      console.warn('⚠️ Cannot setup DOM observer - Monitor2 iframe not ready');
      return;
    }
    
    // Disconnect existing observer if any
    if (this.domObserver) {
      this.domObserver.disconnect();
    }
    
    // Create new observer
    this.domObserver = new MutationObserver((mutations) => {
      // Filter out cursor-related mutations
      const relevantMutations = mutations.filter(mutation => {
        const target = mutation.target;
        
        // Ignore if target is cursor element
        if (target.classList && (target.classList.contains('cursorMain') || target.classList.contains('hidden'))) {
          return false;
        }
        
        // Ignore if target's parent is cursor element
        if (target.parentElement && target.parentElement.classList && 
            (target.parentElement.classList.contains('cursorMain') || target.parentElement.classList.contains('hidden'))) {
          return false;
        }
        
        return true;
      });
      
      // Only capture if there are relevant changes
      if (relevantMutations.length > 0 && this.isLockedOn && this.isPoweredOn) {
        this.captureIframeToTexture();
        console.log('📸 Monitor2 captured due to DOM change');
      }
    });
    
    // Observe everything in the iframe
    this.domObserver.observe(this.iframe.contentDocument.body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
      attributeOldValue: false,
      characterDataOldValue: false
    });
    
    console.log('✓ Monitor2 DOM observer setup - will capture on any change');
  }

  /**
   * Find or create monitor mesh in scene
   */
  setupMonitorMesh() {
    // Try to find monitor 2 mesh by name
    this.monitorMesh = this.scene.getMeshByName('SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.screen.001');
    
    if (this.monitorMesh) {
      console.log('✓ Monitor2 mesh found:', this.monitorMesh.name);
      this.applyMaterialToMesh();
      return true;
    }
    
    // Set up observer to wait for it
    console.log('Monitor2 mesh not found yet, waiting for scene to load...');
    this.setupMeshObserver();
    return false;
  }
  
  /**
   * Setup observer to watch for monitor mesh being added to scene
   */
  setupMeshObserver() {
    const checkInterval = setInterval(() => {
      this.monitorMesh = this.scene.getMeshByName('SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.screen.001');
      
      if (this.monitorMesh) {
        console.log('✓ Monitor2 mesh found:', this.monitorMesh.name);
        clearInterval(checkInterval);
        this.applyMaterialToMesh();
      }
    }, 200);
    
    // Stop checking after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!this.monitorMesh) {
        console.warn('⚠ Monitor2 mesh not found after 10s');
      }
    }, 10000);
  }
  
  /**
   * Capture iframe content to Babylon texture
   */
  async captureIframeToTexture() {
    try {
      const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow.document;
      
      if (!iframeDoc) {
        throw new Error('Cannot access iframe document');
      }

      await new Promise(resolve => setTimeout(resolve, 16));

      const serializer = new XMLSerializer();
      const htmlString = serializer.serializeToString(iframeDoc.documentElement);

      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${this.textureWidth}" height="${this.textureHeight}">
          <foreignObject width="100%" height="100%">
            ${htmlString}
          </foreignObject>
        </svg>
      `;

      const svgBase64 = btoa(unescape(encodeURIComponent(svgString)));
      const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
      const img = new Image();

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Image load timeout')), 5000);

        img.onload = () => {
          clearTimeout(timeout);
          try {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.textureWidth;
            tempCanvas.height = this.textureHeight;
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            tempCtx.drawImage(img, 0, 0, this.textureWidth, this.textureHeight);
            
            const textureCtx = this.dynamicTexture.getContext();
            textureCtx.clearRect(0, 0, this.textureWidth, this.textureHeight);
            textureCtx.drawImage(tempCanvas, 0, 0, this.textureWidth, this.textureHeight);
            this.dynamicTexture.update();

            resolve();
          } catch (err) {
            reject(err);
          }
        };

        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load SVG image'));
        };

        img.src = dataUrl;
      });

    } catch (error) {
      console.error('Monitor2 capture error:', error);
      throw error;
    }
  }
  
  /**
   * Apply DynamicTexture to the monitor mesh
   */
  async applyMaterialToMesh() {
    if (!this.monitorMesh) return;

    console.log('✓ Monitor2 mesh found:', this.monitorMesh.name);
    
    // Store original material
    this.originalMaterial = this.monitorMesh.material;
    
    // Create DynamicTexture for mesh
    this.dynamicTexture = new BABYLON.DynamicTexture(
      'monitor2Texture',
      {
        width: this.textureWidth,
        height: this.textureHeight
      },
      this.scene,
      false
    );
    
    // UV Mapping Settings (same as monitor 1)
    this.dynamicTexture.wAng = (270 * Math.PI) / 180;
    this.dynamicTexture.uScale = 1;
    this.dynamicTexture.vScale = -1;
    this.dynamicTexture.uOffset = 0;
    this.dynamicTexture.vOffset = 1;
    
    // Start with black screen
    this.showBlackScreen();
    
    // Apply to the original material
    if (this.originalMaterial) {
      if (this.originalMaterial.albedoTexture !== undefined) {
        this.originalMaterial.albedoTexture = this.dynamicTexture;
        this.originalMaterial.emissiveTexture = this.dynamicTexture;
        this.originalMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.originalMaterial.emissiveIntensity = 1;
        this.originalMaterial.unlit = true;
      } else {
        this.originalMaterial.diffuseTexture = this.dynamicTexture;
        this.originalMaterial.emissiveTexture = this.dynamicTexture;
        this.originalMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
        this.originalMaterial.disableLighting = true;
      }
    }
    
    console.log('✓ Monitor2 DynamicTexture created and applied');
  }
  
  /**
   * Show black screen
   */
  showBlackScreen() {
    if (!this.dynamicTexture) return;
    
    const ctx = this.dynamicTexture.getContext();
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, this.textureWidth, this.textureHeight);
    this.dynamicTexture.update();
  }

  /**
   * Power on and load monitor-2-sequence.html
   */
  async powerOn() {
    if (this.isPoweredOn) return;
    
    this.isPoweredOn = true;
    
    try {
      // Load monitor-2-sequence.html
      this.iframe.src = 'src/monitor/frames/monitor-2-sequence.html';
      
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Iframe load timeout')), 5000);
        
        this.iframe.onload = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        this.iframe.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Iframe load error'));
        };
      });
      
      const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow.document;
      if (iframeDoc.fonts) {
        await iframeDoc.fonts.ready;
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      await this.captureIframeToTexture();
      
      // Setup DOM observer for automatic capture
      this.setupDOMObserver();
      
      console.log('✓ Monitor2 powered on - monitor-2-sequence.html loaded');
    } catch (error) {
      console.error('Failed to load monitor-2-sequence.html:', error);
    }
  }

  /**
   * Activate monitor
   */
  activate() {
    console.log('🟢 Activating Monitor2...');
    console.log('   isPoweredOn:', this.isPoweredOn);
    console.log('   iframe:', !!this.iframe);
    console.log('   dynamicTexture:', !!this.dynamicTexture);
    
    if (!this.isPoweredOn) {
      this.powerOn();
    }
    this.isActive = true;
    this.isLockedOn = true;
    
    // Setup DOM observer if not already setup
    if (!this.domObserver) {
      this.setupDOMObserver();
    }
    
    // Do an initial capture
    console.log('📸 Immediate capture on Monitor2 activation');
    this.captureIframeToTexture();
    
    // Capture again after 500ms to ensure everything is loaded
    setTimeout(() => {
      console.log('⏱️ Delayed capture timer fired for Monitor2, isLockedOn:', this.isLockedOn);
      if (this.isLockedOn) {
        console.log('📸 Delayed capture - calling captureIframeToTexture()');
        this.captureIframeToTexture();
        console.log('✅ Delayed capture completed for Monitor2');
      } else {
        console.log('⚠️ Skipped delayed capture - Monitor2 not locked on');
      }
    }, 500);
    
    console.log('✓ Monitor2 activated with DOM change detection');
  }

  deactivate() {
    console.log('🛑 Deactivating Monitor2...');
    this.isActive = false;
    this.isLockedOn = false;
    console.log('✓ Monitor2 deactivated (DOM observer still active)');
  }
  
  /**
   * Start automatic capture interval for chat animation
   */
  startAutoCaptureInterval() {
    this.stopAutoCaptureInterval();
    
    this.captureInterval = setInterval(() => {
      if (this.isLockedOn && this.isPoweredOn && this.iframe) {
        this.captureIframeToTexture();
      }
    }, 100); // Capture every 100ms
    
    console.log('✓ Monitor2 auto-capture started');
  }
  
  /**
   * Stop automatic capture interval
   */
  stopAutoCaptureInterval() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
  }

  update() {
    // No updates needed
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.stopAutoCaptureInterval();
    
    if (this.dynamicTexture) {
      this.dynamicTexture.dispose();
    }
    
    if (this.iframe) {
      document.body.removeChild(this.iframe);
      this.iframe = null;
    }
    
    console.log('Monitor2Controller disposed');
  }
}
