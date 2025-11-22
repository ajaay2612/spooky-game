// SceneHierarchy.js
// UI component for displaying scene object list

export class SceneHierarchy {
  constructor(editorManager, guiTexture) {
    this.editor = editorManager;
    this.guiTexture = guiTexture;
    this.panel = null;
    this.objectButtons = new Map();
    this.isVisible = true;
    
    this.initialize();
  }
  
  initialize() {
    // Create main panel without scroll viewer
    this.panel = new BABYLON.GUI.StackPanel();
    this.panel.width = "220px";
    this.panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.panel.paddingTop = "500px"; // Below ObjectPalette - increased to give more room
    this.panel.paddingLeft = "10px";
    this.panel.background = "#2a2a2a";
    
    this.guiTexture.addControl(this.panel);
    
    // Listen for selection changes
    this.editor.selectionManager.addSelectionCallback((object) => {
      this.highlightSelected(object);
    });
    
    this.refresh();
    
    console.log('SceneHierarchy initialized');
  }
  
  refresh() {
    this.panel.clearControls();
    this.objectButtons.clear();
    
    // Add header
    const header = new BABYLON.GUI.TextBlock();
    header.text = "Scene Hierarchy";
    header.height = "30px";
    header.width = "190px";
    header.color = "#4a9eff";
    header.fontSize = 16;
    header.fontWeight = "bold";
    header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    header.textWrapping = true;
    header.paddingLeft = "5px";
    this.panel.addControl(header);
    
    // Get objects from scene
    const meshes = this.editor.scene.meshes.filter(m => !m.name.startsWith('_'));
    const lights = this.editor.scene.lights;
    
    // Add sections
    this.addSection("Meshes", meshes);
    this.addSection("Lights", lights);
  }
  
  addSection(title, objects) {
    if (objects.length === 0) return;
    
    const sectionHeader = new BABYLON.GUI.TextBlock();
    sectionHeader.text = title;
    sectionHeader.height = "25px";
    sectionHeader.color = "white";
    sectionHeader.fontSize = 14;
    sectionHeader.fontWeight = "bold";
    sectionHeader.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    sectionHeader.paddingLeft = "5px";
    this.panel.addControl(sectionHeader);
    
    objects.forEach(obj => {
      const button = this.createObjectButton(obj);
      this.panel.addControl(button);
      this.objectButtons.set(obj, button);
    });
    
    // Add spacer
    const spacer = new BABYLON.GUI.Container();
    spacer.height = "5px";
    this.panel.addControl(spacer);
  }
  
  createObjectButton(object) {
    const button = BABYLON.GUI.Button.CreateSimpleButton(
      `hierarchy_${object.name}_${Date.now()}`,
      object.name
    );
    button.width = "180px";
    button.height = "25px";
    button.color = "white";
    button.background = "#333";
    button.fontSize = 12;
    button.cornerRadius = 2;
    button.paddingLeft = "10px";
    button.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    
    button.onPointerEnterObservable.add(() => {
      if (this.editor.selectionManager.selectedObject !== object) {
        button.background = "#444";
      }
    });
    
    button.onPointerOutObservable.add(() => {
      if (this.editor.selectionManager.selectedObject !== object) {
        button.background = "#333";
      }
    });
    
    button.onPointerClickObservable.add(() => {
      this.editor.selectionManager.selectObject(object);
    });
    
    return button;
  }
  
  highlightSelected(object) {
    // Reset all buttons
    this.objectButtons.forEach((button, obj) => {
      if (obj === object) {
        button.background = "#4a9eff";
      } else {
        button.background = "#333";
      }
    });
  }
  
  show() {
    if (this.panel) {
      this.panel.isVisible = true;
      this.isVisible = true;
    }
  }
  
  hide() {
    if (this.panel) {
      this.panel.isVisible = false;
      this.isVisible = false;
    }
  }
}
