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
  }
  
  initialize(guiTexture) {
    this.guiTexture = guiTexture;
    
    // Initialize core components
    this.selectionManager = new SelectionManager(this.scene);
    this.objectFactory = new ObjectFactory(this.scene);
    this.serializationManager = new SerializationManager(this.scene);
    this.cameraManager = new CameraManager(this.scene, this.canvas);
    
    // Initialize camera system
    this.cameraManager.initialize();
    
    // Setup mouse picking for selection
    this.selectionManager.setupPicking(this.canvas);
    
    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();
    
    console.log('EditorManager initialized');
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
  
  saveScene() {
    try {
      this.serializationManager.saveToFile();
      console.log('Scene saved successfully');
    } catch (error) {
      console.error('Failed to save scene:', error);
      alert('Failed to save scene. Check console for details.');
    }
  }
  
  loadScene() {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          await this.serializationManager.loadFromFile(file);
          
          // Deselect any selected object
          this.selectionManager.deselectObject();
          
          // Update scene hierarchy if it exists
          if (this.sceneHierarchy) {
            this.sceneHierarchy.refresh();
          }
          
          console.log('Scene loaded successfully');
          alert('Scene loaded successfully');
        } catch (error) {
          console.error('Failed to load scene:', error);
          alert('Failed to load scene. Check console for details.');
        }
      }
    };
    
    // Trigger file picker
    input.click();
  }
  
  dispose() {
    if (this.selectionManager) {
      this.selectionManager.dispose();
    }
  }
}
