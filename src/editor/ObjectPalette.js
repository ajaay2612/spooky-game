// ObjectPalette.js
// UI component for creating new scene objects

export class ObjectPalette {
  constructor(editorManager, guiTexture) {
    this.editor = editorManager;
    this.guiTexture = guiTexture;
    this.panel = null;
    this.isVisible = true;
    
    this.initialize();
  }
  
  initialize() {
    // Create main panel without scroll viewer for simpler layout
    this.panel = new BABYLON.GUI.StackPanel();
    this.panel.width = "220px";
    this.panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.panel.paddingTop = "10px";
    this.panel.paddingLeft = "10px";
    this.panel.background = "#2a2a2a";
    
    this.guiTexture.addControl(this.panel);
    
    // Create sections
    this.createPrimitiveSection();
    this.createLightSection();
    this.createModelSection();
    
    console.log('ObjectPalette initialized');
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
