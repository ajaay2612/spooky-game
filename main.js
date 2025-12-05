// Spooky Game - Main JavaScript File
// This file contains all game logic and Babylon.js setup

import { EditorManager } from './src/editor/EditorManager.js';
import { ObjectPalette } from './src/editor/ObjectPalette.js';
import { PropertyPanel } from './src/editor/PropertyPanel.js';
import { SceneHierarchy } from './src/editor/SceneHierarchy.js';
import { SettingsPanel } from './src/editor/SettingsPanel.js';
import { HtmlMeshAlignPanel } from './src/editor/HtmlMeshAlignPanel.js';
import { MonitorController } from './src/monitor/MonitorController.js';
import { Monitor2Controller } from './src/monitor/Monitor2Controller.js';
import { MachineInteractions } from './src/story/MachineInteractions.js';

// Global variables
let engine = null;
let scene = null;
let fpsDisplay = null;

// Expose scene globally for debugging tools
window.scene = null;

// UI effects state - controls visibility of crosshair and interaction prompts
window.effectsPlaying = false;

// Camera effects state
let cameraEffectsActive = false;
let tremorAnimation = null;
let hazyVisionAnimation = null;
let hazyVisionPipeline = null;
window.tremorFadeMultiplier = 1.0;

/**
 * Apply camera tremor and hazy vision effects with smooth transitions
 * Call from console: applyCameraEffects()
 * Stop effects: stopCameraEffects()
 */
window.applyCameraEffects = function() {
  if (!scene || !scene.activeCamera) {
    console.error('Scene or camera not available');
    return;
  }

  if (cameraEffectsActive) {
    console.log('Camera effects already active');
    return;
  }

  const camera = scene.activeCamera;
  cameraEffectsActive = true;

  // Store original camera position for tremor effect
  const originalPosition = camera.position.clone();
  const originalRotation = camera.rotation ? camera.rotation.clone() : new BABYLON.Vector3(0, 0, 0);

  // Transition parameters
  const transitionDuration = 2.0; // 2 seconds fade in
  let transitionTime = 0;

  // TREMOR EFFECT - Very subtle camera shake with smooth fade-in
  let tremorTime = 0;
  tremorAnimation = scene.onBeforeRenderObservable.add(() => {
    if (!cameraEffectsActive) return;

    const deltaTime = engine.getDeltaTime() / 1000;
    tremorTime += deltaTime;
    transitionTime += deltaTime;

    // Smooth fade-in using easing function (ease-in-out)
    const progress = Math.min(transitionTime / transitionDuration, 1.0);
    const easedProgress = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    // Tremor-like shake - irregular and jittery
    const maxIntensity = 0.008; // Medium shake intensity
    const intensity = maxIntensity * easedProgress * window.tremorFadeMultiplier;
    const speed = 12; // Fast, jittery tremor

    // Irregular tremor pattern using multiple frequencies
    const offsetX = (Math.sin(tremorTime * speed) + Math.sin(tremorTime * speed * 2.3) * 0.5) * intensity;
    const offsetY = (Math.cos(tremorTime * speed * 1.3) + Math.sin(tremorTime * speed * 3.1) * 0.5) * intensity;
    const offsetZ = (Math.sin(tremorTime * speed * 0.7) + Math.cos(tremorTime * speed * 1.9) * 0.5) * intensity;

    camera.position.x = originalPosition.x + offsetX;
    camera.position.y = originalPosition.y + offsetY;
    camera.position.z = originalPosition.z + offsetZ;

    // Jittery rotation tremor (only X axis, leave Z alone)
    const maxRotIntensity = 0.003; // Medium rotation shake
    const rotIntensity = maxRotIntensity * easedProgress * window.tremorFadeMultiplier;
    if (camera.rotation) {
      // Irregular rotation tremor with multiple frequencies
      camera.rotation.x = originalRotation.x + (Math.sin(tremorTime * speed * 1.1) + Math.cos(tremorTime * speed * 2.7) * 0.5) * rotIntensity;
      // Don't touch Z rotation at all
    }

    // Update original position slowly (so tremor follows camera movement)
    originalPosition.x += (camera.position.x - originalPosition.x - offsetX) * 0.1;
    originalPosition.y += (camera.position.y - originalPosition.y - offsetY) * 0.1;
    originalPosition.z += (camera.position.z - originalPosition.z - offsetZ) * 0.1;
  });

  // RED LIGHT FLICKERING - Store original light colors for flickering effect
  const originalLightData = [];
  scene.lights.forEach(light => {
    originalLightData.push({
      light: light,
      intensity: light.intensity,
      diffuse: light.diffuse ? light.diffuse.clone() : null,
      specular: light.specular ? light.specular.clone() : null
    });
  });

  // HAZY VISION EFFECT - Blur and desaturation with smooth transition
  if (postProcessingPipeline) {
    hazyVisionPipeline = postProcessingPipeline;

    // Store original values
    const originalGrainIntensity = postProcessingPipeline.grainEnabled ? postProcessingPipeline.grain.intensity : 10;
    const originalContrast = postProcessingPipeline.imageProcessing ? postProcessingPipeline.imageProcessing.contrast : 1.1;
    const originalExposure = postProcessingPipeline.imageProcessing ? postProcessingPipeline.imageProcessing.exposure : 1.0;
    const originalVignetteWeight = postProcessingPipeline.imageProcessing?.vignetteEnabled ? postProcessingPipeline.imageProcessing.vignetteWeight : 1.5;

    // Target values - NO blur, minimal greyscale
    const targetGrainIntensity = 30;
    const targetContrast = 0.8;
    const targetExposure = 0.7;
    const targetVignetteWeight = 3.0;
    const targetSaturation = -5; // Minimal greyscale so red is visible

    // Disable depth of field blur completely
    postProcessingPipeline.depthOfFieldEnabled = false;

    if (postProcessingPipeline.imageProcessing) {
      postProcessingPipeline.imageProcessing.colorCurvesEnabled = true;
      const curves = new BABYLON.ColorCurves();
      curves.globalSaturation = 0; // Start normal
      postProcessingPipeline.imageProcessing.colorCurves = curves;
    }

    // Animate transition
    let hazyTransitionTime = 0;
    hazyVisionAnimation = scene.onBeforeRenderObservable.add(() => {
      if (!cameraEffectsActive) return;

      hazyTransitionTime += engine.getDeltaTime() / 1000;
      const progress = Math.min(hazyTransitionTime / transitionDuration, 1.0);
      
      // Smooth easing (ease-in-out)
      const easedProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // RED LIGHT FLICKERING - Subtle red tint flicker
      const flickerSpeed = 4; // Moderate flicker speed
      const flickerTime = hazyTransitionTime * flickerSpeed;
      const flickerValue = Math.sin(flickerTime * 3.7) * 0.5 + 0.5; // 0 to 1
      const redTintAmount = 0.3 * easedProgress * flickerValue; // Max 30% red tint
      
      const redTint = new BABYLON.Color3(
        1.0,
        0.3 + (0.7 * (1 - redTintAmount)), // Reduce green
        0.3 + (0.7 * (1 - redTintAmount))  // Reduce blue
      );

      // Apply red tint to lights
      originalLightData.forEach(data => {
        if (data.diffuse) {
          data.light.diffuse = BABYLON.Color3.Lerp(data.diffuse, redTint, redTintAmount);
        }
        if (data.specular) {
          data.light.specular = BABYLON.Color3.Lerp(data.specular, redTint, redTintAmount * 0.5);
        }
      });

      // Interpolate all values
      if (postProcessingPipeline.grainEnabled) {
        postProcessingPipeline.grain.intensity = originalGrainIntensity + (targetGrainIntensity - originalGrainIntensity) * easedProgress;
      }

      if (postProcessingPipeline.imageProcessing) {
        postProcessingPipeline.imageProcessing.contrast = originalContrast + (targetContrast - originalContrast) * easedProgress;
        postProcessingPipeline.imageProcessing.exposure = originalExposure + (targetExposure - originalExposure) * easedProgress;
        
        if (postProcessingPipeline.imageProcessing.vignetteEnabled) {
          postProcessingPipeline.imageProcessing.vignetteWeight = originalVignetteWeight + (targetVignetteWeight - originalVignetteWeight) * easedProgress;
        }

        // Interpolate saturation
        if (postProcessingPipeline.imageProcessing.colorCurvesEnabled) {
          const curves = new BABYLON.ColorCurves();
          curves.globalSaturation = targetSaturation * easedProgress;
          postProcessingPipeline.imageProcessing.colorCurves = curves;
        }
      }

      // No blur interpolation - blur is disabled
    });
  }

  console.log('✓ Camera effects applied (tremor + hazy vision)');
  console.log('  Effects will fade in over 2 seconds');
  console.log('  Call stopCameraEffects() to remove effects');
};

/**
 * Reveal second monitor and table with light fade-in
 * Call from console: revealMonitor2()
 */
window.revealMonitor2 = function() {
  console.log('🔦 Revealing second monitor setup...');
  
  if (!scene) {
    console.error('Scene not available');
    return 'Scene not available';
  }
  
  // Find and unhide the second monitor
  const monitor2 = scene.getMeshByName('SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.002');
  if (monitor2) {
    monitor2.setEnabled(true);
    monitor2.isVisible = true;
    console.log('✓ Monitor 2 revealed');
  } else {
    console.warn('Monitor 2 mesh not found');
  }
  
  // Find and unhide the second table
  const table2 = scene.getMeshByName('SM_NeosDesk_A01_N2_StaticMeshComponent0.001');
  if (table2) {
    table2.setEnabled(true);
    table2.isVisible = true;
    console.log('✓ Table 2 revealed');
  } else {
    console.warn('Table 2 mesh not found');
  }
  
  // Find and unhide monitor 2 power button
  const monitor2Power = scene.getMeshByName('SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.power.001');
  if (monitor2Power) {
    monitor2Power.setEnabled(true);
    monitor2Power.isVisible = true;
    console.log('✓ Monitor 2 power button revealed');
  } else {
    console.warn('Monitor 2 power button not found');
  }
  
  // Find and unhide monitor 2 LED
  const monitor2LED = scene.getMeshByName('SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.powerled.001');
  if (monitor2LED) {
    monitor2LED.setEnabled(true);
    monitor2LED.isVisible = true;
    console.log('✓ Monitor 2 LED revealed');
  } else {
    console.warn('Monitor 2 LED not found');
  }
  
  // Find and unhide monitor 2 screen
  const monitor2Screen = scene.getMeshByName('SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.screen.001');
  if (monitor2Screen) {
    monitor2Screen.setEnabled(true);
    monitor2Screen.isVisible = true;
    console.log('✓ Monitor 2 screen revealed');
  } else {
    console.warn('Monitor 2 screen not found');
  }
  
  // Find PointLight_2 and fade it in
  const pointLight2 = scene.lights.find(light => light.name === 'PointLight_2');
  if (pointLight2) {
    const targetIntensity = 7.25;
    const fadeDuration = 2.0; // 2 seconds
    let fadeTime = 0;
    
    const fadeInterval = setInterval(() => {
      fadeTime += 0.016; // ~60fps
      const progress = Math.min(fadeTime / fadeDuration, 1.0);
      
      // Smooth easing
      const easedProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      pointLight2.intensity = targetIntensity * easedProgress;
      
      if (progress >= 1.0) {
        clearInterval(fadeInterval);
        console.log('✓ PointLight_2 faded to intensity:', targetIntensity);
      }
    }, 16);
    
    console.log('✓ PointLight_2 fade started');
  } else {
    console.warn('PointLight_2 not found');
  }
  
  // Unlock monitor2 device for interaction
  if (machineInteractions) {
    machineInteractions.unlockDevice('monitor2');
    console.log('🔓 Monitor 2 device unlocked');
  }
  
  return '✓ Monitor 2 setup revealed';
};

/**
 * Skip to core3.exe puzzle for testing
 * Call from console: skipToCore3()
 */
window.skipToCore3 = function() {
  console.log('⏩ Skipping to core3.exe puzzle...');
  
  // Wait a bit for iframe to be ready
  setTimeout(() => {
    const monitorIframe = document.querySelector('iframe');
    console.log('Iframe found:', !!monitorIframe);
    
    if (monitorIframe && monitorIframe.contentWindow) {
      const iframeDoc = monitorIframe.contentWindow.document;
      console.log('Iframe document:', !!iframeDoc);
      
      // Set power available flag
      if (monitorIframe.contentWindow.deviceTracker) {
        monitorIframe.contentWindow.deviceTracker.isPowerAvailable = true;
        monitorIframe.contentWindow.deviceTracker.devices.power_source = true;
        console.log('✓ Power source marked as complete');
      } else {
        console.warn('deviceTracker not found');
      }
      
      // Close any open popups
      const notificationPopup = iframeDoc.getElementById('notificationPopup');
      if (notificationPopup) {
        notificationPopup.classList.add('hidden');
        console.log('✓ Notification closed');
      }
      
      // Hide frame6
      const frame6 = iframeDoc.querySelector('.mainexe-frame6');
      if (frame6) {
        frame6.style.display = 'none';
        console.log('✓ Frame6 hidden');
      }
      
      // Open core3.exe popup
      const core3Popup = iframeDoc.querySelector('.core3exe-popup');
      console.log('core3exe-popup found:', !!core3Popup);
      
      if (core3Popup) {
        core3Popup.classList.remove('hidden');
        core3Popup.style.display = 'flex';
        console.log('✓ core3.exe opened - solve the puzzle to see ending sequence!');
        
        // Recapture canvas
        if (window.monitorController) {
          window.monitorController.captureCanvasToTexture();
        }
      } else {
        console.error('core3exe-popup not found in iframe');
      }
    } else {
      console.error('Monitor iframe not accessible');
    }
  }, 500);
  
  return 'Skipping to core3.exe...';
};

/**
 * Blackout - flicker lights then blackout
 * Call from console: applyBlackout()
 * Restore with: restoreBlackout()
 */
window.applyBlackout = function() {
  if (!scene) {
    console.error('Scene not available');
    return;
  }

  console.log('✓ Starting blackout sequence with flicker...');

  // Find point light by type
  const pointLight = scene.lights.find(light => light.getClassName() === 'PointLight');
  
  if (!pointLight) {
    console.warn('Point light not found in scene');
    return;
  }

  // Store original intensity if not already stored
  if (window.blackoutOriginalIntensity === undefined) {
    window.blackoutOriginalIntensity = pointLight.intensity;
  }

  const originalIntensity = window.blackoutOriginalIntensity;
  const flickerDuration = 0.5; // 0.5 seconds of flickering
  let flickerTime = 0;
  let isFlickering = true;

  // Create flickering animation before blackout
  const flickerAnimation = scene.onBeforeRenderObservable.add(() => {
    if (!isFlickering) return;

    flickerTime += engine.getDeltaTime() / 1000;

    // Fast, erratic flickering
    const flickerSpeed = 25; // Very fast flicker
    const flicker1 = Math.sin(flickerTime * flickerSpeed * 4.3) * 0.5 + 0.5;
    const flicker2 = Math.sin(flickerTime * flickerSpeed * 6.7) * 0.5 + 0.5;
    const flicker3 = Math.random() * 0.4; // More randomness
    
    const flickerValue = (flicker1 * 0.3 + flicker2 * 0.3 + flicker3 * 0.4);
    
    // Flicker between 20% and 100% intensity
    pointLight.intensity = originalIntensity * (0.2 + flickerValue * 0.8);

    // Occasionally go completely dark for dramatic effect
    if (Math.random() < 0.1) { // 10% chance per frame
      pointLight.intensity = 0;
    }

    // After flicker duration, apply blackout
    if (flickerTime >= flickerDuration) {
      isFlickering = false;
      
      // Final blackout
      pointLight.intensity = 1.15;
      
      // Remove animation
      scene.onBeforeRenderObservable.remove(flickerAnimation);
      
      console.log(`✓ Blackout applied after flicker - ${pointLight.name} dimmed to 1.15 (was ${originalIntensity})`);
    }
  });
};

/**
 * Restore point light after blackout
 * Call from console: restoreBlackout()
 */
window.restoreBlackout = function() {
  if (!scene) {
    console.error('Scene not available');
    return;
  }

  const pointLight = scene.lights.find(light => light.getClassName() === 'PointLight');
  
  if (pointLight && window.blackoutOriginalIntensity !== undefined) {
    pointLight.intensity = window.blackoutOriginalIntensity;
    console.log(`✓ Blackout restored - ${pointLight.name} turned on (intensity: ${window.blackoutOriginalIntensity})`);
    window.blackoutOriginalIntensity = undefined;
  } else {
    console.warn('Point light not found or no blackout to restore');
  }
};

/**
 * Apply light flickering effect for 5 seconds
 * Call from console: applyLightFlicker()
 */
window.applyLightFlicker = function() {
  if (!scene) {
    console.error('Scene not available');
    return;
  }
  
  // Hide UI during light flicker
  window.effectsPlaying = true;

  console.log('✓ Light flickering effect started');

  const duration = 5.0; // 5 seconds
  let flickerTime = 0;
  let isFlickering = true;

  // Store original light properties
  const originalLightData = [];
  scene.lights.forEach(light => {
    originalLightData.push({
      light: light,
      intensity: light.intensity,
      diffuse: light.diffuse ? light.diffuse.clone() : null,
      specular: light.specular ? light.specular.clone() : null
    });
  });

  // Create flickering animation
  const flickerAnimation = scene.onBeforeRenderObservable.add(() => {
    if (!isFlickering) return;

    flickerTime += engine.getDeltaTime() / 1000;

    // Random flicker pattern
    const flickerSpeed = 20; // Fast flickering
    const flickerIntensity = 0.7; // How much lights dim (0 = full dim, 1 = no dim)

    // Random flicker using noise-like pattern
    const flicker1 = Math.sin(flickerTime * flickerSpeed * 3.7) * 0.5 + 0.5;
    const flicker2 = Math.sin(flickerTime * flickerSpeed * 5.3) * 0.5 + 0.5;
    const flicker3 = Math.random() * 0.3; // Add randomness
    
    const flickerValue = (flicker1 * 0.4 + flicker2 * 0.4 + flicker3 * 0.2);
    const dimAmount = flickerIntensity + (1 - flickerIntensity) * flickerValue;

    // Color shift to warm orange
    const orangeShift = Math.sin(flickerTime * flickerSpeed * 2.1) * 0.3 + 0.7; // 0.4 to 1.0
    const warmOrange = new BABYLON.Color3(1.0, 0.5 * orangeShift, 0.1 * orangeShift); // Warm orange color

    // Apply to all lights
    originalLightData.forEach(data => {
      data.light.intensity = data.intensity * dimAmount;
      
      // Shift color to warm orange
      if (data.diffuse) {
        data.light.diffuse = BABYLON.Color3.Lerp(data.diffuse, warmOrange, 0.6); // 60% orange tint
      }
      if (data.specular) {
        data.light.specular = BABYLON.Color3.Lerp(data.specular, warmOrange, 0.4); // 40% orange tint
      }
    });

    // Occasionally go completely dark for dramatic effect
    if (Math.random() < 0.05) { // 5% chance per frame
      originalLightData.forEach(data => {
        data.light.intensity = 0;
      });
    }

    // Stop after duration
    if (flickerTime >= duration) {
      isFlickering = false;

      // Restore original light properties
      originalLightData.forEach(data => {
        data.light.intensity = data.intensity;
        if (data.diffuse) {
          data.light.diffuse = data.diffuse;
        }
        if (data.specular) {
          data.light.specular = data.specular;
        }
      });

      // Remove animation
      scene.onBeforeRenderObservable.remove(flickerAnimation);
      
      // Restore UI after light flicker
      window.effectsPlaying = false;

      console.log('✓ Light flickering effect completed');
    }
  });
};

/**
 * Stop camera tremor and hazy vision effects with smooth fade-out
 * Call from console: stopCameraEffects()
 */
window.stopCameraEffects = function() {
  if (!cameraEffectsActive) {
    console.log('Camera effects not active');
    return;
  }

  console.log('✓ Fading out camera effects...');

  // Transition parameters
  const fadeOutDuration = 2.0; // 2 seconds fade out
  let fadeOutTime = 0;

  // Get camera reference
  const camera = scene.activeCamera;

  // Get current values to fade from
  const currentGrainIntensity = hazyVisionPipeline?.grainEnabled ? hazyVisionPipeline.grain.intensity : 10;
  const currentContrast = hazyVisionPipeline?.imageProcessing ? hazyVisionPipeline.imageProcessing.contrast : 1.1;
  const currentExposure = hazyVisionPipeline?.imageProcessing ? hazyVisionPipeline.imageProcessing.exposure : 1.0;
  const currentVignetteWeight = hazyVisionPipeline?.imageProcessing?.vignetteEnabled ? hazyVisionPipeline.imageProcessing.vignetteWeight : 1.5;
  const currentSaturation = hazyVisionPipeline?.imageProcessing?.colorCurvesEnabled ? hazyVisionPipeline.imageProcessing.colorCurves.globalSaturation : 0;
  const currentFStop = hazyVisionPipeline?.depthOfFieldEnabled ? hazyVisionPipeline.depthOfField.fStop : 5.0;

  // Target values (original/normal)
  const targetGrainIntensity = 10;
  const targetContrast = 1.1;
  const targetExposure = 1.0;
  const targetVignetteWeight = 1.5;
  const targetSaturation = 0;
  const targetFStop = 20;

  // Mark as stopping (but keep active for fade-out animation)
  const stoppingEffects = true;

  // Create fade-out animation
  const fadeOutAnimation = scene.onBeforeRenderObservable.add(() => {
    fadeOutTime += engine.getDeltaTime() / 1000;
    const progress = Math.min(fadeOutTime / fadeOutDuration, 1.0);
    
    // Smooth easing (ease-in-out)
    const easedProgress = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    // Fade out tremor intensity
    if (tremorAnimation) {
      // Tremor will naturally fade as we interpolate back to normal
      // The tremor animation will use a decreasing multiplier
      window.tremorFadeMultiplier = 1.0 - easedProgress;
    }

    // Ensure camera rotation Z stays at 0
    if (camera && camera.rotation) {
      camera.rotation.z = 0;
    }

    // Interpolate post-processing back to normal
    if (hazyVisionPipeline) {
      if (hazyVisionPipeline.grainEnabled) {
        hazyVisionPipeline.grain.intensity = currentGrainIntensity + (targetGrainIntensity - currentGrainIntensity) * easedProgress;
      }

      if (hazyVisionPipeline.imageProcessing) {
        hazyVisionPipeline.imageProcessing.contrast = currentContrast + (targetContrast - currentContrast) * easedProgress;
        hazyVisionPipeline.imageProcessing.exposure = currentExposure + (targetExposure - currentExposure) * easedProgress;
        
        if (hazyVisionPipeline.imageProcessing.vignetteEnabled) {
          hazyVisionPipeline.imageProcessing.vignetteWeight = currentVignetteWeight + (targetVignetteWeight - currentVignetteWeight) * easedProgress;
        }

        if (hazyVisionPipeline.imageProcessing.colorCurvesEnabled) {
          const curves = new BABYLON.ColorCurves();
          curves.globalSaturation = currentSaturation + (targetSaturation - currentSaturation) * easedProgress;
          hazyVisionPipeline.imageProcessing.colorCurves = curves;
        }
      }

      if (hazyVisionPipeline.depthOfFieldEnabled) {
        hazyVisionPipeline.depthOfField.fStop = currentFStop + (targetFStop - currentFStop) * easedProgress;
      }
    }

    // When fade-out complete, clean up
    if (progress >= 1.0) {
      cameraEffectsActive = false;
      window.tremorFadeMultiplier = 1.0;

      // Remove all animations
      if (tremorAnimation && scene) {
        scene.onBeforeRenderObservable.remove(tremorAnimation);
        tremorAnimation = null;
      }

      if (hazyVisionAnimation && scene) {
        scene.onBeforeRenderObservable.remove(hazyVisionAnimation);
        hazyVisionAnimation = null;
      }

      if (fadeOutAnimation && scene) {
        scene.onBeforeRenderObservable.remove(fadeOutAnimation);
      }

      // Disable depth of field
      if (hazyVisionPipeline) {
        hazyVisionPipeline.depthOfFieldEnabled = false;
        hazyVisionPipeline = null;
      }

      // Final reset camera rotation Z axis to 0 (should already be there from interpolation)
      if (scene && scene.activeCamera && scene.activeCamera.rotation) {
        scene.activeCamera.rotation.z = 0;
      }

      console.log('✓ Camera effects fully stopped');
    }
  });
};

// Helper function to open alignment tool
window.openAlignmentTool = function() {
  const url = window.location.origin + '/htmlmesh-align.html';
  window.open(url, 'HtmlMeshAlignment', 'width=900,height=800,scrollbars=yes');
  console.log('✓ Alignment tool opened. Use it to align HtmlMesh to monitor screen.');
};

// Helper function to open position debug tool
window.openPositionDebug = function() {
  const url = window.location.origin + '/htmlmesh-position-debug.html';
  window.open(url, 'HtmlMeshPositionDebug', 'width=700,height=700,scrollbars=yes');
  console.log('✓ Position debug tool opened. Use sliders to adjust HtmlMesh position in real-time.');
};

// Helper function to open player position debug tool
window.openPlayerPositionDebug = function() {
  const url = window.location.origin + '/player-position-debug.html';
  window.open(url, 'PlayerPositionDebug', 'width=700,height=900,scrollbars=yes');
  console.log('✓ Player position debug tool opened. Adjust starting position for play mode.');
};

// Helper function to open camera lock-on debug tool
window.openCameraLockOnDebug = function() {
  const url = window.location.origin + '/camera-lockon-debug.html';
  window.open(url, 'CameraLockOnDebug', 'width=750,height=950,scrollbars=yes');
  console.log('✓ Camera lock-on debug tool opened. Adjust camera position/rotation for lock-on view.');
};

// Helper function to open button animation debug tool
window.openButtonAnimationDebug = function() {
  const url = window.location.origin + '/button-animation-debug.html';
  window.open(url, 'ButtonAnimationDebug', 'width=750,height=850,scrollbars=yes');
  console.log('✓ Button animation debug tool opened. Adjust button press animation.');
};

// Helper function to open dial rotation debug tool
window.openDialRotationDebug = function() {
  const url = window.location.origin + '/dial-rotation-debug.html';
  window.open(url, 'DialRotationDebug', 'width=750,height=950,scrollbars=yes');
  console.log('✓ Dial rotation debug tool opened. Find the correct rotation axis for the dial.');
};

// Helper function to open monitor lock-on debug tool
window.openMonitorLockOnDebug = function() {
  const url = window.location.origin + '/monitor-lockon-debug.html';
  window.open(url, 'MonitorLockOnDebug', 'width=750,height=950,scrollbars=yes');
  console.log('✓ Monitor lock-on debug tool opened. Adjust camera position/rotation for monitor lock-on view.');
};

// Helper function to open lever position debug tool
window.openLeverPositionDebug = function() {
  const url = window.location.origin + '/lever-position-debug.html';
  window.open(url, 'LeverPositionDebug', 'width=750,height=950,scrollbars=yes');
  console.log('✓ Lever position debug tool opened. Adjust lever start/end positions for equalizer.');
};

// Helper function to open radio alignment debug tool
window.openRadioAlignDebug = function() {
  const url = window.location.origin + '/radio-align-debug.html';
  window.open(url, 'RadioAlignDebug', 'width=750,height=850,scrollbars=yes');
  console.log('✓ Radio alignment debug tool opened. Adjust rotation and UV transforms for radio display.');
};

// Helper function to open lock-on position editor
window.openLockOnEditor = function() {
  const url = window.location.origin + '/lockon-position-editor.html';
  window.open(url, 'LockOnEditor', 'width=700,height=900,scrollbars=yes');
  console.log('✓ Lock-on position editor opened. Adjust camera positions for all interactive devices.');
};

// Global storage for lock-on position overrides
window.lockOnOverrides = {};

// Listen for lock-on position updates from editor
window.addEventListener('message', (event) => {
  if (event.data.type === 'updateLockOnPosition') {
    const { device, cameraPosition, cameraRotation } = event.data.config;
    
    // Store override globally
    window.lockOnOverrides[device] = {
      cameraPosition,
      cameraRotation
    };
    
    console.log(`✓ Updated lock-on position for ${device}:`, cameraPosition, cameraRotation);
    console.log('Lock on to the device again to see changes.');
  }
  
  // Handle live updates (real-time camera movement)
  if (event.data.type === 'updateLockOnPositionLive') {
    const { device, cameraPosition, cameraRotation } = event.data.config;
    
    console.log('Received live update for', device, cameraPosition, cameraRotation);
    
    // Store override globally
    window.lockOnOverrides[device] = {
      cameraPosition,
      cameraRotation
    };
    
    // If we have a scene and camera, update it live
    if (window.scene && window.scene.activeCamera) {
      const camera = window.scene.activeCamera;
      
      console.log('Updating camera to:', cameraPosition, cameraRotation);
      
      // Always update camera position and rotation in real-time
      camera.position.x = cameraPosition.x;
      camera.position.y = cameraPosition.y;
      camera.position.z = cameraPosition.z;
      camera.rotation.x = cameraRotation.x;
      camera.rotation.y = cameraRotation.y;
      camera.rotation.z = cameraRotation.z;
      camera.rotationQuaternion = null;
    } else {
      console.warn('No scene or camera available');
    }
  }
  
  // Handle device unlock messages
  if (event.data.type === 'unlockDevice') {
    const deviceName = event.data.deviceName;
    console.log('🔓🔓🔓 MAIN WINDOW RECEIVED UNLOCK REQUEST FOR:', deviceName);
    
    // Forward to MachineInteractions if available
    if (machineInteractions) {
      console.log('✅ Forwarding to machineInteractions.unlockDevice()');
      machineInteractions.unlockDevice(deviceName);
    } else {
      console.error('❌ machineInteractions not available!');
    }
  }
  
  // Handle screen capture requests from monitor iframe
  if (event.data.type === 'recaptureCanvas') {
    console.log('📥 Received recaptureCanvas message');
    if (window.monitorController) {
      window.monitorController.captureCanvasToTexture();
      console.log('✅ Screen captured successfully');
    } else {
      console.warn('⚠️ monitorController not available for capture');
    }
  }
});

let loadStartTime = Date.now();
let editorManager = null;
let postProcessingPipeline = null;
let monitorController = null;
let monitor2Controller = null;
let machineInteractions = null;

// Wait for DOM to be fully loaded
window.addEventListener('DOMContentLoaded', () => {
  initializeGame();
});

// Note: F key is now handled by EditorManager for focus functionality
// FPS counter is always visible (can be toggled in future if needed)

// Camera setup is now handled by CameraManager in EditorManager

/**
 * Create room environment geometry
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 */
function createRoomEnvironment(scene) {
  // Create floor mesh (20x20 ground plane at y=0)
  const floor = BABYLON.MeshBuilder.CreateGround(
    "floor",
    { width: 20, height: 20 },
    scene
  );
  floor.position.y = 0;

  // Create ceiling mesh (20x20 plane at y=3)
  const ceiling = BABYLON.MeshBuilder.CreateGround(
    "ceiling",
    { width: 20, height: 20 },
    scene
  );
  ceiling.position.y = 3;
  // Rotate ceiling to face downward
  ceiling.rotation.z = Math.PI;

  // Create four wall meshes to enclose the room
  // Walls are 3 meters high and properly aligned

  // North wall (positive Z)
  const wallNorth = BABYLON.MeshBuilder.CreateBox(
    "wallNorth",
    { width: 20, height: 3, depth: 0.5 },
    scene
  );
  wallNorth.position = new BABYLON.Vector3(0, 1.5, 10);

  // South wall (negative Z)
  const wallSouth = BABYLON.MeshBuilder.CreateBox(
    "wallSouth",
    { width: 20, height: 3, depth: 0.5 },
    scene
  );
  wallSouth.position = new BABYLON.Vector3(0, 1.5, -10);

  // East wall (positive X)
  const wallEast = BABYLON.MeshBuilder.CreateBox(
    "wallEast",
    { width: 0.5, height: 3, depth: 20 },
    scene
  );
  wallEast.position = new BABYLON.Vector3(10, 1.5, 0);

  // West wall (negative X)
  const wallWest = BABYLON.MeshBuilder.CreateBox(
    "wallWest",
    { width: 0.5, height: 3, depth: 20 },
    scene
  );
  wallWest.position = new BABYLON.Vector3(-10, 1.5, 0);

  console.log('Room environment geometry created');

  return {
    floor,
    ceiling,
    walls: [wallNorth, wallSouth, wallEast, wallWest]
  };
}

/**
 * Apply materials and colors for spooky atmosphere
 * @param {Object} roomMeshes - Object containing floor, ceiling, and walls meshes
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 */
function applySpookyMaterials(roomMeshes, scene) {
  // Create StandardMaterial for floor with dark gray color (#1a1a1a)
  const floorMaterial = new BABYLON.StandardMaterial("floorMat", scene);
  floorMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1); // #1a1a1a in RGB (26/255 ≈ 0.1)
  floorMaterial.specularColor = new BABYLON.Color3(0.01, 0.01, 0.01); // Low specular for matte appearance
  roomMeshes.floor.material = floorMaterial;

  // Create StandardMaterial for ceiling with very dark gray color (#0d0d0d)
  const ceilingMaterial = new BABYLON.StandardMaterial("ceilingMat", scene);
  ceilingMaterial.diffuseColor = new BABYLON.Color3(0.05, 0.05, 0.05); // #0d0d0d in RGB (13/255 ≈ 0.05)
  ceilingMaterial.specularColor = new BABYLON.Color3(0.01, 0.01, 0.01); // Low specular for matte appearance
  roomMeshes.ceiling.material = ceilingMaterial;

  // Create StandardMaterial for walls with dark brown/gray color (#2a2a2a)
  const wallMaterial = new BABYLON.StandardMaterial("wallMat", scene);
  wallMaterial.diffuseColor = new BABYLON.Color3(0.165, 0.165, 0.165); // #2a2a2a in RGB (42/255 ≈ 0.165)
  wallMaterial.specularColor = new BABYLON.Color3(0.01, 0.01, 0.01); // Low specular for matte appearance

  // Apply material to all wall meshes
  roomMeshes.walls.forEach(wall => {
    wall.material = wallMaterial;
  });

  console.log('Spooky materials applied to room meshes');
}

/**
 * Implement atmospheric lighting system for spooky atmosphere
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 */
function setupAtmosphericLighting(scene) {
  // Create HemisphericLight with low intensity (0.3)
  // Position light from above with slight blue tint
  const hemisphericLight = new BABYLON.HemisphericLight(
    "hemisphericLight",
    new BABYLON.Vector3(0, 1, 0), // Direction from above
    scene
  );

  // Configure light color for spooky atmosphere with slight blue tint
  hemisphericLight.intensity = 0.3; // Low intensity for dim, spooky atmosphere
  hemisphericLight.diffuse = new BABYLON.Color3(0.5, 0.5, 0.6); // Slight blue tint (more blue in the third component)
  hemisphericLight.specular = new BABYLON.Color3(0.1, 0.1, 0.15); // Subtle specular with blue tint
  hemisphericLight.groundColor = new BABYLON.Color3(0.1, 0.1, 0.1); // Dark ground color

  // Optionally add PointLight for focal illumination
  const pointLight = new BABYLON.PointLight(
    "pointLight",
    new BABYLON.Vector3(0, 2, 0), // Center of room, slightly elevated
    scene
  );

  // Configure point light for warm focal illumination
  pointLight.intensity = 0.5; // Moderate intensity
  pointLight.diffuse = new BABYLON.Color3(1.0, 0.7, 0.4); // Warm orange/yellow color (like a dim bulb)
  pointLight.specular = new BABYLON.Color3(0.5, 0.35, 0.2); // Warm specular
  pointLight.range = 15; // Light range in units

  console.log('Atmospheric lighting system initialized');

  return {
    hemisphericLight,
    pointLight
  };
}

/**
 * Setup post-processing effects for realistic rendering
 * @param {BABYLON.Scene} scene - The Babylon.js scene
 * @param {Array} cameras - Array of cameras to attach effects to
 */
function setupPostProcessing(scene, cameras) {
  // Create default rendering pipeline with post-processing effects
  const pipeline = new BABYLON.DefaultRenderingPipeline(
    "defaultPipeline",
    true, // HDR enabled
    scene,
    cameras // Attach to all cameras
  );

  // Enable MSAA (Multi-Sample Anti-Aliasing) for best quality
  pipeline.samples = 4; // 4x MSAA - higher quality than FXAA
  
  // Enable FXAA as additional pass for even smoother edges
  pipeline.fxaaEnabled = true;

  // Bloom disabled - no glow effect
  pipeline.bloomEnabled = false;

  // Enable image processing for better colors
  pipeline.imageProcessingEnabled = true;
  pipeline.imageProcessing.contrast = 1.1; // Slightly increase contrast
  pipeline.imageProcessing.exposure = 1.0; // Normal exposure
  
  // Enable tone mapping for realistic lighting
  pipeline.imageProcessing.toneMappingEnabled = true;
  pipeline.imageProcessing.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;

  // Enable vignette for cinematic look
  pipeline.imageProcessing.vignetteEnabled = true;
  pipeline.imageProcessing.vignetteWeight = 1.5;
  pipeline.imageProcessing.vignetteCameraFov = 0.8;

  // Reduce chromatic aberration for subtle effect (was too strong)
  pipeline.chromaticAberrationEnabled = true;
  pipeline.chromaticAberration.aberrationAmount = 5; // Much more subtle

  // Enable grain for film-like quality
  pipeline.grainEnabled = true;
  pipeline.grain.intensity = 10;
  pipeline.grain.animated = true;

  // Enable sharpen for crisp details
  pipeline.sharpenEnabled = true;
  pipeline.sharpen.edgeAmount = 0.3;
  pipeline.sharpen.colorAmount = 0.5;

  console.log('Post-processing pipeline initialized with AA and effects');
  
  return pipeline;
}

/**
 * Check browser compatibility and WebGL support
 * @returns {Object} Compatibility check results
 */
function checkBrowserCompatibility() {
  const results = {
    webglSupported: false,
    webgl2Supported: false,
    browserName: 'Unknown',
    browserVersion: 'Unknown',
    compatible: false,
    warnings: []
  };

  // Detect browser
  const userAgent = navigator.userAgent;
  if (userAgent.indexOf('Chrome') > -1 && userAgent.indexOf('Edg') === -1) {
    results.browserName = 'Chrome';
  } else if (userAgent.indexOf('Firefox') > -1) {
    results.browserName = 'Firefox';
  } else if (userAgent.indexOf('Edg') > -1) {
    results.browserName = 'Edge';
  } else if (userAgent.indexOf('Safari') > -1) {
    results.browserName = 'Safari';
  }

  // Check WebGL support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const gl2 = canvas.getContext('webgl2');

  if (gl) {
    results.webglSupported = true;
  }

  if (gl2) {
    results.webgl2Supported = true;
  }

  // Determine compatibility
  if (results.webgl2Supported) {
    results.compatible = true;
    console.log('✓ WebGL 2.0 supported');
  } else if (results.webglSupported) {
    results.compatible = true;
    results.warnings.push('WebGL 2.0 not supported, falling back to WebGL 1.0');
    console.warn('⚠ WebGL 2.0 not supported, using WebGL 1.0 fallback');
  } else {
    results.compatible = false;
    console.error('✗ WebGL not supported');
  }

  // Browser compatibility warnings
  const recommendedBrowsers = ['Chrome', 'Firefox', 'Edge'];
  if (!recommendedBrowsers.includes(results.browserName)) {
    results.warnings.push(`Browser ${results.browserName} may not be fully supported. Recommended: Chrome, Firefox, or Edge`);
  }

  console.log(`Browser: ${results.browserName}, WebGL: ${results.webglSupported}, WebGL2: ${results.webgl2Supported}`);

  return results;
}

/**
 * Create FPS counter display
 */
function createFPSCounter() {
  const fpsDiv = document.createElement('div');
  fpsDiv.id = 'fps-counter';
  fpsDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: #00ff00;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    z-index: 1000;
    min-width: 80px;
  `;
  fpsDiv.textContent = 'FPS: --';
  document.body.appendChild(fpsDiv);
  return fpsDiv;
}

/**
 * Update FPS counter display
 */
function updateFPSCounter() {
  if (fpsDisplay && engine) {
    const fps = engine.getFps().toFixed(0);
    fpsDisplay.textContent = `FPS: ${fps}`;

    // Color code based on performance
    if (fps >= 50) {
      fpsDisplay.style.color = '#00ff00'; // Green - good
    } else if (fps >= 30) {
      fpsDisplay.style.color = '#ffff00'; // Yellow - acceptable
    } else {
      fpsDisplay.style.color = '#ff0000'; // Red - poor
    }
  }
}

/**
 * Measure and log load time
 */
function measureLoadTime() {
  const loadTime = (Date.now() - loadStartTime) / 1000;
  console.log(`Game loaded in ${loadTime.toFixed(2)} seconds`);

  if (loadTime > 5) {
    console.warn(`⚠ Load time (${loadTime.toFixed(2)}s) exceeds target of 5 seconds`);
  } else {
    console.log(`✓ Load time within target (< 5 seconds)`);
  }

  return loadTime;
}

/**
 * Initialize the game engine and scene
 */
async function initializeGame() {
  try {
    // Check browser compatibility and WebGL support
    const compatibility = checkBrowserCompatibility();

    if (!compatibility.compatible) {
      displayError('WebGL is not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.');
      return;
    }

    // Display warnings if any
    if (compatibility.warnings.length > 0) {
      compatibility.warnings.forEach(warning => {
        console.warn(warning);
      });
    }

    // Get canvas element
    const canvas = document.getElementById('renderCanvas');

    // Error handling: Canvas not found
    if (!canvas) {
      console.error('Canvas element not found');
      displayError('Failed to initialize: Canvas element not found');
      return;
    }

    // Error handling: Engine creation failure
    try {
      // Initialize Babylon.js engine from canvas element
      // Use WebGL 2 if available, fallback to WebGL 1
      engine = new BABYLON.Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        disableWebGL2Support: !compatibility.webgl2Supported
      });
    } catch (error) {
      console.error('Failed to create Babylon.js engine:', error);
      displayError('WebGL not supported or failed to initialize. Please use a modern browser.');
      return;
    }

    // Create scene instance with black background
    scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1); // Pure black background
    
    // Expose scene globally for debugging tools
    window.scene = scene;

    // Initialize KTX2 decoder for compressed textures
    if (BABYLON.KhronosTextureContainer2) {
      engine.enableOfflineSupport = false; // Disable offline support for KTX2
      scene.enableOfflineSupport = false;
      
      // Set KTX2 decoder configuration
      if (!BABYLON.KhronosTextureContainer2.URLConfig) {
        BABYLON.KhronosTextureContainer2.URLConfig = {
          jsDecoderModule: "https://cdn.babylonjs.com/babylon.ktx2Decoder.js",
          wasmUASTCToASTC: null,
          wasmUASTCToBC7: null,
          wasmUASTCToRGBA_UNORM: null,
          wasmUASTCToRGBA_SRGB: null,
          jsMSCTranscoder: null,
          wasmMSCTranscoder: null
        };
      }
      console.log('KTX2 decoder initialized for compressed textures');
    }

    // Create basic lighting (minimal setup)
    const hemisphericLight = new BABYLON.HemisphericLight(
      "hemisphericLight",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    hemisphericLight.intensity = 0.5;
    hemisphericLight.diffuse = new BABYLON.Color3(0.8, 0.8, 0.9);
    
    console.log('Basic scene initialized without room geometry');

    // Wait for fonts to load before creating GUI
    console.log('⏳ Waiting for fonts to load...');
    await document.fonts.ready;
    console.log('✓ Fonts loaded, creating GUI');

    // Create GUI texture for editor UI
    const guiTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Initialize Editor Manager
    editorManager = new EditorManager(scene, canvas);
    editorManager.initialize(guiTexture);
    
    // Expose editorManager globally for console access
    window.editorManager = editorManager;

    // Initialize UI components
    editorManager.objectPalette = new ObjectPalette(editorManager, guiTexture);
    editorManager.propertyPanel = new PropertyPanel(editorManager, guiTexture);
    editorManager.sceneHierarchy = new SceneHierarchy(editorManager, guiTexture);
    editorManager.htmlMeshAlignPanel = new HtmlMeshAlignPanel(scene, guiTexture);
    
    // Make interaction system globally accessible for machine interactions
    window.interactionSystem = editorManager.interactionSystem;

    // Setup post-processing effects for realistic rendering (attach to both cameras)
    const cameras = [editorManager.cameraManager.editorCamera, editorManager.cameraManager.playerCamera];
    postProcessingPipeline = setupPostProcessing(scene, cameras);
    window.postProcessingPipeline = postProcessingPipeline; // Make globally accessible for serialization
    
    // Create settings panel for post-processing controls
    const settingsPanel = new SettingsPanel(guiTexture, postProcessingPipeline);
    window.settingsPanel = settingsPanel; // Make globally accessible for refresh

    // Initialize Monitor Controllers (non-blocking)
    monitorController = new MonitorController(scene);
    window.monitorController = monitorController; // Make globally accessible for debugging
    
    monitor2Controller = new Monitor2Controller(scene);
    window.monitor2Controller = monitor2Controller; // Make globally accessible for debugging
    
    // Setup keyboard shortcuts
    window.addEventListener('keydown', (event) => {
      // Pass input to monitor if active
      if (monitorController && monitorController.isActive) {
        monitorController.handleInput(event.key);
        event.preventDefault();
        return;
      }
      
      // H key - HtmlMesh Alignment Panel
      if (event.key === 'h' || event.key === 'H') {
        editorManager.htmlMeshAlignPanel.toggle();
        console.log('HtmlMesh Alignment Panel toggled - press H to toggle');
      }
    });

    // Start in play mode (sitting in chair)
    editorManager.enterPlayMode();
    
    // Disable interaction system initially (will be enabled after camera animation)
    if (editorManager.interactionSystem) {
      editorManager.interactionSystem.enabled = false;
      console.log('🔒 InteractionSystem disabled - waiting for camera animation to complete');
    }
    
    // Auto-load saved scene, then initialize interactive systems
    setTimeout(async () => {
      try {
        await editorManager.autoLoadScene();
        
        // Wait for scene to be fully ready (all meshes loaded)
        await scene.whenReadyAsync();
        
        // Additional delay to ensure all GLTF meshes are fully processed
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Enable pointer lock on canvas click
        const canvas = engine.getRenderingCanvas();
        if (canvas) {
          const requestPointerLock = () => {
            canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
            if (canvas.requestPointerLock) {
              canvas.requestPointerLock();
              console.log('✓ Pointer lock enabled - cursor locked to canvas');
            }
          };
          
          // Store globally so it can be called when Part 1 ends
          window.requestPointerLock = requestPointerLock;
          
          // Request pointer lock on canvas click when not in locked-on state
          canvas.addEventListener('click', () => {
            // Only request pointer lock if not in locked-on mode
            if (window.interactionSystem && !window.interactionSystem.isLockedOn) {
              requestPointerLock();
              console.log('🖱️ Canvas clicked - requesting pointer lock');
            }
          });
        }
        
        // Store the original camera position and light intensities
        if (scene.activeCamera) {
          const camera = scene.activeCamera;
          
          // Store original position FIRST (before any modifications)
          window.cameraOriginalPosition = camera.position.clone();
          window.cameraOriginalRotation = camera.rotation ? camera.rotation.clone() : new BABYLON.Vector3(0, 0, 0);
          
          // Store original light intensities FIRST
          window.originalLightIntensities = [];
          scene.lights.forEach(light => {
            window.originalLightIntensities.push({
              light: light,
              intensity: light.intensity
            });
          });
          
          // Set camera at monitor and dim lights for Part 1
          camera.position = new BABYLON.Vector3(0.704, 2.239, 0.407);
          if (camera.rotation) {
            camera.rotation = new BABYLON.Vector3(0.013, 1.572, 0.000);
          }
          
          // Dim all lights
          scene.lights.forEach(light => {
            light.intensity = 0;
          });
          
          console.log('📷 Camera positioned inside monitor - lights dimmed - waiting for part 1 to complete');
          
          // Create global function to animate camera out
          window.animateCameraFromMonitor = function() {
            if (!scene.activeCamera) return;
            
            const camera = scene.activeCamera;
            const originalPosition = window.cameraOriginalPosition;
            const originalRotation = window.cameraOriginalRotation;
            
            console.log('🎬 Part 1 ended - Starting background music and camera sequence...');
            
            // Request pointer lock automatically when Part 1 ends
            if (window.requestPointerLock) {
              window.requestPointerLock();
              console.log('🖱️ Pointer lock requested automatically');
            }
            
            // Initialize and play background music when Part 1 ends
            if (!window.backgroundMusic) {
              const backgroundMusic = new Audio('/overalll.mp3');
              backgroundMusic.volume = 0.3; // Set volume to 30%
              backgroundMusic.loop = true; // Loop the music
              
              // Play background music
              backgroundMusic.play().catch(error => {
                console.warn('Background music autoplay blocked:', error);
              });
              
              // Store globally for control
              window.backgroundMusic = backgroundMusic;
              console.log('🎵 Background music started');
            }
            
            // Wait 10 seconds before starting camera zoom out and light brightening
            setTimeout(() => {
              console.log('🎬 10 seconds elapsed - Starting camera zoom out and light brightening...');
              
              const animationDuration = 120; // 2 seconds at 60fps
              
              const positionAnimation = new BABYLON.Animation(
                'cameraStartPosition',
                'position',
                60,
                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
              );
              
              positionAnimation.setKeys([
                { frame: 0, value: camera.position.clone() },
                { frame: animationDuration, value: originalPosition }
              ]);
              
              const easingFunction = new BABYLON.CubicEase();
              easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEINOUT);
              positionAnimation.setEasingFunction(easingFunction);
              
              const rotationAnimation = new BABYLON.Animation(
                'cameraStartRotation',
                'rotation',
                60,
                BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
                BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
              );
              
              rotationAnimation.setKeys([
                { frame: 0, value: camera.rotation ? camera.rotation.clone() : new BABYLON.Vector3(0, Math.PI, 0) },
                { frame: animationDuration, value: originalRotation }
              ]);
              
              rotationAnimation.setEasingFunction(easingFunction);
              
              camera.animations = [positionAnimation, rotationAnimation];
              
              // Fade in lights during camera animation
              let animTime = 0;
              const lightFadeObserver = scene.onBeforeRenderObservable.add(() => {
                animTime += scene.getEngine().getDeltaTime() / 1000;
                const progress = Math.min(animTime / 2.0, 1.0); // 2 second fade
                
                // Ease in
                const easedProgress = progress < 0.5 
                  ? 2 * progress * progress 
                  : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                
                // Fade in all lights
                if (window.originalLightIntensities) {
                  window.originalLightIntensities.forEach(data => {
                    data.light.intensity = data.intensity * easedProgress;
                  });
                }
                
                if (progress >= 1.0) {
                  scene.onBeforeRenderObservable.remove(lightFadeObserver);
                }
              });
              
              scene.beginAnimation(camera, 0, animationDuration, false, 1, () => {
                camera.position.copyFrom(originalPosition);
                if (camera.rotation) {
                  camera.rotation.copyFrom(originalRotation);
                }
                
                // Ensure lights are at full intensity
                if (window.originalLightIntensities) {
                  window.originalLightIntensities.forEach(data => {
                    data.light.intensity = data.intensity;
                  });
                }
                
                // Enable interaction system after animation completes
                if (window.interactionSystem) {
                  window.interactionSystem.enabled = true;
                  console.log('🔓 InteractionSystem enabled - player can now interact');
                }
                
                console.log('✓ Camera animation complete - player control enabled');
              });
            }, 10000); // 10 second delay
          };
        }
        
        // Initialize Machine Interactions after scene is loaded
        machineInteractions = new MachineInteractions(scene);
        window.machineInteractions = machineInteractions;
        
        // Initialize monitor controllers after scene is loaded
        await monitorController.initialize();
        await monitor2Controller.initialize();
        

        
        // Hide second monitor and table at startup
        const monitor2 = scene.getMeshByName('SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.002');
        if (monitor2) {
          monitor2.setEnabled(false);
          monitor2.isVisible = false;
          console.log('✓ Monitor 2 hidden at startup');
        }
        
        const table2 = scene.getMeshByName('SM_NeosDesk_A01_N2_StaticMeshComponent0.001');
        if (table2) {
          table2.setEnabled(false);
          table2.isVisible = false;
          console.log('✓ Table 2 hidden at startup');
        }
        
        const monitor2Power = scene.getMeshByName('SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.power.001');
        if (monitor2Power) {
          monitor2Power.setEnabled(false);
          monitor2Power.isVisible = false;
          console.log('✓ Monitor 2 power button hidden at startup');
        }
        
        const monitor2LED = scene.getMeshByName('SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.powerled.001');
        if (monitor2LED) {
          monitor2LED.setEnabled(false);
          monitor2LED.isVisible = false;
          console.log('✓ Monitor 2 LED hidden at startup');
        }
        
        const monitor2Screen = scene.getMeshByName('SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.screen.001');
        if (monitor2Screen) {
          monitor2Screen.setEnabled(false);
          monitor2Screen.isVisible = false;
          console.log('✓ Monitor 2 screen hidden at startup');
        }
        
        // Double-check hiding after delays (in case meshes load late)
        const hideMonitor2Meshes = () => {
          const meshesToHide = [
            'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.002',
            'SM_NeosDesk_A01_N2_StaticMeshComponent0.001',
            'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.power.001',
            'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.powerled.001',
            'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.screen.001'
          ];
          
          meshesToHide.forEach(meshName => {
            const mesh = scene.getMeshByName(meshName);
            if (mesh) {
              mesh.setEnabled(false);
              mesh.isVisible = false;
              console.log('✓ Hidden mesh:', meshName);
            }
          });
        };
        
        // Hide multiple times to catch late-loading meshes
        setTimeout(hideMonitor2Meshes, 500);
        setTimeout(hideMonitor2Meshes, 1500);
        setTimeout(hideMonitor2Meshes, 3000);
        
        console.log('All interactive systems ready');
      } catch (error) {
        console.error('Initialization error:', error);
      }
    }, 100);

    // Implement window resize handler for responsive canvas
    window.addEventListener('resize', () => {
      engine.resize();
    });

    console.log('Spooky Game - Engine and scene initialized successfully');

    // Create FPS counter (DISABLED FOR PRODUCTION)
    // fpsDisplay = createFPSCounter();

    // Measure and log load time
    measureLoadTime();

    // Implement engine.runRenderLoop with scene.render()
    // Add try-catch error handling in render loop
    engine.runRenderLoop(() => {
      try {
        scene.render();
        // updateFPSCounter(); // DISABLED FOR PRODUCTION
        
        // Update monitor controllers
        if (monitorController) {
          monitorController.update();
        }
        if (monitor2Controller) {
          monitor2Controller.update();
        }
        
        // Update interaction system (only in play mode)
        if (editorManager && editorManager.interactionSystem && !editorManager.isEditorMode) {
          editorManager.interactionSystem.update();
        }
      } catch (error) {
        console.error('Render error:', error);
        // Don't stop the render loop, just log the error
      }
    });

  } catch (error) {
    console.error('Unexpected error during initialization:', error);
    displayError('An unexpected error occurred during initialization');
  }
}

/**
 * Display error message to user
 * @param {string} message - Error message to display
 */
function displayError(message) {
  // Create error display element if it doesn't exist
  let errorDiv = document.getElementById('error-message');
  if (!errorDiv) {
    errorDiv = document.createElement('div');
    errorDiv.id = 'error-message';
    errorDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #ff0000; color: #ffffff; padding: 20px; border-radius: 5px; font-family: Arial, sans-serif; z-index: 1000;';
    document.body.appendChild(errorDiv);
  }
  errorDiv.textContent = message;
}
