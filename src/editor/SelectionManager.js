// SelectionManager.js
// Handles object selection and visual highlighting

export class SelectionManager {
  constructor(scene) {
    this.scene = scene;
    this.selectedObject = null;
    this.highlightLayer = null;
    this.onSelectionChanged = null;
    this.selectionCallbacks = []; // Support multiple callbacks
    
    this.initialize();
  }
  
  initialize() {
    // Create highlight layer for visual selection feedback
    this.highlightLayer = new BABYLON.HighlightLayer("highlight", this.scene);
    this.highlightLayer.outerGlow = true;
    this.highlightLayer.innerGlow = false;
    
    console.log("SelectionManager initialized with HighlightLayer");
  }
  
  setupPicking(canvas) {
    // Set up mouse picking for object selection
    this.scene.onPointerDown = (evt, pickResult) => {
      // Only handle left-click (button 0)
      if (evt.button === 0) {
        if (pickResult.hit && pickResult.pickedMesh) {
          // Filter out internal meshes and non-editable objects
          if (!pickResult.pickedMesh.name.startsWith('_')) {
            this.selectObject(pickResult.pickedMesh);
          }
        } else {
          // Clicked on empty space - deselect
          this.deselectObject();
        }
      }
    };
    
    console.log("Mouse picking enabled for object selection");
  }
  
  selectObject(object) {
    if (!object || object.isDisposed()) {
      console.warn("Cannot select invalid or disposed object");
      return;
    }
    
    // Remove highlight from previously selected object
    if (this.selectedObject && this.selectedObject instanceof BABYLON.Mesh) {
      this.highlightLayer.removeMesh(this.selectedObject);
    }
    
    // Update selection
    this.selectedObject = object;
    
    // Add highlight to newly selected object (only meshes can be highlighted)
    if (object instanceof BABYLON.Mesh) {
      this.highlightLayer.addMesh(object, BABYLON.Color3.Yellow());
    }
    
    // Trigger selection changed callbacks
    if (this.onSelectionChanged) {
      this.onSelectionChanged(object);
    }
    this.selectionCallbacks.forEach(callback => callback(object));
    
    console.log(`Selected object: ${object.name}`);
  }
  
  deselectObject() {
    if (this.selectedObject) {
      // Remove highlight
      if (this.selectedObject instanceof BABYLON.Mesh) {
        this.highlightLayer.removeMesh(this.selectedObject);
      }
      
      console.log(`Deselected object: ${this.selectedObject.name}`);
      this.selectedObject = null;
      
      // Trigger selection changed callbacks
      if (this.onSelectionChanged) {
        this.onSelectionChanged(null);
      }
      this.selectionCallbacks.forEach(callback => callback(null));
    }
  }
  
  addSelectionCallback(callback) {
    if (callback && typeof callback === 'function') {
      this.selectionCallbacks.push(callback);
    }
  }
  
  dispose() {
    if (this.highlightLayer) {
      this.highlightLayer.dispose();
      this.highlightLayer = null;
    }
  }
}
