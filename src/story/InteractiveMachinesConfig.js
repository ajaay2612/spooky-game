/**
 * InteractiveMachinesConfig - Configuration for all interactive machines
 * Each machine has:
 * - meshName: The mesh to detect for interaction
 * - cameraPosition: Where the camera moves when locked on
 * - cameraRotation: Camera rotation when locked on
 * - interactiveElements: List of buttons, dials, switches on this machine
 */

export const INTERACTIVE_MACHINES = {
  // Machine 1: Computer/Audio Equipment
  'computer_audio_machine': {
    displayName: 'Computer & Audio Equipment',
    meshName: 'SM_ComputerParts_C05_N1_54_StaticMeshComponent0',
    
    // Camera lock-on position
    cameraPosition: { x: 0.20, y: 2.30, z: 0.10 },
    cameraRotation: { x: -0.01, y: 2.38, z: 0 },
    
    // Interactive elements on this machine
    interactiveElements: {
      powerButton: {
        type: 'button',
        meshName: 'SM_ComputerParts_C05_N1_54_StaticMeshComponent0_power',
        pressOffset: { x: 0.021, y: 0.000, z: 0.015 },
        action: 'togglePower'
      },
      
      dial: {
        type: 'dial',
        meshName: 'SM_ComputerParts_C05_N1_54_StaticMeshComponent0.dial',
        rotationAxis: { x: 0.00, y: 0.00, z: 1.00 },
        sensitivity: 0.01,
        action: 'adjustVolume'
      }
    }
  },
  
  // Machine 2: Cube18 Machine (Equalizer)
  'cube18_machine': {
    displayName: 'Cube18 Equipment',
    meshName: 'Cube18_StaticMeshComponent0',
    
    // Camera lock-on position
    cameraPosition: { x: 0.00, y: 2.20, z: 0.10 },
    cameraRotation: { x: 0.14, y: 2.23, z: 0.00 },
    
    // Interactive elements on this machine
    interactiveElements: {
      powerButton: {
        type: 'button',
        meshName: 'Cube18_StaticMeshComponent0.power',
        pressOffset: { x: 0.006, y: 0.000, z: 0.004 },
        action: 'togglePower'
      },
      
      // Equalizer levers (1-10) - Range: -0.043 (bottom) to +0.043 (top)
      lever1: {
        type: 'lever',
        meshName: 'Cube18_StaticMeshComponent0.lv.1',
        minOffset: { x: 0.000, y: -0.043, z: 0.000 },
        maxOffset: { x: 0.000, y: 0.043, z: 0.000 }
      },
      lever2: {
        type: 'lever',
        meshName: 'Cube18_StaticMeshComponent0.lv.2',
        minOffset: { x: 0.000, y: -0.043, z: 0.000 },
        maxOffset: { x: 0.000, y: 0.043, z: 0.000 }
      },
      lever3: {
        type: 'lever',
        meshName: 'Cube18_StaticMeshComponent0.lv.3',
        minOffset: { x: 0.000, y: -0.043, z: 0.000 },
        maxOffset: { x: 0.000, y: 0.043, z: 0.000 }
      },
      lever4: {
        type: 'lever',
        meshName: 'Cube18_StaticMeshComponent0.lv.4',
        minOffset: { x: 0.000, y: -0.043, z: 0.000 },
        maxOffset: { x: 0.000, y: 0.043, z: 0.000 }
      },
      lever5: {
        type: 'lever',
        meshName: 'Cube18_StaticMeshComponent0.lv.5',
        minOffset: { x: 0.000, y: -0.043, z: 0.000 },
        maxOffset: { x: 0.000, y: 0.043, z: 0.000 }
      },
      lever6: {
        type: 'lever',
        meshName: 'Cube18_StaticMeshComponent0.lv.6',
        minOffset: { x: 0.000, y: -0.043, z: 0.000 },
        maxOffset: { x: 0.000, y: 0.043, z: 0.000 }
      },
      lever7: {
        type: 'lever',
        meshName: 'Cube18_StaticMeshComponent0.lv.7',
        minOffset: { x: 0.000, y: -0.043, z: 0.000 },
        maxOffset: { x: 0.000, y: 0.043, z: 0.000 }
      },
      lever8: {
        type: 'lever',
        meshName: 'Cube18_StaticMeshComponent0.lv.8',
        minOffset: { x: 0.000, y: -0.043, z: 0.000 },
        maxOffset: { x: 0.000, y: 0.043, z: 0.000 }
      },
      lever9: {
        type: 'lever',
        meshName: 'Cube18_StaticMeshComponent0.lv.9',
        minOffset: { x: 0.000, y: -0.043, z: 0.000 },
        maxOffset: { x: 0.000, y: 0.043, z: 0.000 }
      },
      lever10: {
        type: 'lever',
        meshName: 'Cube18_StaticMeshComponent0.lv.10',
        minOffset: { x: 0.000, y: -0.043, z: 0.000 },
        maxOffset: { x: 0.000, y: 0.043, z: 0.000 }
      }
    }
  },
  
  // Machine 3: Computer Monitor
  'computer_monitor': {
    displayName: 'Computer Monitor',
    meshName: 'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.001',
    
    // Camera lock-on position
    cameraPosition: { x: 0.15, y: 2.29, z: 0.40 },
    cameraRotation: { x: 0.09, y: 1.58, z: 0.00 },
    
    // Interactive elements on this machine
    interactiveElements: {
      powerButton: {
        type: 'button',
        meshName: 'SM_Prop_ComputerMonitor_B_32_StaticMeshComponent0.power',
        pressOffset: { x: 0.004, y: 0.000, z: 0.000 },
        action: 'togglePower'
      }
    }
  },
  
  // Machine 4: Monitor Frame (alternative mesh name)
  'monitor_frame': {
    displayName: 'Monitor Frame',
    meshName: 'monitorFrame',
    
    // Camera lock-on position (same as monitor)
    cameraPosition: { x: 0.15, y: 2.29, z: 0.40 },
    cameraRotation: { x: 0.09, y: 1.58, z: 0.00 },
    
    // Interactive elements on this machine
    interactiveElements: {}
  },
};

/**
 * Get machine config by mesh name
 */
export function getMachineByMeshName(meshName) {
  for (const [key, machine] of Object.entries(INTERACTIVE_MACHINES)) {
    if (machine.meshName === meshName) {
      return { id: key, ...machine };
    }
  }
  return null;
}

/**
 * Get all machine mesh names for interaction detection
 */
export function getAllMachineMeshNames() {
  return Object.values(INTERACTIVE_MACHINES).map(m => m.meshName);
}
