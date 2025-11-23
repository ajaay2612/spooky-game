// EditorManager.js
// Main orchestrator for the Scene Editor Mode

import { SelectionManager } from './SelectionManager.js';
import { CameraManager } from './CameraManager.js';
import { SerializationManager } from './SerializationManager.js';
import { ObjectFactory } from '../scene/ObjectFactory.js';

export class EditorManager {
  constructor(scene, canvas) {
    this.scene = scene;
    this.canvas = canvas;
    this.isEditorMode = true;
    
    // Component references (will be initialized later)
    this.selectionManager = null;
    this.objectFactory = null;
    this.serializationManager = null;
    this.cameraManager = null;
    this.objectPalette = null;
    this.propertyPanel = null;
    this.sceneHierarchy = null;
    
    // GUI reference
    this.guiTexture = null;
    
    // Gizmo system
    this.gizmoManager = null;
    this.activeGizmo = null;
    
    // Light helper meshes for gizmo attachment
    this.lightHelpers = new Map();
    
  }
  
  initialize(guiTexture) {
    this.guiTexture = guiTexture;
    
    // Initialize core components
    this.selectionManager = new SelectionManager(this.scene, this);
    this.objectFactory = new ObjectFactory(this.scene);
    this.serializationManager = new SerializationManager(this.scene);
    this.cameraManager = new CameraManager(this.scene, this.canvas);
    
    // Initialize camera system
    this.cameraManager.initialize();
    
    // Setup mouse picking for selection
    this.selectionManager.setupPicking(this.canvas);
    
    // Initialize gizmo system
    this.initializeGizmos();
    
    // Add selection callback to update gizmos
    this.selectionManager.addSelectionCallback((object) => {
      this.updateGizmoAttachment();
    });
    
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    console.log('EditorManager initialized');
  }
  
  initializeGizmos() {
    // Create gizmo manager
    this.gizmoManager = new BABYLON.GizmoManager(this.scene);
    this.gizmoManager.usePointerToAttachGizmos = false; // Manual attachment
    
    // Configure scale gizmo sensitivity
    this.gizmoManager.scaleRatio = 1;
    this.gizmoManager.gizmoCoordinatesMode = BABYLON.GizmoCoordinatesMode.Local;
    
    // Disable all gizmos initially
    this.gizmoManager.positionGizmoEnabled = false;
    this.gizmoManager.scaleGizmoEnabled = false;
    this.gizmoManager.rotationGizmoEnabled = false;
    
    console.log('Gizmo system initialized');
    console.log('GizmoManager:', this.gizmoManager);
  }
  
  setGizmoMode(mode) {
    // Disable all gizmos first
    this.gizmoManager.positionGizmoEnabled = false;
    this.gizmoManager.scaleGizmoEnabled = false;
    
    const selectedObject = this.selectionManager.selectedObject;
    
    if (!mode || !selectedObject) {
      this.activeGizmo = null;
      this.gizmoManager.attachToMesh(null);
      return;
    }
    
    // Enable the requested gizmo and attach to selected object
    if (mode === 'move') {
      this.gizmoManager.positionGizmoEnabled = true;
      this.gizmoManager.attachToMesh(selectedObject);
      this.activeGizmo = 'move';
      console.log('Position gizmo enabled for:', selectedObject.name);
    } else if (mode === 'scale') {
      this.gizmoManager.scaleGizmoEnabled = true;
      this.gizmoManager.attachToMesh(selectedObject);
      this.activeGizmo = 'scale';
      
      // Wait a frame for gizmo to be created, then configure uniform scaling
      setTimeout(() => {
        if (this.gizmoManager.gizmos && this.gizmoManager.gizmos.scaleGizmo) {
          const uniformMode = this.propertyPanel ? this.propertyPanel.uniformScaling : true;
          const scaleGizmo = this.gizmoManager.gizmos.scaleGizmo;
          
          // Enable/disable individual axis gizmos based on uniform mode
          if (uniformMode) {
            // Uniform scaling: only show center gizmo, hide axis gizmos
            if (scaleGizmo.xGizmo) scaleGizmo.xGizmo.isEnabled = false;
            if (scaleGizmo.yGizmo) scaleGizmo.yGizmo.isEnabled = false;
            if (scaleGizmo.zGizmo) scaleGizmo.zGizmo.isEnabled = false;
            if (scaleGizmo.uniformScaleGizmo) scaleGizmo.uniformScaleGizmo.isEnabled = true;
          } else {
            // Non-uniform scaling: show axis gizmos, hide center gizmo
            if (scaleGizmo.xGizmo) scaleGizmo.xGizmo.isEnabled = true;
            if (scaleGizmo.yGizmo) scaleGizmo.yGizmo.isEnabled = true;
            if (scaleGizmo.zGizmo) scaleGizmo.zGizmo.isEnabled = true;
            if (scaleGizmo.uniformScaleGizmo) scaleGizmo.uniformScaleGizmo.isEnabled = false;
          }
          
          console.log('Scale gizmo configured - uniform mode:', uniformMode);
        }
      }, 10);
      
      console.log('Scale gizmo enabled for:', selectedObject.name);
    }
  }
  
  updateScaleGizmoUniformMode(uniform) {
    console.log('updateScaleGizmoUniformMode called with:', uniform);
    
    if (this.gizmoManager && this.gizmoManager.gizmos && this.gizmoManager.gizmos.scaleGizmo) {
      const scaleGizmo = this.gizmoManager.gizmos.scaleGizmo;
      
      // Enable/disable individual axis gizmos based on uniform mode
      if (uniform) {
        // Uniform scaling: only show center gizmo, hide axis gizmos
        if (scaleGizmo.xGizmo) scaleGizmo.xGizmo.isEnabled = false;
        if (scaleGizmo.yGizmo) scaleGizmo.yGizmo.isEnabled = false;
        if (scaleGizmo.zGizmo) scaleGizmo.zGizmo.isEnabled = false;
        if (scaleGizmo.uniformScaleGizmo) scaleGizmo.uniformScaleGizmo.isEnabled = true;
        console.log('Uniform scaling enabled - showing center gizmo only');
      } else {
        // Non-uniform scaling: show axis gizmos, hide center gizmo
        if (scaleGizmo.xGizmo) scaleGizmo.xGizmo.isEnabled = true;
        if (scaleGizmo.yGizmo) scaleGizmo.yGizmo.isEnabled = true;
        if (scaleGizmo.zGizmo) scaleGizmo.zGizmo.isEnabled = true;
        if (scaleGizmo.uniformScaleGizmo) scaleGizmo.uniformScaleGizmo.isEnabled = false;
        console.log('Non-uniform scaling enabled - showing axis gizmos');
      }
    } else {
      console.warn('Scale gizmo not available');
    }
  }
  
  setupKeyboardShortcuts() {
    window.addEventListener('keydown', (evt) => {
      // E key - Toggle editor/play mode
      if (evt.key === 'e' || evt.key === 'E') {
        this.toggleMode();
        return;
      }
      
      // Only process editor shortcuts when in editor mode
      if (!this.isEditorMode) {
        return;
      }
      
      // Delete key - Delete selected object
      if (evt.key === 'Delete') {
        this.deleteSelected();
      }
      
      // Ctrl+D - Duplicate selected object
      if (evt.ctrlKey && (evt.key === 'd' || evt.key === 'D')) {
        evt.preventDefault();
        this.duplicateSelected();
      }
      
      // Ctrl+S - Save scene
      if (evt.ctrlKey && (evt.key === 's' || evt.key === 'S')) {
        evt.preventDefault();
        this.saveScene();
      }
      
      // Ctrl+O - Load scene
      if (evt.ctrlKey && (evt.key === 'o' || evt.key === 'O')) {
        evt.preventDefault();
        this.loadScene();
      }
      
      // F key - Focus camera on selected object
      if (evt.key === 'f' || evt.key === 'F') {
        this.focusOnSelected();
      }
      
      // Escape key - Deselect object
      if (evt.key === 'Escape') {
        this.selectionManager.deselectObject();
      }
    });
    
    console.log('Keyboard shortcuts registered');
  }
  
  focusOnSelected() {
    if (this.selectionManager.selectedObject && this.cameraManager.editorCamera) {
      const target = this.selectionManager.selectedObject.position;
      this.cameraManager.editorCamera.setTarget(target);
      console.log(`Focused camera on: ${this.selectionManager.selectedObject.name}`);
    }
  }
  
  toggleMode() {
    this.isEditorMode = !this.isEditorMode;
    
    if (this.isEditorMode) {
      this.enterEditorMode();
    } else {
      this.enterPlayMode();
    }
    
    console.log(`Mode switched to: ${this.isEditorMode ? 'Editor' : 'Play'}`);
  }
  
  enterEditorMode() {
    this.isEditorMode = true;
    
    // Switch to editor camera
    this.cameraManager.switchToEditorCamera();
    
    // Show GUI elements
    if (this.guiTexture) {
      this.guiTexture.layer.isEnabled = true;
    }
    if (this.objectPalette) {
      this.objectPalette.show();
    }
    if (this.propertyPanel) {
      this.propertyPanel.show();
    }
    if (this.sceneHierarchy) {
      this.sceneHierarchy.show();
    }
    
    // Enable selection
    if (this.selectionManager) {
      this.selectionManager.setupPicking(this.canvas);
    }
    
    console.log('Entered editor mode');
  }
  
  enterPlayMode() {
    this.isEditorMode = false;
    
    // Switch to player camera
    this.cameraManager.switchToPlayerCamera();
    
    // Hide GUI elements
    if (this.guiTexture) {
      this.guiTexture.layer.isEnabled = false;
    }
    if (this.objectPalette) {
      this.objectPalette.hide();
    }
    if (this.propertyPanel) {
      this.propertyPanel.hide();
    }
    if (this.sceneHierarchy) {
      this.sceneHierarchy.hide();
    }
    
    // Deselect any selected object
    if (this.selectionManager) {
      this.selectionManager.deselectObject();
    }
    
    console.log('Entered play mode');
  }
  
  deleteSelected() {
    const selected = this.selectionManager.selectedObject;
    
    if (!selected) {
      console.warn('No object selected to delete');
      return;
    }
    
    // Prevent deletion of essential objects
    const essentialNames = ['playerCamera', 'editorCamera', 'camera', 'hemisphericLight', 'pointLight'];
    if (essentialNames.includes(selected.name)) {
      console.warn(`Cannot delete essential object: ${selected.name}`);
      alert(`Cannot delete essential object: ${selected.name}`);
      return;
    }
    
    const objectName = selected.name;
    
    // Detach gizmos before deletion
    if (this.gizmoManager) {
      this.gizmoManager.attachToMesh(null);
    }
    
    // Deselect first
    this.selectionManager.deselectObject();
    
    // Dispose of the object and its resources
    if (selected.material) {
      selected.material.dispose();
    }
    selected.dispose();
    
    // Update scene hierarchy if it exists
    if (this.sceneHierarchy) {
      this.sceneHierarchy.refresh();
    }
    
    console.log(`Deleted object: ${objectName}`);
  }
  
  duplicateSelected() {
    const selected = this.selectionManager.selectedObject;
    
    if (!selected) {
      console.warn('No object selected to duplicate');
      return;
    }
    
    const duplicate = this.objectFactory.duplicateObject(selected);
    
    if (duplicate) {
      // Select the newly created duplicate
      this.selectionManager.selectObject(duplicate);
      
      // Update scene hierarchy if it exists
      if (this.sceneHierarchy) {
        this.sceneHierarchy.refresh();
      }
      
      console.log(`Duplicated object: ${duplicate.name}`);
    }
  }
  
  async saveScene() {
    try {
      await this.serializationManager.saveToFile();
      console.log('Scene saved successfully');
    } catch (error) {
      console.error('Failed to save scene:', error);
    }
  }
  
  async loadScene() {
    try {
      await this.serializationManager.loadFromFile();
      
      // Deselect any selected object
      this.selectionManager.deselectObject();
      
      // Update scene hierarchy if it exists
      if (this.sceneHierarchy) {
        this.sceneHierarchy.refresh();
      }
      
      console.log('Scene loaded successfully');
    } catch (error) {
      console.error('Failed to load scene:', error);
    }
  }
  
  setLightGizmoMode(mode, light) {
    // Disable all gizmos first
    this.gizmoManager.positionGizmoEnabled = false;
    this.gizmoManager.scaleGizmoEnabled = false;
    
    if (!mode || !light) {
      this.activeGizmo = null;
      this.gizmoManager.attachToMesh(null);
      
      // Clean up helper mesh if exists
      if (this.lightHelpers.has(light)) {
        const helper = this.lightHelpers.get(light);
        helper.dispose();
        this.lightHelpers.delete(light);
      }
      return;
    }
    
    // Create or get helper mesh for the light
    let helperMesh = this.lightHelpers.get(light);
    
    if (!helperMesh) {
      // Create a small invisible sphere as helper
      helperMesh = BABYLON.MeshBuilder.CreateSphere(`_lightHelper_${light.name}`, { diameter: 0.3 }, this.scene);
      helperMesh.isVisible = false;
      helperMesh.isPickable = false;
      
      // Link helper position to light position
      this.scene.onBeforeRenderObservable.add(() => {
        if (light.position && helperMesh) {
          helperMesh.position.copyFrom(light.position);
        }
      });
      
      this.lightHelpers.set(light, helperMesh);
    }
    
    // Position helper at light position
    if (light.position) {
      helperMesh.position.copyFrom(light.position);
    }
    
    // Enable move gizmo and attach to helper mesh
    if (mode === 'move') {
      this.gizmoManager.positionGizmoEnabled = true;
      this.gizmoManager.attachToMesh(helperMesh);
      this.activeGizmo = 'move';
      
      // Update light position when helper moves
      const positionGizmo = this.gizmoManager.gizmos.positionGizmo;
      if (positionGizmo) {
        positionGizmo.onDragEndObservable.add(() => {
          if (light.position) {
            light.position.copyFrom(helperMesh.position);
          }
        });
      }
      
      console.log('Position gizmo enabled for light:', light.name);
    }
  }
  
  updateGizmoAttachment() {
    const selectedObject = this.selectionManager.selectedObject;
    
    // Update gizmo attachment based on active mode
    if (this.activeGizmo && this.gizmoManager) {
      this.gizmoManager.attachToMesh(selectedObject);
    }
  }
  
  dispose() {
    if (this.selectionManager) {
      this.selectionManager.dispose();
    }
    
    if (this.gizmoManager) {
      this.gizmoManager.dispose();
    }
    
    // Clean up light helpers
    this.lightHelpers.forEach(helper => helper.dispose());
    this.lightHelpers.clear();
  }
}
