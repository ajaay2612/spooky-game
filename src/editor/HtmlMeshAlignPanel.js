// HtmlMeshAlignPanel.js
// Debug panel for aligning HtmlMesh to monitor screen

export class HtmlMeshAlignPanel {
  constructor(scene, guiTexture) {
    this.scene = scene;
    this.guiTexture = guiTexture;
    this.panel = null;
    this.isVisible = false;
    this.monitorMesh = null;
    this.helperBox = null;
    
    this.initialize();
  }
  
  initialize() {
    // Create panel container
    this.panel = new BABYLON.GUI.StackPanel();
    this.panel.width = "300px";
    this.panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
    this.panel.top = "10px";
    this.panel.background = "#1a1a1a";
    this.panel.isVisible = false;
    this.panel.isPointerBlocker = true;
    
    this.guiTexture.addControl(this.panel);
    
    // Add header
    const header = new BABYLON.GUI.TextBlock();
    header.text = "HtmlMesh Alignment";
    header.height = "40px";
    header.color = "#00ff00";
    header.fontSize = 18;
    header.fontWeight = "bold";
    this.panel.addControl(header);
    
    // Add buttons
    this.addButton("🔍 Find Monitor Mesh", () => this.findMonitorMesh());
    this.addButton("📍 Align to Monitor", () => this.alignToMonitor());
    this.addButton("📋 Copy Position", () => this.copyTransform('position'));
    this.addButton("📋 Copy Rotation", () => this.copyTransform('rotation'));
    this.addButton("📋 Copy Scaling", () => this.copyTransform('scaling'));
    this.addButton("📋 Copy All", () => this.copyTransform('all'));
    this.addButton("❌ Close", () => this.hide());
    
    // Add status text
    this.statusText = new BABYLON.GUI.TextBlock();
    this.statusText.height = "100px";
    this.statusText.color = "white";
    this.statusText.fontSize = 12;
    this.statusText.textWrapping = true;
    this.statusText.paddingTop = "10px";
    this.statusText.paddingLeft = "10px";
    this.statusText.paddingRight = "10px";
    this.panel.addControl(this.statusText);
    
    console.log('HtmlMeshAlignPanel initialized');
  }
  
  addButton(text, onClick) {
    const button = BABYLON.GUI.Button.CreateSimpleButton(`align_${Date.now()}`, text);
    button.width = "280px";
    button.height = "35px";
    button.color = "white";
    button.background = "#00ff00";
    button.fontSize = 14;
    button.cornerRadius = 4;
    button.thickness = 0;
    button.paddingTop = "5px";
    
    button.onPointerEnterObservable.add(() => {
      button.background = "#00cc00";
    });
    
    button.onPointerOutObservable.add(() => {
      button.background = "#00ff00";
    });
    
    button.onPointerClickObservable.add(onClick);
    
    this.panel.addControl(button);
  }
  
  findMonitorMesh() {
    this.monitorMesh = this.scene.getMeshByName('SM_Prop_ComputerMonitor_A_29_screen_mesh');
    
    if (this.monitorMesh) {
      this.monitorMesh.computeWorldMatrix(true);
      const pos = this.monitorMesh.getAbsolutePosition();
      
      this.setStatus('success', 
        `✅ Monitor mesh found!\n` +
        `Position: (${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)})\n` +
        `Rotation: (${this.monitorMesh.rotation.x.toFixed(3)}, ${this.monitorMesh.rotation.y.toFixed(3)}, ${this.monitorMesh.rotation.z.toFixed(3)})`
      );
      
      console.log('✓ Monitor mesh found:', this.monitorMesh.name);
      console.log('  Position:', pos);
    } else {
      const meshNames = this.scene.meshes.map(m => m.name).join(', ');
      this.setStatus('error', 
        `❌ Monitor mesh not found!\n` +
        `Available meshes: ${meshNames.substring(0, 100)}...`
      );
      console.error('Monitor mesh not found');
    }
  }
  
  alignToMonitor() {
    if (!this.monitorMesh) {
      this.setStatus('error', '❌ Find monitor mesh first!');
      return;
    }
    
    this.helperBox = this.scene.getMeshByName('HtmlMesh_Helper');
    
    if (!this.helperBox) {
      this.setStatus('error', '❌ HtmlMesh_Helper not found!\nMake sure HtmlMeshMonitor is initialized.');
      return;
    }
    
    // Force world matrix computation for entire hierarchy
    if (this.monitorMesh.parent) {
      this.monitorMesh.parent.computeWorldMatrix(true);
    }
    this.monitorMesh.computeWorldMatrix(true);
    
    // Get the actual world matrix
    const worldMatrix = this.monitorMesh.getWorldMatrix();
    
    // Extract position from world matrix
    const worldPos = new BABYLON.Vector3();
    worldMatrix.decompose(null, null, worldPos);
    
    // Extract rotation from world matrix
    const worldRot = new BABYLON.Quaternion();
    const worldScale = new BABYLON.Vector3();
    worldMatrix.decompose(worldScale, worldRot, null);
    
    // Copy world position
    this.helperBox.position.copyFrom(worldPos);
    
    // Copy world rotation (convert quaternion to euler)
    this.helperBox.rotationQuaternion = worldRot.clone();
    
    // Copy world scale
    this.helperBox.scaling.copyFrom(worldScale);
    
    // Log detailed info for debugging
    console.log('Monitor mesh hierarchy:');
    console.log('  Parent:', this.monitorMesh.parent?.name);
    console.log('  Local position:', this.monitorMesh.position);
    console.log('  World position:', worldPos);
    console.log('  Local rotation:', this.monitorMesh.rotation);
    console.log('  World rotation (quat):', worldRot);
    console.log('  Local scaling:', this.monitorMesh.scaling);
    console.log('  World scaling:', worldScale);
    
    this.setStatus('success', 
      `✅ Aligned!\n` +
      `Position: (${this.helperBox.position.x.toFixed(3)}, ${this.helperBox.position.y.toFixed(3)}, ${this.helperBox.position.z.toFixed(3)})\n` +
      `Rotation: (${this.helperBox.rotation.x.toFixed(3)}, ${this.helperBox.rotation.y.toFixed(3)}, ${this.helperBox.rotation.z.toFixed(3)})`
    );
    
    console.log('✓ HtmlMesh aligned to monitor');
  }
  
  copyTransform(type) {
    this.helperBox = this.scene.getMeshByName('HtmlMesh_Helper');
    
    if (!this.helperBox) {
      this.setStatus('error', '❌ HtmlMesh_Helper not found!');
      return;
    }
    
    let textToCopy = '';
    
    switch(type) {
      case 'position':
        textToCopy = `new BABYLON.Vector3(${this.helperBox.position.x}, ${this.helperBox.position.y}, ${this.helperBox.position.z})`;
        break;
      case 'rotation':
        textToCopy = `new BABYLON.Vector3(${this.helperBox.rotation.x}, ${this.helperBox.rotation.y}, ${this.helperBox.rotation.z})`;
        break;
      case 'scaling':
        textToCopy = `new BABYLON.Vector3(${this.helperBox.scaling.x}, ${this.helperBox.scaling.y}, ${this.helperBox.scaling.z})`;
        break;
      case 'all':
        textToCopy = `helperBox.position = new BABYLON.Vector3(${this.helperBox.position.x}, ${this.helperBox.position.y}, ${this.helperBox.position.z});\nhelperBox.rotation = new BABYLON.Vector3(${this.helperBox.rotation.x}, ${this.helperBox.rotation.y}, ${this.helperBox.rotation.z});\nhelperBox.scaling = new BABYLON.Vector3(${this.helperBox.scaling.x}, ${this.helperBox.scaling.y}, ${this.helperBox.scaling.z});`;
        break;
    }
    
    // Copy to clipboard
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.setStatus('success', `✅ ${type.toUpperCase()} copied to clipboard!`);
      console.log('Copied:', textToCopy);
    }).catch(err => {
      this.setStatus('error', `❌ Failed to copy: ${err.message}`);
    });
  }
  
  setStatus(type, message) {
    this.statusText.text = message;
    
    if (type === 'success') {
      this.statusText.color = "#00ff00";
    } else if (type === 'error') {
      this.statusText.color = "#ff0000";
    } else {
      this.statusText.color = "white";
    }
  }
  
  show() {
    this.panel.isVisible = true;
    this.isVisible = true;
  }
  
  hide() {
    this.panel.isVisible = false;
    this.isVisible = false;
  }
  
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}
