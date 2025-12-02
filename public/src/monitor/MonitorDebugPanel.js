/**
 * MonitorDebugPanel - Visual debug tool for aligning GUI texture
 */

export class MonitorDebugPanel {
  constructor(monitorController) {
    this.monitorController = monitorController;
    this.panel = null;
    this.isVisible = false;
    
    // Current transform values
    this.rotation = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    
    // Texture UV properties
    this.uScale = 1;
    this.vScale = 1;
    this.uOffset = 0;
    this.vOffset = 0;
    this.uAng = 0;
    this.vAng = 0;
    this.wAng = 0;
    
    this.createPanel();
  }
  
  createPanel() {
    this.panel = document.createElement('div');
    this.panel.id = 'monitor-debug-panel';
    this.panel.style.cssText = `
      position: fixed;
      top: 50%;
      right: 20px;
      transform: translateY(-50%);
      background: rgba(0, 0, 0, 0.95);
      border: 2px solid #00ff00;
      padding: 20px;
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      z-index: 10000;
      min-width: 300px;
      max-height: 90vh;
      overflow-y: auto;
      display: none;
    `;
    
    this.panel.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #00ff00;">Monitor GUI Alignment</h3>
      
      <h4 style="margin: 10px 0 5px 0; color: #ffff00;">Container Transform</h4>
      
      <div style="margin-bottom: 15px;">
        <strong>Rotation:</strong> <span id="rotation-value">0°</span><br>
        <button class="debug-btn" data-action="rotate-cw">+90° (1)</button>
        <button class="debug-btn" data-action="rotate-ccw">-90° (2)</button>
        <button class="debug-btn" data-action="rotate-plus">+15° (Q)</button>
        <button class="debug-btn" data-action="rotate-minus">-15° (E)</button>
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>Scale X (Flip H):</strong> <span id="scale-x-val">1.00</span><br>
        <input type="range" id="scale-x-slider" min="-2" max="2" step="0.01" value="1" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>Scale Y (Flip V):</strong> <span id="scale-y-val">1.00</span><br>
        <input type="range" id="scale-y-slider" min="-2" max="2" step="0.01" value="1" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>Offset X:</strong> <span id="offset-x-val">0</span>px<br>
        <input type="range" id="offset-x-slider" min="-500" max="500" step="10" value="0" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>Offset Y:</strong> <span id="offset-y-val">0</span>px<br>
        <input type="range" id="offset-y-slider" min="-500" max="500" step="10" value="0" style="width: 100%;">
      </div>
      
      <hr style="border-color: #00ff00; margin: 15px 0;">
      
      <h4 style="margin: 10px 0 5px 0; color: #ffff00;">Texture UV Transform</h4>
      
      <div style="margin-bottom: 15px;">
        <strong>uScale (U Flip):</strong> <span id="uscale-val">1.00</span><br>
        <input type="range" id="uscale-slider" min="-2" max="2" step="0.1" value="1" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>vScale (V Flip):</strong> <span id="vscale-val">1.00</span><br>
        <input type="range" id="vscale-slider" min="-2" max="2" step="0.1" value="1" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>uOffset:</strong> <span id="uoffset-val">0.00</span><br>
        <input type="range" id="uoffset-slider" min="-1" max="1" step="0.01" value="0" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>vOffset:</strong> <span id="voffset-val">0.00</span><br>
        <input type="range" id="voffset-slider" min="-1" max="1" step="0.01" value="0" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>uAng (U Rotation):</strong> <span id="uang-val">0.00</span><br>
        <input type="range" id="uang-slider" min="-3.14" max="3.14" step="0.1" value="0" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>vAng (V Rotation):</strong> <span id="vang-val">0.00</span><br>
        <input type="range" id="vang-slider" min="-3.14" max="3.14" step="0.1" value="0" style="width: 100%;">
      </div>
      
      <div style="margin-bottom: 15px;">
        <strong>wAng (W Rotation):</strong> <span id="wang-val">0.00</span><br>
        <input type="range" id="wang-slider" min="-3.14" max="3.14" step="0.1" value="0" style="width: 100%;">
      </div>
      
      <hr style="border-color: #00ff00; margin: 15px 0;">
      
      <button class="debug-btn" data-action="reset" style="background: #ff0000; width: 100%; margin-bottom: 5px;">Reset All (0)</button>
      <button class="debug-btn" data-action="copy" style="background: #0066ff; width: 100%;">Copy Code (C)</button>
      
      <div style="margin-top: 15px; font-size: 10px; opacity: 0.7;">
        Press G to toggle panel
      </div>
    `;
    
    // Add button styles
    const style = document.createElement('style');
    style.textContent = `
      .debug-btn {
        background: #003300;
        border: 1px solid #00ff00;
        color: #00ff00;
        padding: 5px 10px;
        margin: 2px;
        cursor: pointer;
        font-family: 'Courier New', monospace;
        font-size: 12px;
      }
      .debug-btn:hover {
        background: #005500;
      }
      .debug-btn:active {
        background: #007700;
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(this.panel);
    
    // Add event listeners for buttons
    this.panel.querySelectorAll('.debug-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.getAttribute('data-action');
        this.handleAction(action);
      });
    });
    
    // Add event listeners for container sliders
    this.panel.querySelector('#scale-x-slider').addEventListener('input', (e) => {
      this.scaleX = parseFloat(e.target.value);
      this.applyTransform();
    });
    
    this.panel.querySelector('#scale-y-slider').addEventListener('input', (e) => {
      this.scaleY = parseFloat(e.target.value);
      this.applyTransform();
    });
    
    this.panel.querySelector('#offset-x-slider').addEventListener('input', (e) => {
      this.offsetX = parseInt(e.target.value);
      this.applyTransform();
    });
    
    this.panel.querySelector('#offset-y-slider').addEventListener('input', (e) => {
      this.offsetY = parseInt(e.target.value);
      this.applyTransform();
    });
    
    // Add event listeners for UV sliders
    this.panel.querySelector('#uscale-slider').addEventListener('input', (e) => {
      this.uScale = parseFloat(e.target.value);
      this.applyTransform();
    });
    
    this.panel.querySelector('#vscale-slider').addEventListener('input', (e) => {
      this.vScale = parseFloat(e.target.value);
      this.applyTransform();
    });
    
    this.panel.querySelector('#uoffset-slider').addEventListener('input', (e) => {
      this.uOffset = parseFloat(e.target.value);
      this.applyTransform();
    });
    
    this.panel.querySelector('#voffset-slider').addEventListener('input', (e) => {
      this.vOffset = parseFloat(e.target.value);
      this.applyTransform();
    });
    
    this.panel.querySelector('#uang-slider').addEventListener('input', (e) => {
      this.uAng = parseFloat(e.target.value);
      this.applyTransform();
    });
    
    this.panel.querySelector('#vang-slider').addEventListener('input', (e) => {
      this.vAng = parseFloat(e.target.value);
      this.applyTransform();
    });
    
    this.panel.querySelector('#wang-slider').addEventListener('input', (e) => {
      this.wAng = parseFloat(e.target.value);
      this.applyTransform();
    });
  }
  
  handleAction(action) {
    switch(action) {
      case 'rotate-cw':
        this.rotation += 90;
        break;
      case 'rotate-ccw':
        this.rotation -= 90;
        break;
      case 'rotate-plus':
        this.rotation += 15;
        break;
      case 'rotate-minus':
        this.rotation -= 15;
        break;
      case 'flip-h':
        this.scaleX *= -1;
        break;
      case 'flip-v':
        this.scaleY *= -1;
        break;
      case 'reset':
        this.rotation = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        this.uScale = 1;
        this.vScale = 1;
        this.uOffset = 0;
        this.vOffset = 0;
        this.uAng = 0;
        this.vAng = 0;
        this.wAng = 0;
        // Reset sliders
        this.panel.querySelector('#scale-x-slider').value = 1;
        this.panel.querySelector('#scale-y-slider').value = 1;
        this.panel.querySelector('#offset-x-slider').value = 0;
        this.panel.querySelector('#offset-y-slider').value = 0;
        this.panel.querySelector('#uscale-slider').value = 1;
        this.panel.querySelector('#vscale-slider').value = 1;
        this.panel.querySelector('#uoffset-slider').value = 0;
        this.panel.querySelector('#voffset-slider').value = 0;
        this.panel.querySelector('#uang-slider').value = 0;
        this.panel.querySelector('#vang-slider').value = 0;
        this.panel.querySelector('#wang-slider').value = 0;
        break;
      case 'copy':
        const code = `// Monitor GUI Alignment
// Container Transform:
rotation: ${this.rotation}°
scaleX: ${this.scaleX.toFixed(2)}
scaleY: ${this.scaleY.toFixed(2)}
offsetX: ${this.offsetX}px
offsetY: ${this.offsetY}px

// Texture UV Transform:
uScale: ${this.uScale.toFixed(2)}
vScale: ${this.vScale.toFixed(2)}
uOffset: ${this.uOffset.toFixed(2)}
vOffset: ${this.vOffset.toFixed(2)}
uAng: ${this.uAng.toFixed(2)}
vAng: ${this.vAng.toFixed(2)}
wAng: ${this.wAng.toFixed(2)}

// Code:
this.guiTexture.rootContainer.rotation = ${(this.rotation * Math.PI / 180).toFixed(4)};
this.guiTexture.rootContainer.scaleX = ${this.scaleX.toFixed(2)};
this.guiTexture.rootContainer.scaleY = ${this.scaleY.toFixed(2)};
this.guiTexture.rootContainer.left = ${this.offsetX};
this.guiTexture.rootContainer.top = ${this.offsetY};

this.guiTexture.uScale = ${this.uScale.toFixed(2)};
this.guiTexture.vScale = ${this.vScale.toFixed(2)};
this.guiTexture.uOffset = ${this.uOffset.toFixed(2)};
this.guiTexture.vOffset = ${this.vOffset.toFixed(2)};
this.guiTexture.uAng = ${this.uAng.toFixed(2)};
this.guiTexture.vAng = ${this.vAng.toFixed(2)};
this.guiTexture.wAng = ${this.wAng.toFixed(2)};`;
        navigator.clipboard.writeText(code);
        console.log('Copied to clipboard:\n', code);
        alert('Values copied to clipboard!');
        return;
    }
    
    this.applyTransform();
  }
  
  applyTransform() {
    const gui = this.monitorController.guiTexture;
    if (!gui) return;
    
    // Apply container transform
    const root = gui.rootContainer;
    root.rotation = (this.rotation * Math.PI) / 180;
    root.scaleX = this.scaleX;
    root.scaleY = this.scaleY;
    root.left = this.offsetX;
    root.top = this.offsetY;
    
    // Apply texture UV transform
    gui.uScale = this.uScale;
    gui.vScale = this.vScale;
    gui.uOffset = this.uOffset;
    gui.vOffset = this.vOffset;
    gui.uAng = this.uAng;
    gui.vAng = this.vAng;
    gui.wAng = this.wAng;
    
    this.updateDisplay();
  }
  
  updateDisplay() {
    // Update container value displays
    document.getElementById('rotation-value').textContent = this.rotation.toFixed(0) + '°';
    document.getElementById('scale-x-val').textContent = this.scaleX.toFixed(2);
    document.getElementById('scale-y-val').textContent = this.scaleY.toFixed(2);
    document.getElementById('offset-x-val').textContent = this.offsetX;
    document.getElementById('offset-y-val').textContent = this.offsetY;
    
    // Update UV value displays
    document.getElementById('uscale-val').textContent = this.uScale.toFixed(2);
    document.getElementById('vscale-val').textContent = this.vScale.toFixed(2);
    document.getElementById('uoffset-val').textContent = this.uOffset.toFixed(2);
    document.getElementById('voffset-val').textContent = this.vOffset.toFixed(2);
    document.getElementById('uang-val').textContent = this.uAng.toFixed(2);
    document.getElementById('vang-val').textContent = this.vAng.toFixed(2);
    document.getElementById('wang-val').textContent = this.wAng.toFixed(2);
  }
  
  toggle() {
    this.isVisible = !this.isVisible;
    this.panel.style.display = this.isVisible ? 'block' : 'none';
    console.log(this.isVisible ? '✓ Debug panel shown' : '✓ Debug panel hidden');
  }
  
  show() {
    this.isVisible = true;
    this.panel.style.display = 'block';
  }
  
  hide() {
    this.isVisible = false;
    this.panel.style.display = 'none';
  }
}
