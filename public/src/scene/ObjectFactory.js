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
  
  async importGLTF(urlOrPath, modelNameOrData = null, skipDefaultPosition = false) {
    try {
      console.log(`Importing GLTF from: ${urlOrPath}`);
      
      let rootUrl = "";
      let sceneFilename = urlOrPath;
      
      // Determine if this is a server path or blob URL
      if (urlOrPath.startsWith('/models/')) {
        // Server path - split into root and filename
        rootUrl = "/models/";
        sceneFilename = urlOrPath.replace('/models/', '');
      }
      
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        null,  // meshNames - null imports all meshes
        rootUrl,
        sceneFilename,
        this.scene,
        null,  // onProgress callback
        ".glb" // pluginExtension - helps the loader identify the format
      );
      
      if (result.meshes && result.meshes.length > 0) {
        // Get the root mesh (usually the first one or find the parent)
        let rootMesh = result.meshes[0];
        
        // If there's a __root__ mesh, use it as the parent
        const rootNode = result.meshes.find(m => m.name === "__root__");
        if (rootNode) {
          rootMesh = rootNode;
        }
        
        // Log all meshes for debugging
        console.log('GLTF meshes:', result.meshes.map(m => ({ name: m.name, parent: m.parent?.name })));
        console.log('Selected root mesh:', rootMesh.name);
        
        rootMesh.name = `imported_${this.objectCounter++}`;
        
        // Store original scaling to preserve coordinate system orientation
        const originalScaling = rootMesh.scaling.clone();
        
        // Reset position and rotation, but preserve scale signs (for coordinate system)
        rootMesh.position = new BABYLON.Vector3(0, 0, 0);
        rootMesh.rotation = new BABYLON.Vector3(0, 0, 0);
        // Keep the sign of each scale component but normalize magnitude to 1
        rootMesh.scaling = new BABYLON.Vector3(
          Math.sign(originalScaling.x) || 1,
          Math.sign(originalScaling.y) || 1,
          Math.sign(originalScaling.z) || 1
        );
        
        // Only set default position if not loading from saved scene
        if (!skipDefaultPosition) {
          rootMesh.position = new BABYLON.Vector3(0, 1, 0);
          console.log(`Set default position for ${rootMesh.name}:`, rootMesh.position);
        } else {
          console.log(`Reset transforms for ${rootMesh.name}, ready for saved transforms`);
        }
        
        // Store metadata for serialization
        rootMesh.metadata = {
          isImportedGLTF: true,
          modelPath: urlOrPath.startsWith('/models/') ? urlOrPath : null,
          modelName: modelNameOrData,
          originalName: rootMesh.name
        };
        
        console.log(`Successfully imported GLTF: ${rootMesh.name} with ${result.meshes.length} meshes`);
        return rootMesh;
      } else {
        throw new Error("No meshes found in GLTF file");
      }
    } catch (error) {
      console.error("Failed to load GLTF:", error);
      throw new Error(`Unable to load model: ${error.message}`);
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
