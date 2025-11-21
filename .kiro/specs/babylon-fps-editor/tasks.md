# Implementation Plan

- [x] 1. Set up project structure and dependencies





  - Create package.json with Babylon.js and Vite dependencies
  - Create index.html with canvas element
  - Create main.js entry point
  - Configure vite.config.js with status server plugin
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Implement core engine and scene initialization





  - Initialize Babylon.js engine with canvas
  - Create scene with spooky atmosphere (dark colors, ambient settings)
  - Set up render loop
  - Add global error handling for application state tracking
  - _Requirements: 7.1, 7.2, 8.2, 8.3_

- [x] 3. Build first-person camera controller





  - Create CameraController class
  - Set up UniversalCamera at eye level (1.6m height)
  - Configure WASD key bindings for movement
  - Implement pointer lock for mouse look controls
  - Set moderate movement speed
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Create spooky room environment





  - Implement SceneManager class
  - Create floor mesh with dark brown material
  - Create four wall meshes with dark greenish-gray materials
  - Create ceiling mesh with almost-black material
  - Apply low specular values for matte appearance
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 5. Implement atmospheric lighting system





  - Add dim hemispheric light with low intensity (0.15)
  - Add flickering point light with sickly yellow-orange color
  - Set point light intensity to 0.3 for eerie atmosphere
  - Configure ground color for hemispheric light (dark blue)
  - _Requirements: 3.5_

- [x] 6. Add placeholder objects to scene





  - Implement addBox method in SceneManager
  - Implement addSphere method in SceneManager
  - Create one or two placeholder objects with random colors
  - Position objects in the room
  - _Requirements: 7.5_

- [x] 7. Build developer GUI system





  - Create GUIManager class using Babylon.js GUI
  - Create fullscreen AdvancedDynamicTexture
  - Build main panel with StackPanel layout
  - Add "Add Box" button with click handler
  - Add "Add Sphere" button with click handler
  - Position panel in top-right corner
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 8. Implement object selection and property editing
  - Add click detection for scene objects in InputHandler
  - Implement selectObject method with visual feedback (emissive color)
  - Create property panel in GUI for selected objects
  - Add position sliders (X, Y, Z) with real-time updates
  - Add color picker using RGB sliders
  - Update GUI when object selection changes
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 9. Add input handling and GUI toggle
  - Create InputHandler class
  - Listen for G key press to toggle GUI visibility
  - Implement toggleVisibility method in GUIManager
  - Ensure FPS counter remains visible when GUI is hidden
  - Route mouse clicks to object selection
  - _Requirements: 4.1, 4.4_

- [ ] 10. Implement FPS counter display
  - Create FPS text block in GUIManager
  - Position counter in top-left corner
  - Update FPS display in render loop using engine.getFps()
  - Ensure counter is always visible regardless of GUI state
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 11. Create status server endpoint
  - Implement Vite plugin for status server middleware
  - Add /status route handler
  - Track application state (active, error, stopped)
  - Store error logs with timestamp and stack trace
  - Include scene diagnostics (object count, rendering state)
  - Return JSON response with uptime and timestamp
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 12. Integrate status updates from client
  - Create updateAppStatus function in main.js
  - Expose function globally for error handlers
  - Update status on scene changes (object count)
  - Track rendering state in status
  - Handle unhandled promise rejections
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 13. Wire all systems together in main.js
  - Initialize all manager classes (SceneManager, CameraController, GUIManager, InputHandler)
  - Pass dependencies between systems
  - Start render loop with FPS updates
  - Verify all controls work together (movement, mouse look, GUI toggle, object editing)
  - Test status endpoint accessibility
  - _Requirements: All requirements integration_
