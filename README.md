<div align="center">

# DevMotion

**AI-Powered Animation Video Creator**

Create stunning animated videos with full manual controls or AI-powered suggestions. Export professional MP4s—free, no watermark, no limits.

[![GitHub Stars](https://img.shields.io/github/stars/epavanello/devmotion?style=social)](https://github.com/epavanello/devmotion/stargazers)
[![License](https://img.shields.io/github/license/epavanello/devmotion)](LICENSE)
[![Built with SvelteKit](https://img.shields.io/badge/Built%20with-SvelteKit-FF3E00?logo=svelte)](https://kit.svelte.dev)

[**Try it Live**](https://devmotion.app) • [**Documentation**](./ANIMATION_EDITOR.md) • [**Report Bug**](https://github.com/epavanello/devmotion/issues) • [**Request Feature**](https://github.com/epavanello/devmotion/issues)

</div>

---

## ✨ Features

### Animation Studio
- **Timeline Editor** – Full keyframe control with smooth interpolation and easing curves
- **Layer Management** – Text, shapes, and images with complete customization
- **Interactive Canvas** – Zoom, pan, grid controls, and real-time preview
- **Export** – High-quality MP4 videos with no watermarks or file limits

### AI-Powered Workflow
- **Intelligent Suggestions** – Get smart animation and layer recommendations
- **Auto-Generation** – Create motion sequences automatically
- **MCP Integration** – Use DevMotion tools directly in Claude via Model Context Protocol

### Project Management
- **Save & Load** – Store projects in JSON format for future editing
- **Database Storage** – Persistent project storage with PostgreSQL
- **Authentication** – Secure user accounts with Better Auth

## 🚀 Quick Start

### Web Application

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build
```

Open `http://localhost:5173` and start creating animations!

### MCP Server Integration

Use DevMotion's animation tools directly in Claude Desktop or any MCP-compatible client:

```bash
claude mcp add --transport http devmotion devmotion.app/mcp
```

This enables you to create and animate videos through natural language conversations with Claude. The MCP server provides tools for:
- Creating animation projects
- Adding and editing layers (text, shapes, images)
- Applying animations and keyframes
- Configuring project settings

All projects created via MCP are stored anonymously and can be previewed at `devmotion.app/p/{project-id}`.

## 📖 Documentation

Comprehensive guides available in [ANIMATION_EDITOR.md](./ANIMATION_EDITOR.md):
- User guide and tutorials
- Keyboard shortcuts reference
- Technical architecture
- Animation presets

## 🛠️ Tech Stack

| Component            | Technology                              |
| -------------------- | --------------------------------------- |
| **Framework**        | SvelteKit + Svelte 5 (Runes)            |
| **UI Components**    | bits-ui + Tailwind CSS v4               |
| **Canvas Rendering** | HTML5 Canvas API                        |
| **Video Processing** | MediaBunny                              |
| **AI Integration**   | Vercel AI SDK + OpenRouter              |
| **MCP Server**       | Vercel MCP Adapter                      |
| **Database**         | PostgreSQL + Drizzle ORM                |
| **Authentication**   | Better Auth                             |
| **Animation Engine** | Custom interpolation with bezier-easing |
| **Internationalization** | Paraglide JS                        |

## ⌨️ Keyboard Shortcuts

| Shortcut       | Action                |
| -------------- | --------------------- |
| `Space`        | Play / Pause          |
| `T`            | Add text layer        |
| `R`            | Add rectangle         |
| `Cmd/Ctrl + S` | Save project          |
| `+` / `-`      | Zoom in / out         |
| `Delete`       | Remove selected layer |

## Workflow

1. **Add Layers** – Text, shapes, or images
2. **Position & Style** – Customize appearance and placement
3. **Animate** – Set keyframes with easing curves
4. **Preview** – Real-time playback
5. **Export** – Generate MP4 video
6. **Save** – Store for future editing

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

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation—every contribution helps make DevMotion better.

### Ways to Contribute

- 🐛 **Report Bugs** – [Open an issue](https://github.com/epavanello/devmotion/issues) with detailed reproduction steps
- 💡 **Suggest Features** – Share your ideas for new capabilities
- 🔧 **Submit Pull Requests** – Pick an issue or propose a new feature
- 📖 **Improve Docs** – Help us make the documentation clearer
- ⭐ **Star the Project** – Show your support and help others discover DevMotion

### Development Setup

```bash
# Clone the repository
git clone https://github.com/epavanello/devmotion.git
cd devmotion

# Install dependencies
pnpm install

# Set up environment variables (copy .env.example to .env)
# Configure your database and API keys

# Start the database
pnpm db:start

# Push schema to database
pnpm db:push

# Start development server
pnpm dev
```

### Contribution Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 🔮 Roadmap

- [ ] Enhanced AI animation suggestions
- [ ] Advanced motion paths and bezier curves
- [ ] Layer effects and filters (blur, shadows, etc.)
- [ ] Audio track synchronization
- [ ] Lottie animation export
- [ ] Real-time collaborative editing
- [ ] Stock media library integration
- [ ] Mobile-optimized interface
- [ ] Animation templates marketplace

## 📄 License

This project is open source. Check the repository for license details.

---

<div align="center">

**DevMotion** – Create, animate, export. Completely free.

[devmotion.app](https://devmotion.app)

</div>
