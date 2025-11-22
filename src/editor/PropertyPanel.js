// PropertyPanel.js
// UI component for editing object properties

export class PropertyPanel {
  constructor(editorManager, guiTexture) {
    this.editor = editorManager;
    this.guiTexture = guiTexture;
    this.panel = null;
    this.currentObject = null;
    this.propertyControls = [];
    this.isVisible = false;
    
    this.initialize();
  }
  
  initialize() {
    // Create main panel container with scrolling
    const scrollViewer = new BABYLON.GUI.ScrollViewer();
    scrollViewer.width = "320px";
    scrollViewer.height = "600px";
    scrollViewer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    scrollViewer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    scrollViewer.paddingTop = "10px";
    scrollViewer.paddingRight = "10px";
    scrollViewer.background = "#2a2a2a";
    scrollViewer.thickness = 2;
    scrollViewer.color = "#4a9eff";
    scrollViewer.isVisible = false;
    
    this.guiTexture.addControl(scrollViewer);
    
    // Create main panel inside scroll viewer
    this.panel = new BABYLON.GUI.StackPanel();
    this.panel.width = "300px";
    this.panel.background = "#2a2a2a";
    
    scrollViewer.addControl(this.panel);
    this.scrollViewer = scrollViewer;
    
    // Listen for selection changes
    this.editor.selectionManager.addSelectionCallback((object) => {
      this.updateForObject(object);
    });
    
    console.log('PropertyPanel initialized');
  }
  
  updateForObject(object) {
    console.log('PropertyPanel.updateForObject called with:', object ? object.name : 'null');
    this.clearControls();
    this.currentObject = object;
    
    if (!object) {
      this.scrollViewer.isVisible = false;
      console.log('PropertyPanel hidden - no object selected');
      return;
    }
    
    console.log('PropertyPanel showing for object:', object.name);
    
    this.scrollViewer.isVisible = true;
    
    // Create header with object name
    this.createHeader(object);
    
    // Create property sections based on object type
    if (object instanceof BABYLON.Mesh) {
      this.createTransformSection(object);
      this.createMaterialSection(object);
    } else if (object instanceof BABYLON.Light) {
      this.createLightSection(object);
    }
    
    // Add delete button
    this.createDeleteButton();
  }
  
  clearControls() {
    if (this.panel) {
      this.panel.clearControls();
    }
    this.propertyControls = [];
  }
  
  createHeader(object) {
    const header = new BABYLON.GUI.TextBlock();
    header.text = `Object: ${object.name}`;
    header.height = "40px";
    header.color = "#4a9eff";
    header.fontSize = 18;
    header.fontWeight = "bold";
    header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    header.paddingLeft = "5px";
    this.panel.addControl(header);
    
    // Add name input for renaming
    const nameInput = new BABYLON.GUI.InputText();
    nameInput.width = "280px";
    nameInput.height = "30px";
    nameInput.color = "white";
    nameInput.background = "#3a3a3a";
    nameInput.text = object.name;
    nameInput.fontSize = 14;
    
    nameInput.onTextChangedObservable.add((control) => {
      const newName = control.text.trim();
      if (newName && newName !== object.name) {
        // Check for duplicates and append suffix if needed
        let finalName = newName;
        let counter = 1;
        while (this.editor.scene.getMeshByName(finalName) || this.editor.scene.getLightByName(finalName)) {
          finalName = `${newName}_${counter}`;
          counter++;
        }
        
        object.name = finalName;
        header.text = `Object: ${finalName}`;
        control.text = finalName;
        
        // Update hierarchy
        if (this.editor.sceneHierarchy) {
          this.editor.sceneHierarchy.refresh();
        }
      }
    });
    
    this.panel.addControl(nameInput);
    
    // Add spacer
    const spacer = new BABYLON.GUI.Container();
    spacer.height = "10px";
    this.panel.addControl(spacer);
  }
  
  createMaterialSection(object) {
    if (!object.material) return;
    
    this.addSectionHeader("Material");
    
    const material = object.material;
    
    // Diffuse color
    if (material.diffuseColor) {
      this.addColorControl("Diffuse", material.diffuseColor, (color) => {
        material.diffuseColor = color;
      });
    }
    
    // Specular color
    if (material.specularColor) {
      this.addColorControl("Specular", material.specularColor, (color) => {
        material.specularColor = color;
      });
    }
    
    // Emissive color
    if (material.emissiveColor) {
      this.addColorControl("Emissive", material.emissiveColor, (color) => {
        material.emissiveColor = color;
      });
    }
  }
  
  addColorControl(label, initialColor, onChange) {
    const labelText = new BABYLON.GUI.TextBlock();
    labelText.text = label + " Color:";
    labelText.height = "20px";
    labelText.color = "white";
    labelText.fontSize = 12;
    labelText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    labelText.paddingLeft = "5px";
    this.panel.addControl(labelText);
    
    // RGB sliders
    ['r', 'g', 'b'].forEach(component => {
      const container = new BABYLON.GUI.StackPanel();
      container.height = "30px";
      container.isVertical = false;
      
      const compLabel = new BABYLON.GUI.TextBlock();
      compLabel.text = component.toUpperCase() + ":";
      compLabel.width = "30px";
      compLabel.color = "white";
      compLabel.fontSize = 11;
      container.addControl(compLabel);
      
      const slider = new BABYLON.GUI.Slider();
      slider.minimum = 0;
      slider.maximum = 1;
      slider.value = initialColor[component];
      slider.height = "20px";
      slider.width = "200px";
      slider.color = "#4a9eff";
      slider.background = "#3a3a3a";
      
      slider.onValueChangedObservable.add((value) => {
        initialColor[component] = value;
        onChange(initialColor);
      });
      
      container.addControl(slider);
      
      const valueText = new BABYLON.GUI.TextBlock();
      valueText.text = initialColor[component].toFixed(2);
      valueText.width = "40px";
      valueText.color = "white";
      valueText.fontSize = 11;
      container.addControl(valueText);
      
      slider.onValueChangedObservable.add((value) => {
        valueText.text = value.toFixed(2);
      });
      
      this.panel.addControl(container);
    });
  }
  
  createLightSection(object) {
    this.addSectionHeader("Light Properties");
    
    // Intensity slider
    const intensityContainer = new BABYLON.GUI.StackPanel();
    intensityContainer.height = "40px";
    intensityContainer.isVertical = false;
    
    const intensityLabel = new BABYLON.GUI.TextBlock();
    intensityLabel.text = "Intensity:";
    intensityLabel.width = "80px";
    intensityLabel.color = "white";
    intensityLabel.fontSize = 12;
    intensityContainer.addControl(intensityLabel);
    
    const intensitySlider = new BABYLON.GUI.Slider();
    intensitySlider.minimum = 0;
    intensitySlider.maximum = 10;
    intensitySlider.value = object.intensity;
    intensitySlider.height = "20px";
    intensitySlider.width = "150px";
    intensitySlider.color = "#4a9eff";
    intensitySlider.background = "#3a3a3a";
    
    intensitySlider.onValueChangedObservable.add((value) => {
      object.intensity = value;
    });
    
    intensityContainer.addControl(intensitySlider);
    
    const intensityValue = new BABYLON.GUI.TextBlock();
    intensityValue.text = object.intensity.toFixed(2);
    intensityValue.width = "50px";
    intensityValue.color = "white";
    intensityValue.fontSize = 12;
    intensityContainer.addControl(intensityValue);
    
    intensitySlider.onValueChangedObservable.add((value) => {
      intensityValue.text = value.toFixed(2);
    });
    
    this.panel.addControl(intensityContainer);
    
    // Light color
    if (object.diffuse) {
      this.addColorControl("Light", object.diffuse, (color) => {
        object.diffuse = color;
      });
    }
  }
  
  createDeleteButton() {
    // Add spacer before delete button
    const spacer = new BABYLON.GUI.Container();
    spacer.height = "20px";
    this.panel.addControl(spacer);
    
    const deleteButton = BABYLON.GUI.Button.CreateSimpleButton("deleteBtn", "Delete Object");
    deleteButton.width = "280px";
    deleteButton.height = "35px";
    deleteButton.color = "white";
    deleteButton.background = "#cc0000";
    deleteButton.fontSize = 14;
    deleteButton.cornerRadius = 4;
    
    deleteButton.onPointerEnterObservable.add(() => {
      deleteButton.background = "#ff0000";
    });
    
    deleteButton.onPointerOutObservable.add(() => {
      deleteButton.background = "#cc0000";
    });
    
    deleteButton.onPointerClickObservable.add(() => {
      this.editor.deleteSelected();
    });
    
    this.panel.addControl(deleteButton);
  }
  
  show() {
    if (this.currentObject && this.scrollViewer) {
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

  createTransformSection(object) {
    // Position section
    this.addSectionHeader("Position");
    this.addVector3Control("X", object.position.x, (value) => { object.position.x = value; });
    this.addVector3Control("Y", object.position.y, (value) => { object.position.y = value; });
    this.addVector3Control("Z", object.position.z, (value) => { object.position.z = value; });
    
    // Rotation section (convert to degrees)
    this.addSectionHeader("Rotation");
    this.addVector3Control("X", object.rotation.x * 180 / Math.PI, (value) => { object.rotation.x = value * Math.PI / 180; });
    this.addVector3Control("Y", object.rotation.y * 180 / Math.PI, (value) => { object.rotation.y = value * Math.PI / 180; });
    this.addVector3Control("Z", object.rotation.z * 180 / Math.PI, (value) => { object.rotation.z = value * Math.PI / 180; });
    
    // Scale section
    this.addSectionHeader("Scale");
    this.addVector3Control("X", object.scaling.x, (value) => { object.scaling.x = value; });
    this.addVector3Control("Y", object.scaling.y, (value) => { object.scaling.y = value; });
    this.addVector3Control("Z", object.scaling.z, (value) => { object.scaling.z = value; });
  }
  
  addSectionHeader(text) {
    const header = new BABYLON.GUI.TextBlock();
    header.text = text;
    header.height = "25px";
    header.color = "white";
    header.fontSize = 14;
    header.fontWeight = "bold";
    header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    header.paddingLeft = "5px";
    this.panel.addControl(header);
  }
  
  addVector3Control(label, initialValue, onChange) {
    const container = new BABYLON.GUI.StackPanel();
    container.height = "30px";
    container.isVertical = false;
    
    const labelText = new BABYLON.GUI.TextBlock();
    labelText.text = label + ":";
    labelText.width = "30px";
    labelText.color = "white";
    labelText.fontSize = 12;
    labelText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    container.addControl(labelText);
    
    const input = new BABYLON.GUI.InputText();
    input.width = "240px";
    input.height = "25px";
    input.color = "white";
    input.background = "#3a3a3a";
    input.text = initialValue.toFixed(2);
    input.fontSize = 12;
    
    input.onTextChangedObservable.add((control) => {
      const value = parseFloat(control.text);
      if (!isNaN(value)) {
        onChange(value);
      }
    });
    
    container.addControl(input);
    this.panel.addControl(container);
  }
}
