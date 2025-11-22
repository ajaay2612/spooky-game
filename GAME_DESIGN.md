# Game Design Document

## Overview

**Title**: Spooky Game  
**Genre**: 3D First-Person Horror  
**Platform**: Web (Browser-based)  
**Engine**: Babylon.js 7.31.0  
**Target Audience**: Developers, 3D artists, game designers

## Concept

A first-person horror game set in a dark, oppressive room with flickering lights and eerie atmosphere. Players navigate the spooky environment from an eye-level perspective. The game includes developer tools for prototyping and testing gameplay elements during development.

## Core Gameplay Loop

```
Navigate → Create Object → Select Object → Modify Properties → Repeat
```

## Player Experience

### Movement & Navigation

**First-Person Camera**
- Eye-level perspective (1.6m height)
- Free movement in 3D space
- Smooth mouse look with pointer lock
- WASD keyboard controls

**Movement Characteristics**:
- Speed: 0.5 units per frame (~30 units/second at 60fps)
- No collision detection (free-fly mode)
- No gravity or physics constraints
- Instant direction changes

**Camera Feel**:
- Angular sensitivity: 2000 (moderate mouse speed)
- No acceleration/deceleration
- No head bob or camera shake
- Clean, precise control for editing work

### Object Interaction

**Creation**
- Click GUI buttons to spawn objects
- Objects appear at predefined positions
- Immediate visual feedback
- No placement preview

**Selection**
- Left-click on objects to select
- Visual highlight (emissive glow)
- Property panel updates instantly
- Only one object selected at a time

**Manipulation**
- Real-time property editing via sliders
- Position: X, Y, Z axes (-10 to 10 range)
- Color: RGB channels (0 to 1 range)
- Immediate visual updates (no apply button)

## Environment Design

### The Room

**Dimensions**: 20×20 units floor, 5 units height

**Atmosphere**: Spooky, oppressive, mysterious

**Visual Design**:
- **Floor**: Dark brown, worn appearance
- **Walls**: Dark greenish-gray, institutional feel
- **Ceiling**: Almost black, barely visible
- **Overall Tone**: Abandoned facility, horror game aesthetic

**Spatial Layout**:
```
        North Wall
    ┌─────────────────┐
    │                 │
West│   20×20 space   │East
    │                 │
    └─────────────────┘
        South Wall
```

**Starting Position**: Center of room, facing north

### Lighting Design

**Hemispheric Light**
- Intensity: 0.15 (very dim)
- Direction: Top-down
- Ground color: Dark blue (0.05, 0.05, 0.1)
- Purpose: Minimal ambient visibility

**Point Light**
- Position: Center ceiling (0, 4, 0)
- Intensity: 0.3 (flickering)
- Color: Sickly yellow-orange (0.8, 0.7, 0.5)
- Behavior: Smooth random flickering
- Purpose: Eerie, unstable atmosphere

**Flicker Pattern**:
- Updates every 15 frames (~4 times per second)
- Intensity range: 0.2 to 0.4
- Smooth interpolation (10% per frame)
- Creates tension and unease

### Color Palette

| Element | RGB | Hex | Description |
|---------|-----|-----|-------------|
| Floor | (0.15, 0.12, 0.1) | #26201A | Dark brown |
| Walls | (0.2, 0.25, 0.2) | #334033 | Greenish-gray |
| Ceiling | (0.1, 0.1, 0.12) | #1A1A1F | Near black |
| Light | (0.8, 0.7, 0.5) | #CCB380 | Sickly yellow |
| Ambient | (0.1, 0.1, 0.15) | #1A1A26 | Dark blue |

## Object Types

### Box

**Geometry**: 1×1×1 unit cube  
**Default Position**: (-3, 1, 0)  
**Material**: Random color, standard material  
**Use Cases**: Platforms, obstacles, building blocks

### Sphere

**Geometry**: 1 unit diameter  
**Default Position**: (3, 1.5, 0)  
**Material**: Random color, standard material  
**Use Cases**: Collectibles, projectiles, decorative elements

### Future Objects (Planned)

- **Cylinder**: Pillars, columns
- **Cone**: Markers, projectiles
- **Torus**: Rings, portals
- **Custom Meshes**: Imported models

## User Interface

### GUI Layout

**Position**: Right side of screen  
**Style**: Overlay, semi-transparent  
**Width**: 300px  
**Alignment**: Top-right corner

**Components**:
1. **Action Buttons** (top)
   - Add Box
   - Add Sphere
   - (Future: Delete, Clear All)

2. **Property Panel** (dynamic)
   - Appears when object selected
   - Position sliders (X, Y, Z)
   - Color sliders (R, G, B)
   - (Future: Rotation, Scale)

**Visual Design**:
- White text on dark background
- Green buttons (high contrast)
- Gray sliders with green handles
- 5px spacing between elements

### HUD Elements (Future)

- FPS counter
- Object count
- Draw call counter
- Memory usage
- Performance warnings

## Mechanics (Current)

### Object Creation

**Process**:
1. User clicks "Add Box" or "Add Sphere"
2. Object spawns at default position
3. Random color assigned
4. Object added to scene
5. Console log confirms creation

**Limitations**:
- No placement control
- No object limit
- No undo/redo
- No object naming

### Object Selection

**Process**:
1. User clicks on object in 3D space
2. Raycasting determines hit
3. Previous selection deselected
4. New object highlighted (emissive glow)
5. Property panel updates

**Selection Rules**:
- Only user-created objects selectable
- Room geometry not selectable
- One object at a time
- Click empty space to deselect (not implemented)

### Property Editing

**Position Sliders**:
- X: -10 to 10 (left/right)
- Y: 0 to 5 (up/down)
- Z: -10 to 10 (forward/back)
- Real-time updates

**Color Sliders**:
- R: 0 to 1 (red channel)
- G: 0 to 1 (green channel)
- B: 0 to 1 (blue channel)
- Affects diffuse color only

## Mechanics (Planned)

### Object Deletion

**Trigger**: Delete button or keyboard shortcut  
**Effect**: Remove selected object from scene  
**Cleanup**: Dispose mesh and material

### Object Duplication

**Trigger**: Duplicate button or Ctrl+D  
**Effect**: Create copy at offset position  
**Properties**: Inherit all properties from original

### Multi-Selection

**Trigger**: Shift+Click or drag selection box  
**Effect**: Select multiple objects  
**Editing**: Modify all selected objects simultaneously

### Transform Gizmos

**Types**: Position, Rotation, Scale  
**Interaction**: Drag handles to transform  
**Modes**: Local vs. World space

### Save/Load

**Format**: JSON scene description  
**Data**: Object types, positions, colors, properties  
**Storage**: Local storage or file download

### Physics

**Gravity**: Optional toggle  
**Collisions**: Object-to-object and object-to-room  
**Impostors**: Box, Sphere, Mesh  
**Properties**: Mass, friction, restitution

## Progression System (Future)

### Editor Modes

1. **Free Mode** (current): No restrictions, full creative freedom
2. **Challenge Mode**: Build specific structures with constraints
3. **Puzzle Mode**: Solve spatial puzzles using objects
4. **Game Mode**: Play created levels with objectives

### Unlockables

- Additional object types
- Material presets
- Lighting options
- Environment themes
- Advanced tools (gizmos, snapping)

## Audio Design (Not Implemented)

### Ambient Sounds

- Low rumble (room tone)
- Distant echoes
- Electrical hum (flickering light)
- Subtle wind/air movement

### Interaction Sounds

- Object creation: Soft "pop"
- Object selection: Click/beep
- Slider adjustment: Subtle scrape
- Object deletion: Fade-out whoosh

### Music

- Dark ambient drone
- Minimal, non-intrusive
- Builds tension slowly
- Optional toggle

## Performance Targets

### Frame Rate

- **Target**: 60 fps
- **Minimum**: 30 fps
- **Degradation**: Reduce quality if below 30 fps

### Object Limits

- **Recommended**: 50 objects
- **Maximum**: 100 objects (with optimizations)
- **Warning**: Display at 75 objects

### Draw Calls

- **Target**: < 20 draw calls
- **Current**: 5-7 + N objects (needs optimization)
- **Optimized**: 5-15 (with material pooling)

### Memory

- **Base**: 2.1 MB
- **Per Object**: 5 KB (current), 500 bytes (optimized)
- **Maximum**: 50 MB total

## Accessibility

### Controls

- Keyboard-only navigation (WASD)
- Mouse-only editing (GUI)
- No complex key combinations required

### Visual

- High contrast GUI (white on dark)
- Large clickable areas (40px buttons)
- Clear visual feedback (selection highlight)

### Future Improvements

- Keyboard shortcuts for all actions
- Customizable key bindings
- Colorblind-friendly palette options
- Screen reader support for GUI

## Technical Constraints

### Browser Requirements

- WebGL 2.0 support
- Pointer Lock API
- ES6+ JavaScript
- Canvas element support

### Performance Limitations

- Single-threaded rendering
- No GPU instancing (current)
- Material proliferation issue
- Memory leaks (current)

### Network Requirements

- None (fully client-side)
- Optional: Cloud save/load (future)

## Monetization (N/A)

This is a free, open-source development tool. No monetization planned.

## Analytics & Metrics (Not Implemented)

### Usage Tracking

- Objects created per session
- Average session duration
- Most used object types
- Property edit frequency

### Performance Tracking

- Average FPS
- Draw call distribution
- Memory usage patterns
- Error frequency

### User Behavior

- Navigation patterns
- GUI interaction frequency
- Object placement heatmaps
- Feature usage statistics

## Future Game Modes

### Survival Mode

- Spawn enemies in the room
- Use created objects as defenses
- Limited resources
- Wave-based progression

### Puzzle Mode

- Pre-placed objects
- Specific goal (reach exit, activate switches)
- Physics-based challenges
- Time limits

### Multiplayer (Ambitious)

- Shared editing space
- Real-time collaboration
- Object ownership
- Chat/voice communication

## Narrative Context (Future)

### Setting

Abandoned research facility conducting experiments on spatial manipulation and reality bending.

### Backstory

Player is a researcher who discovered the ability to create and manipulate objects through a mysterious device. The flickering lights and oppressive atmosphere hint at something gone wrong.

### Environmental Storytelling

- Worn, institutional architecture
- Unstable lighting (power issues)
- Empty, echoing space (evacuation?)
- Greenish walls (chemical exposure?)

### Potential Story Beats

1. Discovery of object creation ability
2. Experimentation and mastery
3. Realization of facility's dark purpose
4. Escape or confrontation
5. Choice: Destroy or control the technology

## Conclusion

The current implementation provides a solid foundation for a first-person horror game with atmospheric environmental design. The spooky aesthetic creates an engaging and tense atmosphere. Future development should focus on:

1. Performance optimizations (material pooling, instancing)
2. Enhanced editing tools (deletion, duplication, gizmos)
3. Save/load functionality
4. Physics integration
5. Additional object types and properties

The architecture supports extension into a full game with objectives, challenges, and narrative elements while maintaining its core utility as a development tool.
