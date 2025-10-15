# Animation Editor - User Guide

A web-based 2D/3D animation editor inspired by After Effects, built with SvelteKit, Three.js, and ffmpeg.wasm.

## Features

### Core Functionality

- **Timeline with Keyframes**: Full timeline control with keyframe-based animation
- **Canvas Viewport**: Interactive 3D canvas with zoom, pan, and grid
- **Layer Management**: Create, organize, and animate multiple layers
- **Animation Engine**: Real-time preview with smooth interpolation
- **Export**: Save projects as JSON and export videos (MP4)

### Supported Layer Types

1. **Text**: Animated text with customizable fonts and styles
2. **Shapes**: Rectangle, Circle, Triangle
3. **Images**: Import and animate images (planned)

### Animatable Properties

- Position (X, Y, Z)
- Scale (X, Y, Z)
- Rotation (X, Y, Z)
- Opacity
- Color

## Keyboard Shortcuts

### Playback Controls

- `Space` - Play/Pause animation
- `Home` - Jump to start
- `End` - Jump to end
- `Arrow Left` - Step backward one frame
- `Arrow Right` - Step forward one frame

### Layer Creation

- `T` - Add Text layer
- `R` - Add Rectangle layer
- `C` - Add Circle layer

### View Controls

- `+` or `=` - Zoom in
- `-` - Zoom out
- `0` - Reset zoom and pan
- `Shift + Drag` - Pan the canvas
- `Mouse Wheel` - Zoom in/out

### Project Management

- `Cmd/Ctrl + S` - Save project (JSON)
- `Cmd/Ctrl + N` - New project
- `Cmd/Ctrl + G` - Toggle grid
- `Delete/Backspace` - Delete selected layer

## User Interface

### Layout

The application is organized into 4 main panels:

1. **Toolbar** (Top)
   - Project actions (New, Save, Load)
   - Playback controls
   - Layer creation tools
   - Export options

2. **Layers Panel** (Left)
   - List of all layers
   - Visibility and lock toggles
   - Drag to reorder layers
   - Delete layers

3. **Canvas** (Center)
   - Main viewport showing the animation
   - Interactive controls for zoom/pan
   - Visual feedback for selected layers
   - Grid overlay (toggleable)

4. **Timeline** (Bottom)
   - Time ruler with second markers
   - Layer tracks with keyframes
   - Scrubber/playhead
   - Click to jump to time
   - Right-click keyframes to delete

5. **Properties Panel** (Right)
   - Edit selected layer properties
   - Transform controls (Position, Scale, Rotation)
   - Style properties (Opacity, Color)
   - Text-specific properties (Content, Font Size)
   - Add keyframes
   - Apply animation presets

## Getting Started

### Creating Your First Animation

1. **Add a Layer**
   - Click the Text icon in the toolbar or press `T`
   - A new text layer appears in the center of the canvas

2. **Edit Properties**
   - Select the layer in the Layers panel (left)
   - Modify properties in the Properties panel (right)
   - Change text content, position, color, etc.

3. **Add Keyframes**
   - Move the playhead to time 0s (start)
   - In the Properties panel, click "Add Keyframe" → Position X
   - Set the starting position
   - Move the playhead to 2s
   - Change the position value
   - Click "Add Keyframe" → Position X again
   - The layer will now animate between these positions

4. **Preview**
   - Press `Space` or click the Play button
   - Watch your animation in real-time

5. **Apply Presets**
   - Select a layer
   - In Properties panel, click "Apply Preset"
   - Choose from: Fade In, Fade Out, Slide In, Bounce, etc.

### Canvas Interactions

- **Select Layer**: Click on any object in the canvas
- **Move Layer**: Click and drag selected layer
- **Pan View**: Hold Shift + Drag or use Middle Mouse Button
- **Zoom**: Mouse wheel or +/- keys

## Animation Presets

Built-in presets for quick animations:

1. **Fade In** - Opacity 0 → 1
2. **Fade Out** - Opacity 1 → 0
3. **Slide In Left** - Moves from left side
4. **Slide In Right** - Moves from right side
5. **Slide In Top** - Moves from top
6. **Slide In Bottom** - Moves from bottom
7. **Bounce** - Spring-like scale animation
8. **Scale In** - Grows from 0 to full size
9. **Rotate In** - Rotates while fading in

## Easing Types

Control how animations interpolate between keyframes:

- **Linear** - Constant speed
- **Ease In** - Slow start, fast end
- **Ease Out** - Fast start, slow end
- **Ease In-Out** - Slow start and end, fast middle
- **Cubic Bezier** - Custom curve (advanced)

## Project Settings

Default project configuration:

- Resolution: 1920x1080
- Duration: 10 seconds
- Frame Rate: 30 FPS
- Background: Black

## Export Options

### JSON Export (Current)

- Save your entire project as JSON
- Preserves all layers, keyframes, and settings
- Can be loaded back later

### Video Export (Planned)

- MP4 format via ffmpeg.wasm
- Configurable quality and resolution
- Client-side rendering (no server required)

## Technical Architecture

### Stack

- **Framework**: SvelteKit with Svelte 5 Runes
- **Rendering**: Three.js for 2D/3D canvas
- **Export**: ffmpeg.wasm for video generation
- **UI**: shadcn-svelte components
- **State**: Reactive stores with Svelte runes

### File Structure

```
src/lib/
├── components/editor/
│   ├── canvas/           # Three.js viewport
│   ├── timeline/         # Timeline and keyframes
│   ├── panels/           # Layers and properties
│   └── toolbar.svelte    # Main toolbar
├── engine/
│   ├── interpolation.ts  # Animation engine
│   ├── presets.ts        # Animation presets
│   ├── layer-factory.ts  # Layer creation
│   └── video-export.ts   # FFmpeg integration
├── stores/
│   └── project.svelte.ts # Global state
└── types/
    └── animation.ts      # TypeScript types
```

## Tips & Tricks

1. **Smooth Animations**: Use "ease-in-out" for most natural movement
2. **Layer Organization**: Name your layers descriptively
3. **Grid Snapping**: Toggle grid for precise alignment (Cmd+G)
4. **Multiple Properties**: Animate multiple properties simultaneously
5. **Keyframe Timing**: Right-click timeline to jump to specific times
6. **Save Often**: Use Cmd+S to save your work frequently

## Limitations & Known Issues

- Image layer import not yet implemented
- Video export requires additional setup
- No undo/redo yet (planned)
- Limited to 2D rendering currently (3D planned)
- Motion paths are basic (advanced curves planned)

## Future Enhancements

- [ ] Undo/Redo system
- [ ] Motion path editor
- [ ] Layer effects and filters
- [ ] Audio track support
- [ ] Lottie export
- [ ] Collaborative editing
- [ ] Asset library
- [ ] More shape types
- [ ] Text animations (character-by-character)
- [ ] Parent-child layer relationships

## Support & Feedback

For issues, suggestions, or contributions, please refer to the project repository.

---

Happy animating! 🎬✨
