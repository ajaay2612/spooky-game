// SerializationManager.js
// Handles scene save and load functionality

import { ObjectFactory } from '../scene/ObjectFactory.js';

export class SerializationManager {
  constructor(scene) {
    this.scene = scene;
  }
  
  serializeScene() {
    const data = {
      version: "1.0",
      objects: []
    };
    
    // Serialize meshes
    this.scene.meshes.forEach(mesh => {
      if (mesh.name.startsWith('_')) return; // Skip internal meshes
      if (mesh.name === 'floor' || mesh.name === 'ceiling' || mesh.name.startsWith('wall')) return; // Skip room geometry
      
      const meshData = {
        type: "mesh",
        meshType: this.getMeshType(mesh),
        name: mesh.name,
        position: mesh.position.asArray(),
        rotation: mesh.rotation.asArray(),
        scaling: mesh.scaling.asArray()
      };
      
      if (mesh.material) {
        meshData.material = this.serializeMaterial(mesh.material);
      }
      
      data.objects.push(meshData);
    });
    
    // Serialize lights (including default lights)
    this.scene.lights.forEach(light => {
      const lightData = {
        type: "light",
        lightType: this.getLightType(light),
        name: light.name,
        intensity: light.intensity,
        diffuse: light.diffuse.asArray()
      };
      
      // Save specular color if available
      if (light.specular) {
        lightData.specular = light.specular.asArray();
      }
      
      // Save ground color for hemispheric lights
      if (light.groundColor) {
        lightData.groundColor = light.groundColor.asArray();
      }
      
      if (light.position) {
        lightData.position = light.position.asArray();
      }
      if (light.direction) {
        lightData.direction = light.direction.asArray();
      }
      
      // Save range for point lights
      if (light.range !== undefined) {
        lightData.range = light.range;
      }
      
      data.objects.push(lightData);
    });
    
    return JSON.stringify(data, null, 2);
  }
  
  getMeshType(mesh) {
    // Try to determine mesh type from name
    const name = mesh.name.toLowerCase();
    if (name.includes('box')) return 'box';
    if (name.includes('sphere')) return 'sphere';
    if (name.includes('cylinder')) return 'cylinder';
    if (name.includes('cone')) return 'cone';
    if (name.includes('plane')) return 'plane';
    if (name.includes('torus')) return 'torus';
    return 'box'; // default
  }
  
  getLightType(light) {
    if (light instanceof BABYLON.PointLight) return 'point';
    if (light instanceof BABYLON.DirectionalLight) return 'directional';
    if (light instanceof BABYLON.SpotLight) return 'spot';
    if (light instanceof BABYLON.HemisphericLight) return 'hemispheric';
    return 'point'; // default
  }
  
  serializeMaterial(material) {
    const matData = {};
    
    if (material.diffuseColor) {
      matData.diffuseColor = material.diffuseColor.asArray();
    }
    if (material.specularColor) {
      matData.specularColor = material.specularColor.asArray();
    }
    if (material.emissiveColor) {
      matData.emissiveColor = material.emissiveColor.asArray();
    }
    
    return matData;
  }
  
  applyMaterialData(material, data) {
    if (data.diffuseColor) {
      material.diffuseColor = BABYLON.Color3.FromArray(data.diffuseColor);
    }
    if (data.specularColor) {
      material.specularColor = BABYLON.Color3.FromArray(data.specularColor);
    }
    if (data.emissiveColor) {
      material.emissiveColor = BABYLON.Color3.FromArray(data.emissiveColor);
    }
  }
  
  clearScene() {
    // Clear user-created meshes (keep room geometry)
    const meshesToRemove = this.scene.meshes.filter(mesh => {
      return !mesh.name.startsWith('_') && 
             mesh.name !== 'floor' && 
             mesh.name !== 'ceiling' && 
             !mesh.name.startsWith('wall');
    });
    
    meshesToRemove.forEach(mesh => {
      if (mesh.material) {
        mesh.material.dispose();
      }
      mesh.dispose();
    });
    
    // Clear ALL lights (we'll recreate them from saved data)
    const lightsToRemove = [...this.scene.lights];
    
    lightsToRemove.forEach(light => {
      light.dispose();
    });
  }
  
  async deserializeScene(jsonData) {
    const data = JSON.parse(jsonData);
    const factory = new ObjectFactory(this.scene);
    
    // Clear existing objects (except essential ones)
    this.clearScene();
    
    // Recreate objects
    for (const objData of data.objects) {
      if (objData.type === "mesh") {
        const mesh = factory.createPrimitive(objData.meshType);
        if (mesh) {
          mesh.name = objData.name;
          mesh.position.fromArray(objData.position);
          mesh.rotation.fromArray(objData.rotation);
          mesh.scaling.fromArray(objData.scaling);
          
          if (objData.material && mesh.material) {
            this.applyMaterialData(mesh.material, objData.material);
          }
        }
      } else if (objData.type === "light") {
        const light = factory.createLight(objData.lightType);
        if (light) {
          light.name = objData.name;
          light.intensity = objData.intensity;
          light.diffuse.fromArray(objData.diffuse);
          
          // Restore specular color
          if (objData.specular && light.specular) {
            light.specular.fromArray(objData.specular);
          }
          
          // Restore ground color for hemispheric lights
          if (objData.groundColor && light.groundColor) {
            light.groundColor.fromArray(objData.groundColor);
          }
          
          if (objData.position && light.position) {
            light.position.fromArray(objData.position);
          }
          if (objData.direction && light.direction) {
            light.direction.fromArray(objData.direction);
          }
          
          // Restore range for point lights
          if (objData.range !== undefined && light.range !== undefined) {
            light.range = objData.range;
          }
        }
      }
    }
    
    console.log('Scene deserialized successfully');
  }
  
  async saveToFile() {
    try {
      console.log('Starting scene save...');
      const data = this.serializeScene();
      console.log('Scene serialized, sending to server...');
      
      const response = await fetch('http://localhost:3001/api/save-scene', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data })
      });
      
      console.log('Server response received:', response.status);
      const result = await response.json();
      console.log('Server result:', result);
      
      if (result.success) {
        console.log('✓ Scene saved to project root as saved-3d-env.json');
        alert('Scene saved successfully to saved-3d-env.json!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('✗ Failed to save scene:', error);
      alert(`Failed to save scene: ${error.message}\nMake sure the server is running (npm run server)`);
      throw error;
    }
  }
  
  async loadFromFile() {
    try {
      console.log('Starting scene load...');
      const response = await fetch('http://localhost:3001/api/load-scene');
      console.log('Server response received:', response.status);
      
      const result = await response.json();
      console.log('Server result:', result);
      
      if (result.success) {
        console.log('Deserializing scene data...');
        await this.deserializeScene(result.data);
        console.log('✓ Scene loaded from saved-3d-env.json');
        alert('Scene loaded successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('✗ Failed to load scene:', error);
      alert(`Failed to load scene: ${error.message}\nMake sure the server is running and a scene has been saved.`);
      throw error;
    }
  }
}
