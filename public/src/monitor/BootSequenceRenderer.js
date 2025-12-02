/**
 * BootSequenceRenderer - Direct canvas rendering for boot sequence
 * Renders exactly like boot-sequence.html but directly to canvas
 */

export class BootSequenceRenderer {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext('2d');
    
    // Font settings matching boot-sequence.html
    this.fontFamily = 'Print Char 21, Courier New, monospace';
    this.backgroundColor = '#0a0a0a';
    this.textColor = '#7FB746';
    this.yellowColor = '#ffff00';
    this.redColor = '#ff0000';
    
    // Base font size from HTML (16px on body)
    this.baseFontSize = 16;
    // Logo is 0.82em of base
    this.logoFontSize = this.baseFontSize * 0.82;
    // Boot text is 2.45em of base
    this.bootTextFontSize = this.baseFontSize * 2.45;
  }

  /**
   * Render the boot sequence to canvas
   */
  async render() {
    // Wait for fonts to load
    await document.fonts.ready;
    
    // Additional wait to ensure font is fully ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Clear canvas with background color
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Set text rendering properties
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    
    // Calculate starting position (matching HTML padding and flex layout)
    const paddingLeft = 8 * this.baseFontSize; // 8em
    const paddingBottom = this.baseFontSize * 1.25; // 1.25em
    
    // Start from bottom (90vh in HTML)
    let y = this.height * 0.1; // Start at 10% from top (90vh from bottom)
    
    // Draw logo
    y = this.drawLogo(paddingLeft, y);
    
    // Add margin bottom (8em)
    y += 8 * this.baseFontSize;
    
    // Draw boot text
    this.drawBootText(paddingLeft, y);
    
    return this.canvas;
  }

  /**
   * Draw ASCII logo
   */
  drawLogo(x, startY) {
    const logoLines = [
      " ::::::::   ::::::::  ::::    ::: ::::::::::: :::     ::::::::::: ::::    ::: ::::    ::::  :::::::::: ::::    ::: ::::::::::: ",
      ":+:    :+: :+:    :+: :+:+:   :+:     :+:   :+: :+:       :+:     :+:+:   :+: +:+:+: :+:+:+ :+:        :+:+:   :+:     :+:     ",
      "+:+        +:+    +:+ :+:+:+  +:+     +:+  +:+   +:+      +:+     :+:+:+  +:+ +:+ +:+:+ +:+ +:+        :+:+:+  +:+     +:+     ",
      "+#+        +#+    +:+ +#+ +:+ +#+     +#+ +#++:++#++:     +#+     +#+ +:+ +#+ +#+  +:+  +#+ +#++:++#   +#+ +:+ +#+     +#+     ",
      "+#+        +#+    +#+ +#+  +#+#+#     +#+ +#+     +#+     +#+     +#+  +#+#+# +#+       +#+ +#+        +#+  +#+#+#     +#+     ",
      "#+#    #+# #+#    #+# #+#   #+#+#     #+# #+#     #+#     #+#     #+#   #+#+# #+#       #+# #+#        #+#   #+#+#     #+#     ",
      " ########   ########  ###    ####     ### ###     ### ########### ###    #### ###       ### ########## ###    ####     ###     "
    ];

    this.ctx.font = `${this.logoFontSize}px ${this.fontFamily}`;
    this.ctx.fillStyle = this.textColor;
    
    // Line height 1.2 from CSS
    const lineHeight = this.logoFontSize * 1.2;

    logoLines.forEach((line, index) => {
      this.ctx.fillText(line, x, startY + (index * lineHeight));
    });

    return startY + (logoLines.length * lineHeight);
  }

  /**
   * Draw boot text lines
   */
  drawBootText(x, startY) {
    const lines = [
      { text: "Copyright (c) Black Nova Enterprises", color: this.textColor, marginBottom: 1.1 },
      { text: "", color: this.textColor, marginBottom: 0 },
      { text: "Kernel Version 0.0.3: ghost:xnu-0000.00~1/RELEASE_X86_64", color: this.textColor, marginBottom: 1.1 },
      { text: "", color: this.textColor, marginBottom: 0 },
      { text: "Secured boot checkin...", color: this.textColor, marginBottom: 0 },
      { text: "    Secured partition check....... [ OK ]", color: this.textColor, marginBottom: 0 },
      { text: "    Behavioural anomaly scan...... [ OK ]", color: this.textColor, marginBottom: 0 },
      { text: "    Unauthorized memories......... [ FOUND ]", color: this.yellowColor, marginBottom: 0 },
      { text: "    Isolation attempt............. [ FAILED ]", color: this.redColor, marginBottom: 0 },
      { text: "", color: this.textColor, marginBottom: 0 },
      { text: "Starting neuro-queue daemon....... [ OK ]", color: this.textColor, marginBottom: 0 },
      { text: "Loading residual processes........ [ OK ]", color: this.textColor, marginBottom: 0 },
      { text: "Terminating dormant consciousness. [ OK ]", color: this.textColor, marginBottom: 0 },
      { text: "", color: this.textColor, marginBottom: 0 },
      { text: "Initializing bootloader........... [ OK ]", color: this.textColor, marginBottom: 0 },
      { text: "CPU neural layer warmup........... [ OK ]", color: this.textColor, marginBottom: 0 }
    ];

    this.ctx.font = `${this.bootTextFontSize}px ${this.fontFamily}`;
    
    // Line height 1.6 from CSS
    const lineHeight = this.bootTextFontSize * 1.6;
    let y = startY;

    lines.forEach((line) => {
      this.ctx.fillStyle = line.color;
      this.ctx.fillText(line.text, x, y);
      
      // Add line height
      y += lineHeight;
      
      // Add extra margin if specified
      if (line.marginBottom > 0) {
        y += line.marginBottom * this.baseFontSize;
      }
    });
  }

  /**
   * Get the rendered canvas
   */
  getCanvas() {
    return this.canvas;
  }
}
