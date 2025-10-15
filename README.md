# 🎬 Animation Editor - Web After Effects Simplified

A web-based 2D/3D animation editor inspired by After Effects, with a simple but structured interface that allows you to animate text, shapes, and images, and export MP4 videos.

## ✨ Current Status

**✅ MVP COMPLETE** - The base implementation is ready with all core features!

### Implemented Features

✅ **Timeline with Keyframes**

- Layer management with full CRUD operations
- Automatic interpolation (linear, ease-in/out, cubic-bezier)
- Interactive playhead with scrubbing
- Real-time animation preview

✅ **Canvas Viewport**

- Three.js rendering engine for 2D/3D
- Zoom/pan controls
- Grid overlay (toggleable)
- Object selection and dragging
- Visual feedback for selected layers

✅ **Object Management**

- Text layers with customizable properties
- Shape layers (Rectangle, Circle, Triangle)
- Animatable properties: position, scale, rotation, opacity, color
- Layers are orderable, show/hide, lockable

✅ **Animations**

- Smooth interpolation between keyframes
- Multiple easing curves available
- 9 built-in animation presets (fade, slide, bounce, rotate, scale)

✅ **Save & Export**

- Project save/load in JSON format
- Complete scene, timeline, and keyframe persistence
- Video export infrastructure (ffmpeg.wasm integrated)

✅ **User Interface**

- 4-panel layout: Layers, Canvas, Timeline, Properties
- Resizable panels
- Responsive and fluid UI with shadcn-svelte
- Keyboard shortcuts for common operations
- Welcome screen for first-time users

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build for production
pnpm run build
```

Then open your browser to `http://localhost:5173`

## 📚 Documentation

See [ANIMATION_EDITOR.md](./ANIMATION_EDITOR.md) for:

- Complete user guide
- Keyboard shortcuts reference
- Tutorial: Creating your first animation
- Technical architecture details

## 🎯 Tech Stack

- **Framework**: SvelteKit with Svelte 5 Runes
- **Rendering**: Three.js for 2D/3D canvas
- **UI Components**: shadcn-svelte
- **Video Export**: ffmpeg.wasm
- **State Management**: Svelte reactive stores (runes)
- **Animation Engine**: Custom interpolation with bezier-easing

## 🎨 Features Highlights

### Keyboard Shortcuts

- `Space` - Play/Pause
- `T` - Add text layer
- `R` - Add rectangle
- `C` - Add circle
- `Cmd/Ctrl + S` - Save project
- `+/-` - Zoom in/out
- And many more...

### Animation Presets

- Fade In/Out
- Slide In (Left/Right/Top/Bottom)
- Bounce
- Scale In
- Rotate In

### Layer Types

- **Text**: Customizable content, font size, alignment
- **Shapes**: Rectangle, Circle, Triangle with fill/stroke
- **Images**: (Planned)

## 🔮 Future Enhancements

- [ ] Video export UI completion
- [ ] Image layer support
- [ ] Undo/Redo system
- [ ] Advanced motion paths
- [ ] Layer effects and filters
- [ ] Audio track support
- [ ] Lottie export
- [ ] 3D camera controls
- [ ] Parent-child layer relationships

## 📝 Project Structure

```
src/
├── lib/
│   ├── components/editor/
│   │   ├── canvas/          # Three.js viewport & interactions
│   │   ├── timeline/        # Timeline, ruler, playhead, keyframes
│   │   ├── panels/          # Layers & properties panels
│   │   ├── toolbar.svelte   # Main toolbar
│   │   └── ...
│   ├── engine/
│   │   ├── interpolation.ts # Animation engine
│   │   ├── presets.ts       # Animation presets
│   │   ├── layer-factory.ts # Layer creation utilities
│   │   └── video-export.ts  # FFmpeg integration
│   ├── stores/
│   │   └── project.svelte.ts # Global state management
│   └── types/
│       └── animation.ts      # TypeScript definitions
└── routes/
    └── (app)/
        └── +page.svelte     # Main editor page
```

## 🎬 Getting Started

1. **Create a Layer**: Press `T` for text or `R` for rectangle
2. **Edit Properties**: Use the Properties panel on the right
3. **Add Keyframes**: Click "Add Keyframe" and change values over time
4. **Preview**: Press `Space` to play your animation
5. **Save**: Press `Cmd/Ctrl + S` to save as JSON

For detailed instructions, see the [User Guide](./ANIMATION_EDITOR.md).

## 🤝 Contributing

This is a working prototype ready for refinement and expansion. Feel free to:

- Report issues
- Suggest features
- Submit pull requests
- Improve documentation

---

**Note**: This implementation prioritizes a clean architecture and scalable codebase as a foundation for further refinement and feature development.
