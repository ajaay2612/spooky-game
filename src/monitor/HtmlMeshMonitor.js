/**
 * HtmlMeshMonitor - Uses Babylon.js HtmlMesh to render HTML frames on monitor
 * This approach renders actual HTML/DOM elements in 3D space
 */

import { HtmlMesh, HtmlMeshRenderer } from '@babylonjs/addons/htmlMesh';

export class HtmlMeshMonitor {
  constructor(scene) {
    this.scene = scene;
    this.monitorMesh = null;
    this.htmlMesh = null;
    this.htmlMeshRenderer = null;
    this.config = null;
    this.currentFrame = null;
    
    console.log('HtmlMeshMonitor initialized');
  }

  /**
   * Initialize the HTML mesh monitor
   */
  async initialize() {
    try {
      // Scene clear color should already be Color4 for HtmlMesh compatibility
      console.log('HtmlMeshMonitor initializing (scene uses Color4 clear color)');
      
      // Create HtmlMeshRenderer first
      this.htmlMeshRenderer = new HtmlMeshRenderer(this.scene);
      console.log('HtmlMeshRenderer created');
      
      // Load configuration
      await this.loadConfig();
      
      // Find the monitor mesh (wait for it to load)
      await this.setupMonitorMesh();
      
      // Wait a bit more to ensure everything is loaded
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load initial frame
      if (this.config.activeFrame) {
        await this.loadFrame(this.config.activeFrame);
      }
      
      console.log('HtmlMeshMonitor initialization complete');
      return true;
    } catch (error) {
      console.error('HtmlMeshMonitor initialization failed:', error);
      return false;
    }
  }

  /**
   * Load frames configuration
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
   * Setup monitor mesh (with retry logic)
   */
  async setupMonitorMesh() {
    // Try to find the monitor screen mesh, retry if not found
    const maxRetries = 20;
    const retryDelay = 500;
    
    for (let i = 0; i < maxRetries; i++) {
      this.monitorMesh = this.scene.getMeshByName('SM_Prop_ComputerMonitor_A_29_screen_mesh');
      
      if (this.monitorMesh) {
        console.log('Monitor mesh found:', this.monitorMesh.name);
        
        // Hide the monitor screen mesh so we can see the HtmlMesh
        this.monitorMesh.isVisible = false;
        console.log('✓ Monitor screen mesh hidden');
        
        return this.monitorMesh;
      }
      
      console.log(`Monitor mesh not found, retrying... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    
    console.error('Monitor mesh not found after retries');
    return null;
  }

  /**
   * Load a frame using HtmlMesh
   */
  async loadFrame(frameId) {
    try {
      if (!this.config.frames[frameId]) {
        console.error(`Frame ${frameId} not found in config`);
        return false;
      }

      const frameConfig = this.config.frames[frameId];
      const framePath = `/src/monitor/frames/${frameConfig.file}`;

      console.log(`Loading frame: ${frameId} from ${framePath}`);

      // Dispose existing HtmlMesh if any
      if (this.htmlMesh) {
        this.htmlMesh.dispose();
        this.htmlMesh = null;
      }

      // Create HtmlMesh using imported class

      // Create container with CRT bulge effect using CSS
      const container = document.createElement('div');
      container.style.width = '2048px';
      container.style.height = '1536px';
      container.style.position = 'relative';
      container.style.transformStyle = 'preserve-3d';
      container.style.perspective = '2000px';
      container.style.background = '#0a0a0a'; // Black background
      container.style.margin = '0';
      container.style.padding = '0';
      container.style.overflow = 'hidden';
      
      // Create iframe
      const htmlElement = document.createElement('iframe');
      htmlElement.src = framePath;
      htmlElement.style.width = '100%';
      htmlElement.style.height = '100%';
      htmlElement.style.border = 'none';
      htmlElement.style.background = '#0a0a0a';
      
      // Apply CSS filter for CRT curved glass effect
      // Using multiple techniques for best result
      htmlElement.style.filter = 'contrast(1.1) brightness(1.05)';
      htmlElement.style.borderRadius = '2%';
      
      // Subtle inset shadow for depth/curvature illusion
      htmlElement.style.boxShadow = 'inset 0 0 100px rgba(0,0,0,0.3), inset 0 0 50px rgba(0,255,0,0.05)';
      
      container.appendChild(htmlElement);

      // Wait for iframe to load (with timeout)
      await new Promise((resolve) => {
        htmlElement.onload = () => {
          console.log('✓ Iframe loaded');
          resolve();
        };
        htmlElement.onerror = () => {
          console.error('✗ Iframe failed to load');
          resolve(); // Continue anyway
        };
        setTimeout(() => {
          console.log('⚠ Iframe load timeout, continuing');
          resolve();
        }, 2000);
      });

      // Create HtmlMesh with proper positioning
      this.htmlMesh = new HtmlMesh(this.scene, 'monitorFrame');
      
      // setContent takes (element, widthInBabylonUnits, heightInBabylonUnits)
      // Use container instead of iframe directly
      this.htmlMesh.setContent(container, 0.36, 0.27);
      
      // Position HtmlMesh at monitor screen (scaled up to cover bezel completely)
      this.htmlMesh.position = new BABYLON.Vector3(0.8987579441070557, 2.250906467437744, 0.4201294779777527);
      this.htmlMesh.rotation = new BABYLON.Vector3(0, BABYLON.Tools.ToRadians(88), 0);
      this.htmlMesh.scaling = new BABYLON.Vector3(1.25, 1.25, 0.95); // Increased to cover bezel edges
      
      // Move slightly forward along local X-axis (since rotated 88 degrees) to prevent z-fighting
      const forwardOffset = 0.002; // 2mm forward
      this.htmlMesh.position.x += forwardOffset * Math.cos(BABYLON.Tools.ToRadians(88));
      this.htmlMesh.position.z += forwardOffset * Math.sin(BABYLON.Tools.ToRadians(88));
      
      console.log('✓ HtmlMesh positioned at monitor screen');
      
      // Force scene hierarchy refresh after a delay
      setTimeout(() => {
        if (window.editorManager && window.editorManager.sceneHierarchy) {
          window.editorManager.sceneHierarchy.refresh();
          console.log('✓ Scene hierarchy refreshed - HtmlMesh_Helper should now be visible');
        }
      }, 500);
      
      // Store current frame info
      this.currentFrame = frameConfig;
      
      console.log(`Frame loaded: ${frameId}`);
      return true;
    } catch (error) {
      console.error(`Error loading frame ${frameId}:`, error);
      return false;
    }
  }

  /**
   * Apply HtmlMesh texture to the monitor screen mesh
   */
  applyTextureToMonitorScreen() {
    if (!this.monitorMesh) {
      console.error('✗ Monitor screen mesh not found');
      return;
    }

    if (!this.htmlMesh || !this.htmlMesh._mesh) {
      console.error('✗ HtmlMesh not ready');
      return;
    }

    try {
      // Get the material from HtmlMesh internal mesh
      const htmlMeshMaterial = this.htmlMesh._mesh.material;
      
      if (!htmlMeshMaterial || !htmlMeshMaterial.diffuseTexture) {
        console.error('✗ HtmlMesh material or texture not found');
        return;
      }

      const htmlTexture = htmlMeshMaterial.diffuseTexture;
      
      // Create or get material for monitor screen
      let screenMaterial = this.monitorMesh.material;
      
      if (!screenMaterial) {
        screenMaterial = new BABYLON.StandardMaterial('monitorScreenMat', this.scene);
        this.monitorMesh.material = screenMaterial;
      }
      
      // Apply the HTML texture to monitor screen
      screenMaterial.diffuseTexture = htmlTexture;
      screenMaterial.emissiveTexture = htmlTexture;
      screenMaterial.emissiveColor = new BABYLON.Color3(0.9, 0.9, 0.9); // Bright glow
      screenMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Low reflection
      screenMaterial.backFaceCulling = false; // Render both sides
      
      // Make monitor screen visible
      this.monitorMesh.isVisible = true;
      
      // Hide the HtmlMesh plane (we only need its texture)
      this.htmlMesh._mesh.isVisible = false;
      
      console.log('✓ HTML texture applied to monitor screen mesh');
      console.log('  Texture:', htmlTexture);
      console.log('  Monitor mesh:', this.monitorMesh.name);
    } catch (error) {
      console.error('✗ Failed to apply texture to monitor screen:', error);
    }
  }

  /**
   * Transition to another frame
   */
  async transitionTo(frameId) {
    if (!this.config.frames[frameId]) {
      console.error(`Cannot transition to unknown frame: ${frameId}`);
      return false;
    }

    // Check if transition is valid
    if (this.currentFrame && !this.currentFrame.transitions.includes(frameId)) {
      console.warn(`Transition from ${this.currentFrame.id} to ${frameId} not defined`);
    }

    return await this.loadFrame(frameId);
  }

  /**
   * Activate monitor (for compatibility)
   */
  activate() {
    console.log('Monitor activated');
    // HtmlMesh is always active, no special activation needed
  }

  /**
   * Deactivate monitor (for compatibility)
   */
  deactivate() {
    console.log('Monitor deactivated');
    // HtmlMesh is always active, no special deactivation needed
  }

  /**
   * Apply CRT bulge effect to mesh vertices
   */
  applyCRTBulge() {
    try {
      // Get the internal mesh from HtmlMesh
      const internalMesh = this.htmlMesh._mesh;
      if (!internalMesh) {
        console.warn('Cannot apply CRT bulge - internal mesh not found');
        return;
      }

      // Make mesh updatable
      internalMesh.makeGeometryUnique();
      const positions = internalMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      
      if (!positions) {
        console.warn('Cannot apply CRT bulge - no position data');
        return;
      }

      // Calculate mesh dimensions from positions
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      
      for (let i = 0; i < positions.length; i += 3) {
        minX = Math.min(minX, positions[i]);
        maxX = Math.max(maxX, positions[i]);
        minY = Math.min(minY, positions[i + 1]);
        maxY = Math.max(maxY, positions[i + 1]);
      }
      
      const width = maxX - minX;
      const height = maxY - minY;
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      
      // Apply bulge displacement
      const bulgeStrength = 0.02; // Subtle bulge for CRT effect
      
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const y = positions[i + 1];
        
        // Calculate normalized distance from center
        const distX = (x - centerX) / (width / 2);
        const distY = (y - centerY) / (height / 2);
        
        // Use a spherical/parabolic curve for the bulge
        // Stronger at center, fades to edges
        const distFromCenter = Math.sqrt(distX * distX + distY * distY);
        const bulgeFactor = Math.max(0, 1 - distFromCenter);
        
        // Apply quadratic falloff for smooth curve
        const displacement = bulgeFactor * bulgeFactor * bulgeStrength;
        
        // Push vertices forward along local Z-axis
        positions[i + 2] += displacement;
      }
      
      // Update the mesh
      internalMesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
      internalMesh.refreshBoundingInfo();
      
      console.log('✓ CRT bulge effect applied');
      console.log('  Mesh dimensions:', width, 'x', height);
      console.log('  Bulge strength:', bulgeStrength);
    } catch (error) {
      console.error('Failed to apply CRT bulge:', error);
    }
  }

  /**
   * Update method (called every frame)
   */
  update() {
    // HtmlMesh updates automatically, no manual update needed
    // This method exists for compatibility with the render loop
  }

  /**
   * Dispose the HTML mesh monitor
   */
  dispose() {
    if (this.htmlMesh) {
      this.htmlMesh.dispose();
      this.htmlMesh = null;
    }
    if (this.htmlMeshRenderer) {
      this.htmlMeshRenderer.dispose();
      this.htmlMeshRenderer = null;
    }
    console.log('HtmlMeshMonitor disposed');
  }
}
