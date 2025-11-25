// SettingsPanel.js
// UI component for controlling post-processing settings

export class SettingsPanel {
  constructor(guiTexture, pipeline) {
    this.guiTexture = guiTexture;
    this.pipeline = pipeline;
    this.panel = null;
    this.scrollViewer = null;
    this.isVisible = false;
    this.toggleButton = null;
    
    this.initialize();
  }
  
  initialize() {
    // Create toggle button (top right, below FPS)
    this.toggleButton = BABYLON.GUI.Button.CreateSimpleButton("settingsToggle", "⚙ Settings");
    this.toggleButton.width = "100px";
    this.toggleButton.height = "30px";
    this.toggleButton.color = "white";
    this.toggleButton.background = "#2a2a2a";
    this.toggleButton.fontSize = 14;
    this.toggleButton.cornerRadius = 4;
    this.toggleButton.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.toggleButton.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.toggleButton.top = "50px";
    this.toggleButton.left = "-10px";
    
    this.toggleButton.onPointerClickObservable.add(() => {
      this.toggle();
    });
    
    this.guiTexture.addControl(this.toggleButton);
    
    // Create scroll viewer container
    this.scrollViewer = new BABYLON.GUI.ScrollViewer();
    this.scrollViewer.width = "320px";
    this.scrollViewer.height = "500px";
    this.scrollViewer.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    this.scrollViewer.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.scrollViewer.top = "90px";
    this.scrollViewer.left = "-10px";
    this.scrollViewer.background = "#2a2a2a";
    this.scrollViewer.thickness = 2;
    this.scrollViewer.barColor = "#4a9eff";
    this.scrollViewer.barBackground = "#1a1a1a";
    this.scrollViewer.isVisible = false;
    this.scrollViewer.isPointerBlocker = true;
    
    this.guiTexture.addControl(this.scrollViewer);
    
    // Create main panel inside scroll viewer
    this.panel = new BABYLON.GUI.StackPanel();
    this.panel.width = "300px";
    
    this.scrollViewer.addControl(this.panel);
    
    this.createControls();
    
    console.log('SettingsPanel initialized');
  }
  
  createControls() {
    // Header
    const header = this.createHeader("Post-Processing Settings");
    this.panel.addControl(header);
    
    // Antialiasing
    this.addCheckbox("FXAA Antialiasing", this.pipeline.fxaaEnabled, (value) => {
      this.pipeline.fxaaEnabled = value;
    });
    
    // Bloom section
    this.addSectionHeader("Bloom");
    this.addCheckbox("Enable Bloom", this.pipeline.bloomEnabled, (value) => {
      this.pipeline.bloomEnabled = value;
    });
    this.addSlider("Bloom Threshold", this.pipeline.bloomThreshold, 0, 1, (value) => {
      this.pipeline.bloomThreshold = value;
    });
    this.addSlider("Bloom Weight", this.pipeline.bloomWeight, 0, 1, (value) => {
      this.pipeline.bloomWeight = value;
    });
    this.addSlider("Bloom Scale", this.pipeline.bloomScale, 0, 1, (value) => {
      this.pipeline.bloomScale = value;
    });
    
    // Image Processing section
    this.addSectionHeader("Image Processing");
    this.addSlider("Contrast", this.pipeline.imageProcessing.contrast, 0.5, 2, (value) => {
      this.pipeline.imageProcessing.contrast = value;
    });
    this.addSlider("Exposure", this.pipeline.imageProcessing.exposure, 0.5, 2, (value) => {
      this.pipeline.imageProcessing.exposure = value;
    });
    
    // Vignette section
    this.addSectionHeader("Vignette");
    this.addCheckbox("Enable Vignette", this.pipeline.imageProcessing.vignetteEnabled, (value) => {
      this.pipeline.imageProcessing.vignetteEnabled = value;
    });
    this.addSlider("Vignette Weight", this.pipeline.imageProcessing.vignetteWeight, 0, 4, (value) => {
      this.pipeline.imageProcessing.vignetteWeight = value;
    });
    
    // Chromatic Aberration section
    this.addSectionHeader("Chromatic Aberration");
    this.addCheckbox("Enable Chromatic Aberration", this.pipeline.chromaticAberrationEnabled, (value) => {
      this.pipeline.chromaticAberrationEnabled = value;
    });
    this.addSlider("Aberration Amount", this.pipeline.chromaticAberration.aberrationAmount, 0, 100, (value) => {
      this.pipeline.chromaticAberration.aberrationAmount = value;
    });
    
    // Grain section
    this.addSectionHeader("Film Grain");
    this.addCheckbox("Enable Grain", this.pipeline.grainEnabled, (value) => {
      this.pipeline.grainEnabled = value;
    });
    this.addSlider("Grain Intensity", this.pipeline.grain.intensity, 0, 50, (value) => {
      this.pipeline.grain.intensity = value;
    });
    this.addCheckbox("Animated Grain", this.pipeline.grain.animated, (value) => {
      this.pipeline.grain.animated = value;
    });
    
    // Sharpen section
    this.addSectionHeader("Sharpen");
    this.addCheckbox("Enable Sharpen", this.pipeline.sharpenEnabled, (value) => {
      this.pipeline.sharpenEnabled = value;
    });
    this.addSlider("Edge Amount", this.pipeline.sharpen.edgeAmount, 0, 1, (value) => {
      this.pipeline.sharpen.edgeAmount = value;
    });
    this.addSlider("Color Amount", this.pipeline.sharpen.colorAmount, 0, 1, (value) => {
      this.pipeline.sharpen.colorAmount = value;
    });
  }
  
  createHeader(text) {
    const header = new BABYLON.GUI.TextBlock();
    header.text = text;
    header.height = "40px";
    header.color = "#4a9eff";
    header.fontSize = 18;
    header.fontWeight = "bold";
    header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    header.paddingLeft = "10px";
    return header;
  }
  
  addSectionHeader(text) {
    const header = new BABYLON.GUI.TextBlock();
    header.text = text;
    header.height = "30px";
    header.color = "white";
    header.fontSize = 14;
    header.fontWeight = "bold";
    header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    header.paddingLeft = "10px";
    header.paddingTop = "10px";
    this.panel.addControl(header);
  }
  
  addCheckbox(label, initialValue, onChange) {
    const container = new BABYLON.GUI.StackPanel();
    container.height = "30px";
    container.isVertical = false;
    container.paddingLeft = "10px";
    
    const checkbox = new BABYLON.GUI.Checkbox();
    checkbox.width = "20px";
    checkbox.height = "20px";
    checkbox.isChecked = initialValue;
    checkbox.color = "#4a9eff";
    checkbox.background = "#3a3a3a";
    
    checkbox.onIsCheckedChangedObservable.add((value) => {
      onChange(value);
    });
    
    const labelText = new BABYLON.GUI.TextBlock();
    labelText.text = label;
    labelText.width = "250px";
    labelText.height = "20px";
    labelText.color = "white";
    labelText.fontSize = 12;
    labelText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    labelText.paddingLeft = "10px";
    
    container.addControl(checkbox);
    container.addControl(labelText);
    this.panel.addControl(container);
  }
  
  addSlider(label, initialValue, min, max, onChange) {
    const labelText = new BABYLON.GUI.TextBlock();
    labelText.text = `${label}: ${initialValue.toFixed(2)}`;
    labelText.height = "25px";
    labelText.color = "white";
    labelText.fontSize = 12;
    labelText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
    labelText.paddingLeft = "10px";
    this.panel.addControl(labelText);
    
    const slider = new BABYLON.GUI.Slider();
    slider.minimum = min;
    slider.maximum = max;
    slider.value = initialValue;
    slider.height = "20px";
    slider.width = "280px";
    slider.color = "#4a9eff";
    slider.background = "#3a3a3a";
    slider.borderColor = "#4a9eff";
    
    slider.onValueChangedObservable.add((value) => {
      labelText.text = `${label}: ${value.toFixed(2)}`;
      onChange(value);
    });
    
    this.panel.addControl(slider);
    
    // Add spacer
    const spacer = new BABYLON.GUI.Container();
    spacer.height = "5px";
    this.panel.addControl(spacer);
  }
  
  toggle() {
    this.isVisible = !this.isVisible;
    this.scrollViewer.isVisible = this.isVisible;
    
    if (this.isVisible) {
      this.toggleButton.background = "#4a9eff";
    } else {
      this.toggleButton.background = "#2a2a2a";
    }
  }
  
  show() {
    this.isVisible = true;
    this.scrollViewer.isVisible = true;
    this.toggleButton.background = "#4a9eff";
  }
  
  hide() {
    this.isVisible = false;
    this.scrollViewer.isVisible = false;
    this.toggleButton.background = "#2a2a2a";
  }
  
  refresh() {
    // Recreate all controls with current pipeline values
    this.panel.clearControls();
    this.createControls();
    console.log('Settings panel refreshed with loaded values');
  }
}
