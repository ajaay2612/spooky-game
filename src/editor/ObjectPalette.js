// ObjectPalette.js
// UI component for creating new scene objects

export class ObjectPalette {
  constructor(editorManager, guiTexture) {
    this.editor = editorManager;
    this.guiTexture = guiTexture;
    this.panel = null;
    this.scrollViewer = null;
    this.isVisible = true;
    
    this.initialize();
  }
  
  initialize() {
    // Create scroll viewer container
    this.scrollViewer = new BABYLON.GUI.ScrollViewer();
    this.scrollViewer.width = "240px";
    this.scrollViewer.height = "45%"; // 45% of screen height
    this.scrollViewer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.scrollViewer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.scrollViewer.top = "10px"; // 10px from top
    this.scrollViewer.left = "10px"; // 10px from left
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
    
    // Create sections
    this.createFileSection();
    this.createPrimitiveSection();
    this.createLightSection();
    this.createModelSection();
    
    console.log('ObjectPalette initialized with 45% height and scrolling');
  }
  
  createFileSection() {
    const header = this.createSectionHeader("File");
    this.panel.addControl(header);
    
    // Save button
    const saveButton = this.createButton("Save Scene", () => {
      this.editor.saveScene();
    });
    this.panel.addControl(saveButton);
    
    // Load button
    const loadButton = this.createButton("Load Scene", () => {
      this.editor.loadScene();
    });
    this.panel.addControl(loadButton);
    
    // Add spacer
    const spacer = new BABYLON.GUI.Container();
    spacer.height = "10px";
    this.panel.addControl(spacer);
  }
  
  createSectionHeader(text) {
    const header = new BABYLON.GUI.TextBlock();
    header.text = text;
    header.height = "30px";
    header.width = "190px";
    header.color = "#4a9eff";
    header.fontSize = 16;
    header.fontWeight = "bold";
    header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    header.textWrapping = true;
    header.paddingLeft = "5px";
    return header;
  }
  
  createButton(text, onClick) {
    const button = BABYLON.GUI.Button.CreateSimpleButton(`btn_${text}_${Date.now()}`, text);
    button.width = "180px";
    button.height = "30px";
    button.color = "white";
    button.background = "#3a3a3a";
    button.fontSize = 14;
    button.cornerRadius = 4;
    
    button.onPointerEnterObservable.add(() => {
      button.background = "#4a4a4a";
    });
    
    button.onPointerOutObservable.add(() => {
      button.background = "#3a3a3a";
    });
    
    button.onPointerClickObservable.add(onClick);
    
    return button;
  }
  
  createPrimitiveSection() {
    const header = this.createSectionHeader("Primitives");
    this.panel.addControl(header);
    
    const primitives = ['Box', 'Sphere', 'Cylinder', 'Cone', 'Plane', 'Torus'];
    
    primitives.forEach(type => {
      const button = this.createButton(type, () => {
        const mesh = this.editor.objectFactory.createPrimitive(type);
        if (mesh) {
          this.editor.selectionManager.selectObject(mesh);
          if (this.editor.sceneHierarchy) {
            this.editor.sceneHierarchy.refresh();
          }
        }
      });
      this.panel.addControl(button);
    });
    
    // Add spacer
    const spacer = new BABYLON.GUI.Container();
    spacer.height = "10px";
    this.panel.addControl(spacer);
  }
  
  createLightSection() {
    const header = this.createSectionHeader("Lights");
    this.panel.addControl(header);
    
    const lights = ['Point', 'Directional', 'Spot', 'Hemispheric'];
    
    lights.forEach(type => {
      const button = this.createButton(type, () => {
        const light = this.editor.objectFactory.createLight(type);
        if (light) {
          this.editor.selectionManager.selectObject(light);
          if (this.editor.sceneHierarchy) {
            this.editor.sceneHierarchy.refresh();
          }
        }
      });
      this.panel.addControl(button);
    });
    
    // Add spacer
    const spacer = new BABYLON.GUI.Container();
    spacer.height = "10px";
    this.panel.addControl(spacer);
  }
  
  createModelSection() {
    const header = this.createSectionHeader("Models");
    this.panel.addControl(header);
    
    const button = this.createButton("Import GLTF", () => {
      this.openGLTFImport();
    });
    this.panel.addControl(button);
  }
  
  openGLTFImport() {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.gltf,.glb';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          // Show loading indicator (simple alert for now)
          console.log('Loading GLTF model...');
          
          // Create URL from file
          const url = URL.createObjectURL(file);
          
          // Import the model
          const rootMesh = await this.editor.objectFactory.importGLTF(url);
          
          if (rootMesh) {
            this.editor.selectionManager.selectObject(rootMesh);
            if (this.editor.sceneHierarchy) {
              this.editor.sceneHierarchy.refresh();
            }
            console.log('GLTF model imported successfully');
          }
          
          // Clean up URL
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error('Failed to import GLTF:', error);
          alert(`Failed to import model: ${error.message}`);
        }
      }
    };
    
    // Trigger file picker
    input.click();
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
