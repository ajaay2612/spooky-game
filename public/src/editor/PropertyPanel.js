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
    
    // Gizmo state
    this.activeGizmoMode = null; // 'move', 'rotate', or 'scale'
    this.uniformScaling = true; // Aspect ratio lock for scale
    this.moveButton = null;
    this.rotateButton = null;
    this.scaleButton = null;
    this.uniformScaleCheckbox = null;
    
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
    
    // Block pointer events from reaching the canvas
    scrollViewer.isPointerBlocker = true;
    
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
    labelText.height = "25px";
    labelText.color = "white";
    labelText.fontSize = 12;
    labelText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    labelText.paddingLeft = "5px";
    this.panel.addControl(labelText);
    
    // Create color picker
    const colorPicker = new BABYLON.GUI.ColorPicker();
    colorPicker.value = initialColor;
    colorPicker.height = "180px";
    colorPicker.width = "180px";
    colorPicker.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    
    colorPicker.onValueChangedObservable.add((value) => {
      initialColor.r = value.r;
      initialColor.g = value.g;
      initialColor.b = value.b;
      onChange(initialColor);
    });
    
    this.panel.addControl(colorPicker);
    
    // Add spacer after color picker
    const spacer = new BABYLON.GUI.Container();
    spacer.height = "10px";
    this.panel.addControl(spacer);
  }
  
  createLightSection(object) {
    // Add gizmo controls for lights with position
    if (object.position) {
      this.addSectionHeader("Transform Gizmos");
      this.createLightGizmoButtons(object);
      
      // Add spacer
      const spacer = new BABYLON.GUI.Container();
      spacer.height = "10px";
      this.panel.addControl(spacer);
    }
    
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
    
    // Position controls (for lights that have position)
    if (object.position) {
      this.addSectionHeader("Position");
      this.addVector3Control("X", object.position.x, (value) => { object.position.x = value; });
      this.addVector3Control("Y", object.position.y, (value) => { object.position.y = value; });
      this.addVector3Control("Z", object.position.z, (value) => { object.position.z = value; });
    }
    
    // Direction controls (for directional/spot lights)
    if (object.direction) {
      this.addSectionHeader("Direction");
      this.addVector3Control("X", object.direction.x, (value) => { object.direction.x = value; object.direction.normalize(); });
      this.addVector3Control("Y", object.direction.y, (value) => { object.direction.y = value; object.direction.normalize(); });
      this.addVector3Control("Z", object.direction.z, (value) => { object.direction.z = value; object.direction.normalize(); });
    }
    
    // Range control (for point lights)
    if (object.range !== undefined) {
      this.addSectionHeader("Range");
      
      const rangeContainer = new BABYLON.GUI.StackPanel();
      rangeContainer.height = "40px";
      rangeContainer.isVertical = false;
      
      const rangeLabel = new BABYLON.GUI.TextBlock();
      rangeLabel.text = "Range:";
      rangeLabel.width = "80px";
      rangeLabel.color = "white";
      rangeLabel.fontSize = 12;
      rangeContainer.addControl(rangeLabel);
      
      const rangeSlider = new BABYLON.GUI.Slider();
      rangeSlider.minimum = 1;
      rangeSlider.maximum = 50;
      rangeSlider.value = object.range;
      rangeSlider.height = "20px";
      rangeSlider.width = "150px";
      rangeSlider.color = "#4a9eff";
      rangeSlider.background = "#3a3a3a";
      
      rangeSlider.onValueChangedObservable.add((value) => {
        object.range = value;
      });
      
      rangeContainer.addControl(rangeSlider);
      
      const rangeValue = new BABYLON.GUI.TextBlock();
      rangeValue.text = object.range.toFixed(1);
      rangeValue.width = "50px";
      rangeValue.color = "white";
      rangeValue.fontSize = 12;
      rangeContainer.addControl(rangeValue);
      
      rangeSlider.onValueChangedObservable.add((value) => {
        rangeValue.text = value.toFixed(1);
      });
      
      this.panel.addControl(rangeContainer);
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
    // Gizmo controls section
    this.addSectionHeader("Transform Gizmos");
    this.createGizmoButtons(object);
    
    // Add spacer
    const spacer = new BABYLON.GUI.Container();
    spacer.height = "10px";
    this.panel.addControl(spacer);
    
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
  
  createLightGizmoButtons(object) {
    // Create button container
    const buttonContainer = new BABYLON.GUI.StackPanel();
    buttonContainer.height = "40px";
    buttonContainer.isVertical = false;
    buttonContainer.paddingLeft = "5px";
    
    // Move button
    this.moveButton = BABYLON.GUI.Button.CreateSimpleButton("moveGizmo", "Move");
    this.moveButton.width = "90px";
    this.moveButton.height = "35px";
    this.moveButton.color = "white";
    this.moveButton.background = "#3a3a3a";
    this.moveButton.fontSize = 13;
    this.moveButton.cornerRadius = 4;
    this.moveButton.paddingRight = "3px";
    
    this.moveButton.onPointerClickObservable.add(() => {
      this.toggleLightGizmoMode('move', object);
    });
    
    buttonContainer.addControl(this.moveButton);
    
    // Scale button
    this.scaleButton = BABYLON.GUI.Button.CreateSimpleButton("scaleGizmo", "Scale");
    this.scaleButton.width = "90px";
    this.scaleButton.height = "35px";
    this.scaleButton.color = "white";
    this.scaleButton.background = "#3a3a3a";
    this.scaleButton.fontSize = 13;
    this.scaleButton.cornerRadius = 4;
    
    this.scaleButton.onPointerClickObservable.add(() => {
      this.toggleLightGizmoMode('scale', object);
    });
    
    buttonContainer.addControl(this.scaleButton);
    
    this.panel.addControl(buttonContainer);
    
    // Update button state
    this.updateGizmoButtonStates();
  }
  
  createGizmoButtons(object) {
    // Create button container
    const buttonContainer = new BABYLON.GUI.StackPanel();
    buttonContainer.height = "40px";
    buttonContainer.isVertical = false;
    buttonContainer.paddingLeft = "5px";
    
    // Move button
    this.moveButton = BABYLON.GUI.Button.CreateSimpleButton("moveGizmo", "Move");
    this.moveButton.width = "90px";
    this.moveButton.height = "35px";
    this.moveButton.color = "white";
    this.moveButton.background = "#3a3a3a";
    this.moveButton.fontSize = 13;
    this.moveButton.cornerRadius = 4;
    this.moveButton.paddingRight = "3px";
    
    this.moveButton.onPointerClickObservable.add(() => {
      this.toggleGizmoMode('move');
    });
    
    buttonContainer.addControl(this.moveButton);
    
    // Rotate button
    this.rotateButton = BABYLON.GUI.Button.CreateSimpleButton("rotateGizmo", "Rotate");
    this.rotateButton.width = "90px";
    this.rotateButton.height = "35px";
    this.rotateButton.color = "white";
    this.rotateButton.background = "#3a3a3a";
    this.rotateButton.fontSize = 13;
    this.rotateButton.cornerRadius = 4;
    this.rotateButton.paddingLeft = "3px";
    this.rotateButton.paddingRight = "3px";
    
    this.rotateButton.onPointerClickObservable.add(() => {
      this.toggleGizmoMode('rotate');
    });
    
    buttonContainer.addControl(this.rotateButton);
    
    // Scale button
    this.scaleButton = BABYLON.GUI.Button.CreateSimpleButton("scaleGizmo", "Scale");
    this.scaleButton.width = "90px";
    this.scaleButton.height = "35px";
    this.scaleButton.color = "white";
    this.scaleButton.background = "#3a3a3a";
    this.scaleButton.fontSize = 13;
    this.scaleButton.cornerRadius = 4;
    this.scaleButton.paddingLeft = "3px";
    
    this.scaleButton.onPointerClickObservable.add(() => {
      this.toggleGizmoMode('scale');
    });
    
    buttonContainer.addControl(this.scaleButton);
    
    this.panel.addControl(buttonContainer);
    
    // Uniform scaling checkbox (only visible when scale is active)
    const checkboxContainer = new BABYLON.GUI.StackPanel();
    checkboxContainer.height = "30px";
    checkboxContainer.isVertical = false;
    checkboxContainer.paddingLeft = "5px";
    checkboxContainer.paddingTop = "5px";
    
    const checkbox = new BABYLON.GUI.Checkbox();
    checkbox.name = "uniformScale";
    checkbox.width = "20px";
    checkbox.height = "20px";
    checkbox.isChecked = this.uniformScaling;
    checkbox.color = "#4a9eff";
    checkbox.background = "#3a3a3a";
    
    checkbox.onIsCheckedChangedObservable.add((value) => {
      this.uniformScaling = value;
      this.editor.updateScaleGizmoUniformMode(value);
    });
    
    checkboxContainer.addControl(checkbox);
    
    const checkboxLabel = new BABYLON.GUI.TextBlock();
    checkboxLabel.text = " Lock Aspect Ratio";
    checkboxLabel.width = "150px";
    checkboxLabel.height = "20px";
    checkboxLabel.color = "white";
    checkboxLabel.fontSize = 12;
    checkboxLabel.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    checkboxLabel.paddingLeft = "5px";
    
    checkboxContainer.addControl(checkboxLabel);
    
    this.panel.addControl(checkboxContainer);
    this.uniformScaleCheckbox = checkboxContainer;
    
    // Update button states
    this.updateGizmoButtonStates();
  }
  
  toggleLightGizmoMode(mode, light) {
    if (this.activeGizmoMode === mode) {
      // Turn off if already active
      this.activeGizmoMode = null;
      this.editor.setLightGizmoMode(null, light);
    } else {
      // Turn on new mode
      this.activeGizmoMode = mode;
      this.editor.setLightGizmoMode(mode, light);
    }
    
    this.updateGizmoButtonStates();
  }
  
  toggleGizmoMode(mode) {
    if (this.activeGizmoMode === mode) {
      // Turn off if already active
      this.activeGizmoMode = null;
      this.editor.setGizmoMode(null);
    } else {
      // Turn on new mode
      this.activeGizmoMode = mode;
      this.editor.setGizmoMode(mode);
    }
    
    this.updateGizmoButtonStates();
  }
  
  updateGizmoButtonStates() {
    // Update Move button
    if (this.moveButton) {
      if (this.activeGizmoMode === 'move') {
        this.moveButton.background = "#4a9eff";
      } else {
        this.moveButton.background = "#3a3a3a";
      }
    }
    
    // Update Rotate button
    if (this.rotateButton) {
      if (this.activeGizmoMode === 'rotate') {
        this.rotateButton.background = "#4a9eff";
      } else {
        this.rotateButton.background = "#3a3a3a";
      }
    }
    
    // Update Scale button
    if (this.scaleButton) {
      if (this.activeGizmoMode === 'scale') {
        this.scaleButton.background = "#4a9eff";
      } else {
        this.scaleButton.background = "#3a3a3a";
      }
    }
    
    // Show/hide uniform scaling checkbox
    if (this.uniformScaleCheckbox) {
      this.uniformScaleCheckbox.isVisible = (this.activeGizmoMode === 'scale');
    }
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
