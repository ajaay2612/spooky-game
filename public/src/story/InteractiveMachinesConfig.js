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
    cameraPosition: { x: 0.320, y: 2.297, z: -0.099 },
    cameraRotation: { x: 0.024, y: 2.336, z: 0.000 },
    
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
    cameraPosition: { x: 0.222, y: 2.115, z: -0.058 },
    cameraRotation: { x: 0.003, y: 2.230, z: 0.000 },
    
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
    cameraPosition: { x: 0.208, y: 2.202, z: 0.414 },
    cameraRotation: { x: -0.028, y: 1.580, z: 0.000 },
    
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
    cameraPosition: { x: 0.208, y: 2.202, z: 0.414 },
    cameraRotation: { x: -0.028, y: 1.580, z: 0.000 },
    
    // Interactive elements on this machine
    interactiveElements: {}
  },
  
  // Machine 5: Base Low Material Machine
  'base_low_material_machine': {
    displayName: 'Base Low Material Machine',
    meshName: 'Base_Low_Material_0',
    
    // Camera lock-on position
    cameraPosition: { x: 0.058, y: 2.148, z: 0.226 },
    cameraRotation: { x: 0.004, y: 3.253, z: 0.000 },
    
    // Interactive elements on this machine
    interactiveElements: {
      knob1: {
        type: 'dial',
        meshName: 'Spin1_Low_Material_0.001',
        rotationAxis: { x: 1.00, y: 0.00, z: 0.00 },
        sensitivity: 0.01,
        action: 'adjustKnob1'
      },
      
      knob2: {
        type: 'dial',
        meshName: 'Spin2_Low_Material_0.001',
        rotationAxis: { x: 1.00, y: 0.00, z: 0.00 },
        sensitivity: 0.01,
        action: 'adjustKnob2'
      },
      
      knob3: {
        type: 'dial',
        meshName: 'Spin3_Low_Material_0.001',
        rotationAxis: { x: 1.00, y: 0.00, z: 0.00 },
        sensitivity: 0.01,
        action: 'adjustKnob3'
      },
      
      knob4: {
        type: 'dial',
        meshName: 'Spin4_Low_Material_0.001',
        rotationAxis: { x: 1.00, y: 0.00, z: 0.00 },
        sensitivity: 0.01,
        action: 'adjustKnob4'
      },
      
      knob5: {
        type: 'dial',
        meshName: 'Spin5_Low_Material_0.001',
        rotationAxis: { x: 1.00, y: 0.00, z: 0.00 },
        sensitivity: 0.01,
        action: 'adjustKnob5'
      }
    }
  },
  
  // Machine 6: Radio Machine (SM_Radio4.001_primitive0)
  'radio_machine_1': {
    displayName: 'Radio Machine',
    meshName: 'SM_Radio4.001_primitive0',
    
    // Camera lock-on position
    cameraPosition: { x: -0.075, y: 2.106, z: 0.743 },
    cameraRotation: { x: -0.010, y: 6.152, z: 0.000 },
    
    // Interactive elements on this machine
    interactiveElements: {
      button0: {
        type: 'button',
        meshName: 'SM_Radio4.button0.001',
        pressOffset: { x: 0.000, y: 0.000, z: -0.002 },
        action: 'radioButton0'
      },
      button1: {
        type: 'button',
        meshName: 'SM_Radio4.button1.001',
        pressOffset: { x: 0.000, y: 0.000, z: -0.002 },
        action: 'radioButton1'
      },
      button2: {
        type: 'button',
        meshName: 'SM_Radio4.button2.001',
        pressOffset: { x: 0.000, y: 0.000, z: -0.002 },
        action: 'radioButton2'
      },
      button3: {
        type: 'button',
        meshName: 'SM_Radio4.button3.001',
        pressOffset: { x: 0.000, y: 0.000, z: -0.002 },
        action: 'radioButton3'
      },
      button4: {
        type: 'button',
        meshName: 'SM_Radio4.button4.001',
        pressOffset: { x: 0.000, y: 0.000, z: -0.002 },
        action: 'radioButton4'
      },
      button5: {
        type: 'button',
        meshName: 'SM_Radio4.button5.001',
        pressOffset: { x: 0.000, y: 0.000, z: -0.002 },
        action: 'radioButton5'
      },
      button6: {
        type: 'button',
        meshName: 'SM_Radio4.button6.001',
        pressOffset: { x: 0.000, y: 0.000, z: -0.002 },
        action: 'radioButton6'
      },
      button7: {
        type: 'button',
        meshName: 'SM_Radio4.button7.001',
        pressOffset: { x: 0.000, y: 0.000, z: -0.002 },
        action: 'radioButton7'
      },
      button8: {
        type: 'button',
        meshName: 'SM_Radio4.button8.001',
        pressOffset: { x: 0.000, y: 0.000, z: -0.002 },
        action: 'radioButton8'
      },
      button9: {
        type: 'button',
        meshName: 'SM_Radio4.button9.001',
        pressOffset: { x: 0.000, y: 0.000, z: -0.002 },
        action: 'radioButton9'
      }
    }
  },
  
  // Machine 7: Radio Machine (SM_Radio4.001_primitive1)
  'radio_machine_2': {
    displayName: 'Radio Machine',
    meshName: 'SM_Radio4.001_primitive1',
    
    // Camera lock-on position (same as primitive0)
    cameraPosition: { x: -0.075, y: 2.106, z: 0.743 },
    cameraRotation: { x: -0.010, y: 6.152, z: 0.000 },
    
    // Interactive elements on this machine
    interactiveElements: {}
  },
  
  // Machine 8: Radio Machine (SM_Radio4_primitive0)
  'radio_machine_3': {
    displayName: 'Radio Machine',
    meshName: 'SM_Radio4_primitive0',
    
    // Camera lock-on position (same as others)
    cameraPosition: { x: -0.075, y: 2.106, z: 0.743 },
    cameraRotation: { x: -0.010, y: 6.152, z: 0.000 },
    
    // Interactive elements on this machine
    interactiveElements: {}
  },
  
  // Machine 9: Radio Machine (SM_Radio4_primitive1)
  'radio_machine_4': {
    displayName: 'Radio Machine',
    meshName: 'SM_Radio4_primitive1',
    
    // Camera lock-on position (same as others)
    cameraPosition: { x: -0.075, y: 2.106, z: 0.743 },
    cameraRotation: { x: -0.010, y: 6.152, z: 0.000 },
    
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
