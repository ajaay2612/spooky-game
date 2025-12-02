# Models Directory

Place your 3D model files here to use them in the game.

## Supported Formats
- `.glb` (GLTF Binary)
- `.gltf` (GLTF JSON)

## How to Use

1. Copy your `.glb` or `.gltf` files into this directory
2. In the game editor, click the "Load Model" button in the Object Palette
3. Select your model from the list
4. The model will be imported into the scene

## Example

```
models/
├── character.glb
├── tree.glb
├── house.gltf
└── README.md
```

## Notes

- Models are loaded from the server, so make sure the server is running (`npm run server`)
- Models are referenced by filename in saved scenes
- If you rename or delete a model file, saved scenes using that model won't load correctly
