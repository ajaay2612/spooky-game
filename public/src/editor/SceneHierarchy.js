// SceneHierarchy.js
// UI component for displaying scene object list

export class SceneHierarchy {
  constructor(editorManager, guiTexture) {
    this.editor = editorManager;
    this.guiTexture = guiTexture;
    this.panel = null;
    this.scrollViewer = null;
    this.objectButtons = new Map();
    this.isVisible = true;
    
    this.initialize();
  }
  
  initialize() {
    // Create scroll viewer container
    this.scrollViewer = new BABYLON.GUI.ScrollViewer();
    this.scrollViewer.width = "240px";
    this.scrollViewer.height = "45%"; // 45% of screen height
    this.scrollViewer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.scrollViewer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    this.scrollViewer.left = "10px";
    this.scrollViewer.top = "-50px"; // Push up 50px from bottom edge to clear taskbar
    this.scrollViewer.background = "#2a2a2a";
    this.scrollViewer.thickness = 2;
    this.scrollViewer.thumbLength = 0.5;
    this.scrollViewer.barColor = "#4a9eff";
    this.scrollViewer.barBackground = "#1a1a1a";
    
    // Block pointer events from reaching the canvas
    this.scrollViewer.isPointerBlocker = true;
    
    this.guiTexture.addControl(this.scrollViewer);
    
    // Create main panel inside scroll viewer
    this.panel = new BABYLON.GUI.StackPanel();
    this.panel.width = "200px";
    
    this.scrollViewer.addControl(this.panel);
    
    // Listen for selection changes
    this.editor.selectionManager.addSelectionCallback((object) => {
      this.highlightSelected(object);
    });
    
    this.refresh();
    
    console.log('SceneHierarchy initialized with 45% height and scrolling');
  }
  
  refresh() {
    this.panel.clearControls();
    this.objectButtons.clear();
    
    // Add header container with title and refresh button
    const headerContainer = new BABYLON.GUI.StackPanel();
    headerContainer.height = "35px";
    headerContainer.width = "190px";
    headerContainer.isVertical = false;
    this.panel.addControl(headerContainer);
    
    // Add header text
    const header = new BABYLON.GUI.TextBlock();
    header.text = "Scene Hierarchy";
    header.width = "140px";
    header.color = "#4a9eff";
    header.fontSize = 16;
    header.fontWeight = "bold";
    header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    header.paddingLeft = "5px";
    headerContainer.addControl(header);
    
    // Add refresh button
    const refreshBtn = BABYLON.GUI.Button.CreateSimpleButton(
      `hierarchy_refresh_${Date.now()}`,
      "↻"
    );
    refreshBtn.width = "40px";
    refreshBtn.height = "30px";
    refreshBtn.color = "white";
    refreshBtn.background = "#4a9eff";
    refreshBtn.fontSize = 18;
    refreshBtn.cornerRadius = 3;
    refreshBtn.thickness = 0;
    
    refreshBtn.onPointerEnterObservable.add(() => {
      refreshBtn.background = "#5ab0ff";
    });
    
    refreshBtn.onPointerOutObservable.add(() => {
      refreshBtn.background = "#4a9eff";
    });
    
    refreshBtn.onPointerClickObservable.add(() => {
      this.refresh();
      console.log('Scene hierarchy manually refreshed');
    });
    
    headerContainer.addControl(refreshBtn);
    
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
    if (this.scrollViewer) {
      this.scrollViewer.isVisible = true;
      this.isVisible = true;
    }
  }
  
  hide() {
    if (this.scrollViewer) {
      this.scrollViewer.isVisible = false;
      this.isVisible = false;
    }
  }
}
