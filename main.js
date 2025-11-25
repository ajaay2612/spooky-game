// Spooky Game - Main JavaScript File
// This file contains all game logic and Babylon.js setup

import { EditorManager } from './src/editor/EditorManager.js';
import { ObjectPalette } from './src/editor/ObjectPalette.js';
import { PropertyPanel } from './src/editor/PropertyPanel.js';
import { SceneHierarchy } from './src/editor/SceneHierarchy.js';
import { SettingsPanel } from './src/editor/SettingsPanel.js';
import { MonitorController } from './src/monitor/MonitorController.js';

// Global variables
let engine = null;
let scene = null;
let fpsDisplay = null;
let loadStartTime = Date.now();
let editorManager = null;
let postProcessingPipeline = null;
let monitorController = null;

// Wait for DOM to be fully loaded
window.addEventListener('DOMContentLoaded', () => {
  initializeGame();
});

// Note: F key is now handled by EditorManager for focus functionality
// FPS counter is always visible (can be toggled in future if needed)

// Camera setup is now handled by CameraManager in EditorManager

/**
 * Create room environment geometry
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 */
function createRoomEnvironment(scene) {
  // Create floor mesh (20x20 ground plane at y=0)
  const floor = BABYLON.MeshBuilder.CreateGround(
    "floor",
    { width: 20, height: 20 },
    scene
  );
  floor.position.y = 0;

  // Create ceiling mesh (20x20 plane at y=3)
  const ceiling = BABYLON.MeshBuilder.CreateGround(
    "ceiling",
    { width: 20, height: 20 },
    scene
  );
  ceiling.position.y = 3;
  // Rotate ceiling to face downward
  ceiling.rotation.z = Math.PI;

  // Create four wall meshes to enclose the room
  // Walls are 3 meters high and properly aligned

  // North wall (positive Z)
  const wallNorth = BABYLON.MeshBuilder.CreateBox(
    "wallNorth",
    { width: 20, height: 3, depth: 0.5 },
    scene
  );
  wallNorth.position = new BABYLON.Vector3(0, 1.5, 10);

  // South wall (negative Z)
  const wallSouth = BABYLON.MeshBuilder.CreateBox(
    "wallSouth",
    { width: 20, height: 3, depth: 0.5 },
    scene
  );
  wallSouth.position = new BABYLON.Vector3(0, 1.5, -10);

  // East wall (positive X)
  const wallEast = BABYLON.MeshBuilder.CreateBox(
    "wallEast",
    { width: 0.5, height: 3, depth: 20 },
    scene
  );
  wallEast.position = new BABYLON.Vector3(10, 1.5, 0);

  // West wall (negative X)
  const wallWest = BABYLON.MeshBuilder.CreateBox(
    "wallWest",
    { width: 0.5, height: 3, depth: 20 },
    scene
  );
  wallWest.position = new BABYLON.Vector3(-10, 1.5, 0);

  console.log('Room environment geometry created');

  return {
    floor,
    ceiling,
    walls: [wallNorth, wallSouth, wallEast, wallWest]
  };
}

/**
 * Apply materials and colors for spooky atmosphere
 * @param {Object} roomMeshes - Object containing floor, ceiling, and walls meshes
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 */
function applySpookyMaterials(roomMeshes, scene) {
  // Create StandardMaterial for floor with dark gray color (#1a1a1a)
  const floorMaterial = new BABYLON.StandardMaterial("floorMat", scene);
  floorMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1); // #1a1a1a in RGB (26/255 ≈ 0.1)
  floorMaterial.specularColor = new BABYLON.Color3(0.01, 0.01, 0.01); // Low specular for matte appearance
  roomMeshes.floor.material = floorMaterial;

  // Create StandardMaterial for ceiling with very dark gray color (#0d0d0d)
  const ceilingMaterial = new BABYLON.StandardMaterial("ceilingMat", scene);
  ceilingMaterial.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05); // #0d0d0d in RGB (13/255 ≈ 0.05)
  ceilingMaterial.specularColor = new BABYLON.Color3(0.01, 0.01, 0.01); // Low specular for matte appearance
  roomMeshes.ceiling.material = ceilingMaterial;

  // Create StandardMaterial for walls with dark brown/gray color (#2a2a2a)
  const wallMaterial = new BABYLON.StandardMaterial("wallMat", scene);
  wallMaterial.diffuseColor = new BABYLON.Color3(0.165, 0.165, 0.165); // #2a2a2a in RGB (42/255 ≈ 0.165)
  wallMaterial.specularColor = new BABYLON.Color3(0.01, 0.01, 0.01); // Low specular for matte appearance

  // Apply material to all wall meshes
  roomMeshes.walls.forEach(wall => {
    wall.material = wallMaterial;
  });

  console.log('Spooky materials applied to room meshes');
}

/**
 * Implement atmospheric lighting system for spooky atmosphere
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 */
function setupAtmosphericLighting(scene) {
  // Create HemisphericLight with low intensity (0.3)
  // Position light from above with slight blue tint
  const hemisphericLight = new BABYLON.HemisphericLight(
    "hemisphericLight",
    new BABYLON.Vector3(0, 1, 0), // Direction from above
    scene
  );

  // Configure light color for spooky atmosphere with slight blue tint
  hemisphericLight.intensity = 0.3; // Low intensity for dim, spooky atmosphere
  hemisphericLight.diffuse = new BABYLON.Color3(0.5, 0.5, 0.6); // Slight blue tint (more blue in the third component)
  hemisphericLight.specular = new BABYLON.Color3(0.1, 0.1, 0.15); // Subtle specular with blue tint
  hemisphericLight.groundColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Dark ground color

  // Optionally add PointLight for focal illumination
  const pointLight = new BABYLON.PointLight(
    "pointLight",
    new BABYLON.Vector3(0, 2, 0), // Center of room, slightly elevated
    scene
  );

  // Configure point light for warm focal illumination
  pointLight.intensity = 0.5; // Moderate intensity
  pointLight.diffuse = new BABYLON.Color3(1.0, 0.7, 0.4); // Warm orange/yellow color (like a dim bulb)
  pointLight.specular = new BABYLON.Color3(0.5, 0.35, 0.2); // Warm specular
  pointLight.range = 15; // Light range in units

  console.log('Atmospheric lighting system initialized');

  return {
    hemisphericLight,
    pointLight
  };
}

/**
 * Setup post-processing effects for realistic rendering
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Array} cameras - Array of cameras to attach effects to
 */
function setupPostProcessing(scene, cameras) {
  // Create default rendering pipeline with post-processing effects
  const pipeline = new BABYLON.DefaultRenderingPipeline(
    "defaultPipeline",
    true, // HDR enabled
    scene,
    cameras // Attach to all cameras
  );

  // Enable MSAA (Multi-Sample Anti-Aliasing) for best quality
  pipeline.samples = 4; // 4x MSAA - higher quality than FXAA
  
  // Enable FXAA as additional pass for even smoother edges
  pipeline.fxaaEnabled = true;

  // Enable bloom for glowing lights
  pipeline.bloomEnabled = true;
  pipeline.bloomThreshold = 0.8; // Only bright areas bloom
  pipeline.bloomWeight = 0.3; // Bloom intensity
  pipeline.bloomKernel = 64; // Bloom spread
  pipeline.bloomScale = 0.5; // Bloom quality

  // Enable image processing for better colors
  pipeline.imageProcessingEnabled = true;
  pipeline.imageProcessing.contrast = 1.1; // Slightly increase contrast
  pipeline.imageProcessing.exposure = 1.0; // Normal exposure
  
  // Enable tone mapping for realistic lighting
  pipeline.imageProcessing.toneMappingEnabled = true;
  pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;

  // Enable vignette for cinematic look
  pipeline.imageProcessing.vignetteEnabled = true;
  pipeline.imageProcessing.vignetteWeight = 1.5;
  pipeline.imageProcessing.vignetteCameraFov = 0.8;

  // Reduce chromatic aberration for subtle effect (was too strong)
  pipeline.chromaticAberrationEnabled = true;
  pipeline.chromaticAberration.aberrationAmount = 5; // Much more subtle

  // Enable grain for film-like quality
  pipeline.grainEnabled = true;
  pipeline.grain.intensity = 10;
  pipeline.grain.animated = true;

  // Enable sharpen for crisp details
  pipeline.sharpenEnabled = true;
  pipeline.sharpen.edgeAmount = 0.3;
  pipeline.sharpen.colorAmount = 0.5;

  console.log('Post-processing pipeline initialized with bloom, AA, and effects');
  
  return pipeline;
}

/**
 * Check browser compatibility and WebGL support
 * @returns {Object} Compatibility check results
 */
function checkBrowserCompatibility() {
  const results = {
    webglSupported: false,
    webgl2Supported: false,
    browserName: 'Unknown',
    browserVersion: 'Unknown',
    compatible: false,
    warnings: []
  };

  // Detect browser
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
    results.browserName = 'Chrome';
  } else if (userAgent.indexOf('Firefox') > -1) {
    results.browserName = 'Firefox';
  } else if (userAgent.indexOf('Edg') > -1) {
    results.browserName = 'Edge';
  } else if (userAgent.indexOf('Safari') > -1) {
    results.browserName = 'Safari';
  }

  // Check WebGL support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const gl2 = canvas.getContext('webgl2');

  if (gl) {
    results.webglSupported = true;
  }

  if (gl2) {
    results.webgl2Supported = true;
  }

  // Determine compatibility
  if (results.webgl2Supported) {
    results.compatible = true;
    console.log('✓ WebGL 2.0 supported');
  } else if (results.webglSupported) {
    results.compatible = true;
    results.warnings.push('WebGL 2.0 not supported, falling back to WebGL 1.0');
    console.warn('⚠ WebGL 2.0 not supported, using WebGL 1.0 fallback');
  } else {
    results.compatible = false;
    console.error('✗ WebGL not supported');
  }

  // Browser compatibility warnings
  const recommendedBrowsers = ['Chrome', 'Firefox', 'Edge'];
  if (!recommendedBrowsers.includes(results.browserName)) {
    results.warnings.push(`Browser ${results.browserName} may not be fully supported. Recommended: Chrome, Firefox, or Edge`);
  }

  console.log(`Browser: ${results.browserName}, WebGL: ${results.webglSupported}, WebGL2: ${results.webgl2Supported}`);

  return results;
}

/**
 * Create FPS counter display
 */
function createFPSCounter() {
  const fpsDiv = document.createElement('div');
  fpsDiv.id = 'fps-counter';
  fpsDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: #00ff00;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    z-index: 1000;
    min-width: 80px;
  `;
  fpsDiv.textContent = 'FPS: --';
  document.body.appendChild(fpsDiv);
  return fpsDiv;
}

/**
 * Update FPS counter display
 */
function updateFPSCounter() {
  if (fpsDisplay && engine) {
    const fps = engine.getFps().toFixed(0);
    fpsDisplay.textContent = `FPS: ${fps}`;

    // Color code based on performance
    if (fps >= 50) {
      fpsDisplay.style.color = '#00ff00'; // Green - good
    } else if (fps >= 30) {
      fpsDisplay.style.color = '#ffff00'; // Yellow - acceptable
    } else {
      fpsDisplay.style.color = '#ff0000'; // Red - poor
    }
  }
}

/**
 * Measure and log load time
 */
function measureLoadTime() {
  const loadTime = (Date.now() - loadStartTime) / 1000;
  console.log(`Game loaded in ${loadTime.toFixed(2)} seconds`);

  if (loadTime > 5) {
    console.warn(`⚠ Load time (${loadTime.toFixed(2)}s) exceeds target of 5 seconds`);
  } else {
    console.log(`✓ Load time within target (< 5 seconds)`);
  }

  return loadTime;
}

/**
 * Initialize the game engine and scene
 */
async function initializeGame() {
  try {
    // Check browser compatibility and WebGL support
    const compatibility = checkBrowserCompatibility();

    if (!compatibility.compatible) {
      displayError('WebGL is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      return;
    }

    // Display warnings if any
    if (compatibility.warnings.length > 0) {
      compatibility.warnings.forEach(warning => {
        console.warn(warning);
      });
    }

    // Get canvas element
    const canvas = document.getElementById('renderCanvas');

    // Error handling: Canvas not found
    if (!canvas) {
      console.error('Canvas element not found');
      displayError('Failed to initialize: Canvas element not found');
      return;
    }

    // Error handling: Engine creation failure
    try {
      // Initialize Babylon.js engine from canvas element
      // Use WebGL 2 if available, fallback to WebGL 1
      engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: !compatibility.webgl2Supported
      });
    } catch (error) {
      console.error('Failed to create Babylon.js engine:', error);
      displayError('WebGL not supported or failed to initialize. Please use a modern browser.');
      return;
    }

    // Create scene instance with dark background color
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.01, 0.01, 0.02); // Very dark blue for spooky atmosphere

    // Initialize KTX2 decoder for compressed textures
    if (BABYLON.KhronosTextureContainer2) {
      engine.enableOfflineSupport = false; // Disable offline support for KTX2
      scene.enableOfflineSupport = false;
      
      // Set KTX2 decoder configuration
      if (!BABYLON.KhronosTextureContainer2.URLConfig) {
        BABYLON.KhronosTextureContainer2.URLConfig = {
          jsDecoderModule: "https://cdn.babylonjs.com/babylon.ktx2Decoder.js",
          wasmUASTCToASTC: null,
          wasmUASTCToBC7: null,
          wasmUASTCToRGBA_UNORM: null,
          wasmUASTCToRGBA_SRGB: null,
          jsMSCTranscoder: null,
          wasmMSCTranscoder: null
        };
      }
      console.log('KTX2 decoder initialized for compressed textures');
    }

    // Create basic lighting (minimal setup)
    const hemisphericLight = new BABYLON.HemisphericLight(
      "hemisphericLight",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    hemisphericLight.intensity = 0.5;
    hemisphericLight.diffuse = new BABYLON.Color3(0.8, 0.8, 0.9);
    
    console.log('Basic scene initialized without room geometry');

    // Create GUI texture for editor UI
    const guiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Initialize Editor Manager
    editorManager = new EditorManager(scene, canvas);
    editorManager.initialize(guiTexture);

    // Initialize UI components
    editorManager.objectPalette = new ObjectPalette(editorManager, guiTexture);
    editorManager.propertyPanel = new PropertyPanel(editorManager, guiTexture);
    editorManager.sceneHierarchy = new SceneHierarchy(editorManager, guiTexture);

    // Setup post-processing effects for realistic rendering (attach to both cameras)
    const cameras = [editorManager.cameraManager.editorCamera, editorManager.cameraManager.playerCamera];
    postProcessingPipeline = setupPostProcessing(scene, cameras);
    window.postProcessingPipeline = postProcessingPipeline; // Make globally accessible for serialization
    
    // Create settings panel for post-processing controls
    const settingsPanel = new SettingsPanel(guiTexture, postProcessingPipeline);
    window.settingsPanel = settingsPanel; // Make globally accessible for refresh

    // Initialize Monitor Controller (non-blocking)
    monitorController = new MonitorController(scene);
    window.monitorController = monitorController; // Make globally accessible for debugging
    
    // Initialize in background without blocking
    monitorController.initialize().then(() => {
      console.log('Monitor system ready');
    }).catch(error => {
      console.error('Monitor initialization failed:', error);
    });

    // Setup monitor activation key (M key)
    window.addEventListener('keydown', (event) => {
      if (event.key === 'm' || event.key === 'M') {
        if (monitorController.isActive) {
          monitorController.deactivate();
          console.log('Monitor deactivated - press M to reactivate');
        } else {
          monitorController.activate();
          console.log('Monitor activated - use Arrow keys/WASD to navigate, Enter to select, Escape to exit input');
        }
      }
    });

    // Start in editor mode
    editorManager.enterEditorMode();
    
    // Auto-load saved scene if it exists (after a small delay to ensure UI is ready)
    setTimeout(() => {
      editorManager.autoLoadScene();
    }, 100);

    // Implement window resize handler for responsive canvas
    window.addEventListener('resize', () => {
      engine.resize();
    });

    console.log('Spooky Game - Engine and scene initialized successfully');

    // Create FPS counter (optional - can be toggled)
    fpsDisplay = createFPSCounter();

    // Measure and log load time
    measureLoadTime();

    // Implement engine.runRenderLoop with scene.render()
    // Add try-catch error handling in render loop
    engine.runRenderLoop(() => {
      try {
        scene.render();
        updateFPSCounter();
        
        // Update monitor controller
        if (monitorController) {
          monitorController.update();
        }
      } catch (error) {
        console.error('Render error:', error);
        // Don't stop the render loop, just log the error
      }
    });

  } catch (error) {
    console.error('Unexpected error during initialization:', error);
    displayError('An unexpected error occurred during initialization');
  }
}

/**
 * Display error message to user
 * @param {string} message - Error message to display
 */
function displayError(message) {
  // Create error display element if it doesn't exist
  let errorDiv = document.getElementById('error-message');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ff0000; color: #ffffff; padding: 20px; border-radius: 5px; font-family: Arial, sans-serif; z-index: 1000;';
    document.body.appendChild(errorDiv);
  }
  errorDiv.textContent = message;
}
