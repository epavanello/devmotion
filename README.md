# 🎬 DevMotion - Free AI-Powered Animation Video Creator

Create stunning animated videos with ease. Design with full manual controls or leverage AI-powered suggestions to accelerate your workflow. Export professional-quality MP4 videos—completely free, no watermark, no limits.

Perfect for content creators, marketers, educators, and motion designers who want to bring their ideas to life without expensive software.

## ✨ Key Features

🎯 **Manual Animation Studio**

- Full timeline-based animation editor with keyframe support
- Text, shapes, and image layers with complete customization
- Interactive canvas with zoom, pan, and grid controls
- Smooth interpolation with multiple easing curves
- Real-time animation preview

🤖 **AI-Powered Assistance**

- Get intelligent animation suggestions
- Auto-generate motion sequences
- Smart layer recommendations

💾 **Save & Export**

- Save projects in JSON format for future editing
- Export high-quality MP4 videos with ffmpeg
- No file size limits or watermarks

⚡ **Modern Tech Stack**

- Built with SvelteKit and Svelte 5 Runes
- Responsive, intuitive UI with shadcn-svelte components
- Lightning-fast canvas rendering
- Browser-based—no installation needed

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run development server
pnpm run dev

# Build for production
pnpm run build
```

Open your browser to `http://localhost:5173` and start creating!

## 📖 Documentation

See [ANIMATION_EDITOR.md](./ANIMATION_EDITOR.md) for:

- Complete user guide & tutorials
- Keyboard shortcuts reference
- Technical architecture details
- Animation presets showcase

## 🛠️ Tech Stack

| Component            | Technology                              |
| -------------------- | --------------------------------------- |
| **Framework**        | SvelteKit with Svelte 5 Runes           |
| **UI Components**    | shadcn-svelte                           |
| **Canvas Rendering** | HTML5 Canvas / SVG                      |
| **Video Export**     | ffmpeg.wasm                             |
| **State Management** | Svelte reactive stores (runes)          |
| **Animation Engine** | Custom interpolation with bezier-easing |

## ⌨️ Keyboard Shortcuts

| Shortcut       | Action                |
| -------------- | --------------------- |
| `Space`        | Play / Pause          |
| `T`            | Add text layer        |
| `R`            | Add rectangle         |
| `C`            | Add circle            |
| `Cmd/Ctrl + S` | Save project          |
| `+` / `-`      | Zoom in / out         |
| `Delete`       | Remove selected layer |

## 🎨 Supported Layers

- **Text**: Fully customizable font, size, alignment, color
- **Shapes**: Rectangle, Circle, Triangle with fill & stroke
- **Images**: Import and animate custom images

## 🎬 Animation Presets

Quick-start animations to speed up your workflow:

- Fade In/Out
- Slide In/Out (all directions)
- Bounce
- Scale In/Out
- Rotate In

## 🎯 Typical Workflow

1. **Create**: Add layers (text, shapes, or images)
2. **Position**: Move and size elements on the canvas
3. **Animate**: Set keyframes and create smooth transitions
4. **Preview**: Play your animation in real-time
5. **Export**: Generate an MP4 video
6. **Save**: Keep your project for future editing

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/editor/
│   │   ├── canvas/          # Canvas viewport & interactions
│   │   ├── timeline/        # Timeline, playhead, keyframes
│   │   ├── panels/          # Layers & properties panels
│   │   ├── toolbar.svelte   # Main toolbar with controls
│   │   └── export-dialog.svelte
│   ├── engine/
│   │   ├── interpolation.ts # Animation interpolation
│   │   ├── presets.ts       # Built-in animation presets
│   │   ├── layer-factory.ts # Layer creation utilities
│   │   └── video-export.ts  # FFmpeg video rendering
│   ├── stores/
│   │   └── project.svelte.ts # Global reactive state
│   └── types/
│       └── animation.ts      # TypeScript interfaces
└── routes/
    └── (app)/
        └── +page.svelte     # Main editor interface
```

## 🚦 Current Status

✅ **MVP Complete** - All core features working and tested

- Timeline editing with keyframe support
- Layer management (create, edit, delete, reorder)
- Smooth animation rendering
- Video export via ffmpeg.wasm
- Project persistence (save/load JSON)
- Responsive UI with full keyboard shortcuts

## 🔮 Roadmap

- [ ] Enhanced AI animation suggestions
- [ ] Advanced motion paths
- [ ] Layer effects and filters
- [ ] Audio track synchronization
- [ ] Lottie animation export
- [ ] Collaborative editing
- [ ] Stock media library integration
- [ ] Mobile-optimized interface

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

## 📄 License

Check the repository for license details.

---

**DevMotion** - Create, animate, export. Completely free. 🎬
