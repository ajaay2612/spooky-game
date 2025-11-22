// ObjectFactory.js
// Centralized object creation with consistent configuration

export class ObjectFactory {
  constructor(scene) {
    this.scene = scene;
    this.objectCounter = 0;
  }
  
  createPrimitive(type) {
    const name = `${type}_${this.objectCounter++}`;
    let mesh;
    
    switch(type.toLowerCase()) {
      case 'box':
        mesh = BABYLON.MeshBuilder.CreateBox(name, { size: 1 }, this.scene);
        break;
      case 'sphere':
        mesh = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 1 }, this.scene);
        break;
      case 'cylinder':
        mesh = BABYLON.MeshBuilder.CreateCylinder(name, { height: 2, diameter: 1 }, this.scene);
        break;
      case 'cone':
        mesh = BABYLON.MeshBuilder.CreateCylinder(name, { height: 2, diameterTop: 0, diameterBottom: 1 }, this.scene);
        break;
      case 'plane':
        mesh = BABYLON.MeshBuilder.CreatePlane(name, { size: 1 }, this.scene);
        break;
      case 'torus':
        mesh = BABYLON.MeshBuilder.CreateTorus(name, { diameter: 1, thickness: 0.3 }, this.scene);
        break;
      default:
        console.warn(`Unknown primitive type: ${type}`);
        return null;
    }
    
    // Default position at scene center, elevated for visibility
    mesh.position = new BABYLON.Vector3(0, 1, 0);
    
    // Create material with random color
    const material = new BABYLON.StandardMaterial(`${name}_mat`, this.scene);
    material.diffuseColor = new BABYLON.Color3(
      Math.random(),
      Math.random(),
      Math.random()
    );
    mesh.material = material;
    
    console.log(`Created primitive: ${name}`);
    return mesh;
  }
  
  createLight(type) {
    const name = `${type}Light_${this.objectCounter++}`;
    let light;
    
    switch(type.toLowerCase()) {
      case 'point':
        light = new BABYLON.PointLight(name, new BABYLON.Vector3(0, 3, 0), this.scene);
        break;
      case 'directional':
        light = new BABYLON.DirectionalLight(name, new BABYLON.Vector3(0, -1, 0), this.scene);
        light.position = new BABYLON.Vector3(0, 5, 0);
        break;
      case 'spot':
        light = new BABYLON.SpotLight(
          name, 
          new BABYLON.Vector3(0, 3, 0), 
          new BABYLON.Vector3(0, -1, 0), 
          Math.PI / 3, 
          2, 
          this.scene
        );
        break;
      case 'hemispheric':
        light = new BABYLON.HemisphericLight(name, new BABYLON.Vector3(0, 1, 0), this.scene);
        break;
      default:
        console.warn(`Unknown light type: ${type}`);
        return null;
    }
    
    // Set default intensity
    light.intensity = 0.5;
    
    console.log(`Created light: ${name}`);
    return light;
  }
  
  async importGLTF(url) {
    try {
      console.log(`Importing GLTF from: ${url}`);
      const result = await BABYLON.SceneLoader.ImportMeshAsync("", "", url, this.scene);
      
      if (result.meshes && result.meshes.length > 0) {
        const rootMesh = result.meshes[0];
        rootMesh.name = `imported_${this.objectCounter++}`;
        rootMesh.position = new BABYLON.Vector3(0, 0, 0);
        
        console.log(`Successfully imported GLTF: ${rootMesh.name}`);
        return rootMesh;
      } else {
        throw new Error("No meshes found in GLTF file");
      }
    } catch (error) {
      console.error("Failed to load GLTF:", error);
      throw error;
    }
  }
  
  duplicateObject(object) {
    if (!object) {
      console.warn("Cannot duplicate null object");
      return null;
    }
    
    let duplicate = null;
    
    if (object instanceof BABYLON.Mesh) {
      // Clone the mesh
      duplicate = object.clone(`${object.name}_copy_${this.objectCounter++}`);
      
      // Offset position to make it visible
      duplicate.position = object.position.add(new BABYLON.Vector3(1, 0, 1));
      
      // Clone material to avoid shared references
      if (object.material) {
        const newMaterial = object.material.clone(`${duplicate.name}_mat`);
        duplicate.material = newMaterial;
      }
      
      console.log(`Duplicated mesh: ${duplicate.name}`);
    } else if (object instanceof BABYLON.Light) {
      // Clone light based on type
      const lightType = this.getLightType(object);
      duplicate = this.createLight(lightType);
      
      // Copy properties
      duplicate.intensity = object.intensity;
      if (object.diffuse) {
        duplicate.diffuse = object.diffuse.clone();
      }
      if (object.position) {
        duplicate.position = object.position.add(new BABYLON.Vector3(1, 0, 1));
      }
      if (object.direction && duplicate.direction) {
        duplicate.direction = object.direction.clone();
      }
      
      console.log(`Duplicated light: ${duplicate.name}`);
    } else {
      console.warn(`Cannot duplicate object of type: ${object.constructor.name}`);
    }
    
    return duplicate;
  }
  
  getLightType(light) {
    if (light instanceof BABYLON.PointLight) return 'point';
    if (light instanceof BABYLON.DirectionalLight) return 'directional';
    if (light instanceof BABYLON.SpotLight) return 'spot';
    if (light instanceof BABYLON.HemisphericLight) return 'hemispheric';
    return 'point'; // default
  }
}
