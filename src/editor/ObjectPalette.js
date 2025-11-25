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
    
    const button = this.createButton("Load Model", () => {
      this.openModelSelector();
    });
    this.panel.addControl(button);
  }
  
  async openModelSelector() {
    try {
      // Fetch list of models from the models directory
      const response = await fetch('http://localhost:3001/api/list-models');
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      const models = result.models;
      
      if (models.length === 0) {
        alert('No models found in the /models directory.\nPlace your .gltf or .glb files there.');
        return;
      }
      
      // Create a simple selection dialog
      this.showModelSelectionDialog(models);
      
    } catch (error) {
      console.error('Failed to list models:', error);
      alert(`Failed to load models list: ${error.message}\nMake sure the server is running.`);
    }
  }
  
  showModelSelectionDialog(models) {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #2a2a2a;
      padding: 20px;
      border-radius: 8px;
      max-width: 400px;
      max-height: 500px;
      overflow-y: auto;
      color: white;
      font-family: Arial, sans-serif;
    `;
    
    // Title
    const title = document.createElement('h3');
    title.textContent = 'Select Model';
    title.style.cssText = 'margin-top: 0; color: #4a9eff;';
    dialog.appendChild(title);
    
    // Model list
    models.forEach(modelName => {
      const button = document.createElement('button');
      button.textContent = modelName;
      button.style.cssText = `
        display: block;
        width: 100%;
        padding: 10px;
        margin: 5px 0;
        background: #3a3a3a;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
      `;
      
      button.onmouseenter = () => button.style.background = '#4a4a4a';
      button.onmouseleave = () => button.style.background = '#3a3a3a';
      
      button.onclick = async () => {
        document.body.removeChild(overlay);
        await this.loadModelFromServer(modelName);
      };
      
      dialog.appendChild(button);
    });
    
    // Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      display: block;
      width: 100%;
      padding: 10px;
      margin-top: 15px;
      background: #555;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    `;
    cancelBtn.onclick = () => document.body.removeChild(overlay);
    dialog.appendChild(cancelBtn);
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }
  
  async loadModelFromServer(modelName) {
    try {
      console.log(`Loading model: ${modelName}`);
      
      // Load model from server
      const modelPath = `/models/${modelName}`;
      const rootMesh = await this.editor.objectFactory.importGLTF(modelPath, modelName);
      
      if (rootMesh) {
        this.editor.selectionManager.selectObject(rootMesh);
        if (this.editor.sceneHierarchy) {
          this.editor.sceneHierarchy.refresh();
        }
        console.log('Model loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load model:', error);
      alert(`Failed to load model: ${error.message}`);
    }
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
