<div align="center">

# DevMotion

**AI-Powered Animation Video Creator**

Create stunning animated videos with full manual controls or AI-powered suggestions. Export professional MP4s—free, no watermark, no limits.

[![GitHub Stars](https://img.shields.io/github/stars/epavanello/devmotion?style=social)](https://github.com/epavanello/devmotion/stargazers)
[![Live Demo](https://img.shields.io/badge/Try_Live-devmotion.app-2563eb)](https://devmotion.app)
[![Built with SvelteKit](https://img.shields.io/badge/Built%20with-SvelteKit-FF3E00?logo=svelte)](https://kit.svelte.dev)

[**Try it Live →**](https://devmotion.app) • [**MCP Integration**](#mcp-server) • [**Self-Deploy**](#-self-host)

</div>

---

## ✨ Features

### Animation Studio

- **Timeline Editor** — Full keyframe control with smooth interpolation and easing curves
- **Layer System** — Text, shapes, images, video, audio, and more
- **Interactive Canvas** — Zoom, pan, grid controls, and real-time preview
- **Export** — High-quality MP4 videos

### AI-Powered Workflow

- **AI Assistant** — Get smart animation and layer recommendations via chat
- **Auto-Generation** — Create motion sequences automatically
- **MCP Integration** — Use DevMotion tools directly in Claude

### Project Management

- **Cloud Storage** — Persistent project storage with PostgreSQL
- **Authentication** — Secure user accounts (Google OAuth)
- **File Upload** — S3-compatible storage for media files

---

## 🚀 Quick Start

### Try Online

Visit [**devmotion.app**](https://devmotion.app) — no account required for basic use.

### Local Development

```bash
# Install dependencies
pnpm install

# Start database (Docker)
pnpm db:start

# Push schema
pnpm db:push

# Start dev server
pnpm dev
```

Open `http://localhost:5173`

---

## 🔌 MCP Server

Use DevMotion's animation tools directly in Claude Desktop:

```bash
claude mcp add --transport http devmotion devmotion.app/mcp
```

Tools: create projects, add/edit layers, apply animations, configure settings.

---

## 🐳 Self-Host

### Docker (Recommended)

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with your settings

# 2. Start with Docker Compose
docker compose up -d
```

### Manual Deployment

```bash
# Build
pnpm build

# Run (requires PostgreSQL + S3)
pnpm start
```

---

## 🛠 Tech Stack

| Component     | Technology                 |
| ------------- | -------------------------- |
| **Framework** | SvelteKit + Svelte 5       |
| **UI**        | Shadcn + Tailwind CSS v4   |
| **Video**     | MediaBunny & fluent-ffmpeg |
| **AI**        | Vercel AI SDK + OpenRouter |
| **Database**  | PostgreSQL + Drizzle ORM   |
| **Auth**      | Better Auth                |

---

## 📄 License

MIT — See [LICENSE](LICENSE) for details.

---

<div align="center">

**DevMotion** — Create, animate, export. Free forever.

[devmotion.app](https://devmotion.app)

</div>
