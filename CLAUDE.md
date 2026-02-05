# CLAUDE.md - AI Assistant Guide for DevMotion

This document provides comprehensive guidance for AI assistants working with the DevMotion codebase. It covers architecture, conventions, workflows, and best practices.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Directory Structure](#directory-structure)
5. [Development Workflows](#development-workflows)
6. [Code Conventions](#code-conventions)
7. [Key Concepts](#key-concepts)
8. [Testing](#testing)
9. [Common Tasks](#common-tasks)
10. [Troubleshooting](#troubleshooting)

---

## Project Overview

**DevMotion** is an AI-powered animation video creator built with SvelteKit. It allows users to:

- Create animated videos with a timeline-based editor
- Use manual controls or AI-powered suggestions for animations
- Export professional MP4 videos (free, no watermark, no limits)
- Access animation tools via MCP (Model Context Protocol) integration

### Key Features

- **Timeline Editor**: Keyframe-based animation with smooth interpolation and easing curves
- **Layer Management**: Text, shapes, HTML, icons, mouse cursor layers
- **Interactive Canvas**: Real-time preview with zoom, pan, and grid controls
- **MCP Server**: Expose animation tools to Claude and other MCP clients
- **Database Storage**: PostgreSQL with Drizzle ORM for persistent project storage
- **Authentication**: Better Auth with Google OAuth support
- **AI Integration**: OpenRouter API for AI-powered animation suggestions

---

## Technology Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Framework** | SvelteKit (SSR/SPA) | Using Svelte 5 with Runes |
| **Language** | TypeScript | Strict mode enabled |
| **Package Manager** | pnpm 10.28.1 | Required, not npm/yarn |
| **UI Components** | bits-ui | Headless component library |
| **Styling** | Tailwind CSS v4 | With typography plugin |
| **Database** | PostgreSQL | Via Drizzle ORM |
| **ORM** | Drizzle ORM | Type-safe database queries |
| **Authentication** | Better Auth | OAuth + credentials |
| **AI SDK** | Vercel AI SDK | OpenRouter provider |
| **MCP Server** | @vercel/mcp-adapter | Model Context Protocol |
| **Video Processing** | MediaBunny | Browser-based video encoding |
| **Canvas Rendering** | HTML5 Canvas API | Manual rendering, no Three.js |
| **Animation Engine** | Custom | Bezier-easing interpolation |
| **i18n** | Paraglide JS | English + Italian |
| **Testing** | Vitest | Browser + Node environments |
| **Linting** | ESLint + Prettier | Flat config format |
| **Deployment** | Node.js adapter | Docker-ready |

---

## Architecture

### Application Structure

DevMotion follows a standard SvelteKit application structure with these key patterns:

```
Client (Browser)
├── Canvas Renderer (HTML5 Canvas)
├── Timeline Controller (Keyframe Management)
├── Project Store (Svelte Runes State)
└── AI Chat Interface (Vercel AI SDK)

Server (Node.js)
├── API Routes (SvelteKit endpoints)
├── MCP Server (Model Context Protocol)
├── Database Layer (Drizzle ORM)
└── Authentication (Better Auth)
```

### Data Flow

1. **User Actions** → Project Store (reactive state)
2. **Project Store** → localStorage (auto-save) or Database (manual save)
3. **AI Operations** → Mutation Functions → Project Store
4. **MCP Tools** → Mutation Functions → Database
5. **Canvas Rendering** → Read from Project Store → Interpolate → Draw

### Key Design Patterns

#### 1. Svelte 5 Runes for State Management

```typescript
// src/lib/stores/project.svelte.ts
class ProjectStore {
  project = $state<Project>(undefined!);
  selectedLayerId = $state<string | null>(null);
  isPlaying = $state(false);
  currentTime = $state(0);

  // Derived state
  get selectedLayer(): Layer | null {
    return this.project.layers.find(l => l.id === this.selectedLayerId) || null;
  }
}
```

#### 2. Zod Schemas as Single Source of Truth

All types are inferred from Zod schemas, ensuring runtime validation matches compile-time types:

```typescript
// src/lib/schemas/animation.ts
export const LayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: LayerTypeSchema,
  // ... more fields
});

export type Layer = z.infer<typeof LayerSchema>;
```

#### 3. Shared Mutation Logic

Mutations are pure functions shared between web app and MCP server:

```typescript
// src/lib/ai/mutations.ts
export function mutateCreateLayer(
  ctx: MutationContext,
  input: CreateLayerInput
): MutationResult<CreateLayerOutput> {
  // Modify ctx.project in place
  // Return structured result
}
```

#### 4. Layer Registry System

Layers are registered dynamically via a central registry:

```typescript
// src/lib/layers/registry.ts
export function registerLayer(type: string, component: Component, schema: ZodSchema) {
  // Register layer type with component and validation
}
```

---

## Directory Structure

```
devmotion/
├── src/
│   ├── routes/                      # SvelteKit routes (file-based routing)
│   │   ├── (app)/                   # Main application routes
│   │   │   ├── +page.svelte         # Editor UI (/)
│   │   │   ├── +layout.svelte       # App layout
│   │   │   └── p/[id]/              # Public project viewer
│   │   ├── (auth)/                  # Authentication routes
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (marketing)/             # Marketing pages
│   │   ├── api/                     # API endpoints
│   │   │   └── export/[id]/         # Video export endpoint
│   │   ├── mcp/                     # MCP server endpoint
│   │   │   └── +server.ts           # MCP handler
│   │   ├── render/[id]/             # Server-side rendering route
│   │   └── +layout.svelte           # Root layout
│   │
│   ├── lib/                         # Shared library code
│   │   ├── components/              # Svelte components
│   │   │   ├── editor/              # Editor-specific components
│   │   │   │   ├── canvas/          # Canvas viewport components
│   │   │   │   ├── timeline/        # Timeline components
│   │   │   │   ├── panels/          # Layers & properties panels
│   │   │   │   ├── toolbar.svelte   # Main toolbar
│   │   │   │   └── export-dialog.svelte
│   │   │   ├── ai/                  # AI chat interface
│   │   │   ├── ui/                  # Reusable UI components
│   │   │   └── layout/              # Layout components
│   │   │
│   │   ├── stores/                  # Global state stores
│   │   │   ├── project.svelte.ts    # Project state (Svelte 5 runes)
│   │   │   └── ui.svelte.ts         # UI state
│   │   │
│   │   ├── engine/                  # Animation engine
│   │   │   ├── interpolation.ts     # Keyframe interpolation
│   │   │   ├── layer-rendering.ts   # Layer rendering utilities
│   │   │   ├── layer-factory.ts     # Layer creation
│   │   │   └── presets.ts           # Animation presets
│   │   │
│   │   ├── layers/                  # Layer type implementations
│   │   │   ├── components/          # Layer Svelte components
│   │   │   │   ├── TextLayer.svelte
│   │   │   │   ├── ShapeLayer.svelte
│   │   │   │   ├── HtmlLayer.svelte
│   │   │   │   ├── IconLayer.svelte
│   │   │   │   └── MouseLayer.svelte
│   │   │   ├── base.ts              # Base layer interface
│   │   │   └── registry.ts          # Layer registry system
│   │   │
│   │   ├── schemas/                 # Zod schemas (source of truth)
│   │   │   ├── animation.ts         # Core animation types
│   │   │   └── background.ts        # Background/gradient types
│   │   │
│   │   ├── ai/                      # AI integration
│   │   │   ├── mutations.ts         # Shared mutation functions
│   │   │   ├── schemas.ts           # AI tool schemas
│   │   │   └── ai-operations.svelte.ts # Client-side AI operations
│   │   │
│   │   ├── server/                  # Server-only code
│   │   │   ├── db/                  # Database setup
│   │   │   │   ├── index.ts         # Drizzle client
│   │   │   │   └── schema/          # Drizzle schemas
│   │   │   │       ├── index.ts
│   │   │   │       ├── projects.ts
│   │   │   │       ├── auth.ts
│   │   │   │       └── ai.ts
│   │   │   └── services/            # Server services
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   └── video-capture.ts     # Video recording utilities
│   │   │
│   │   ├── hooks/                   # Custom Svelte hooks
│   │   │   └── is-mobile.svelte.ts
│   │   │
│   │   ├── functions/               # Server functions
│   │   └── constants/               # Constants
│   │
│   ├── hooks.ts                     # SvelteKit hooks
│   └── app.css                      # Global styles (Tailwind)
│
├── static/                          # Static assets
├── drizzle/                         # Drizzle migrations (auto-generated)
├── messages/                        # i18n translations
│   ├── en.json
│   └── it.json
│
├── svelte.config.js                 # SvelteKit configuration
├── vite.config.ts                   # Vite configuration
├── tailwind.config.ts               # Tailwind configuration
├── tsconfig.json                    # TypeScript configuration
├── eslint.config.js                 # ESLint configuration (flat config)
├── drizzle.config.ts                # Drizzle Kit configuration
├── docker-compose.yaml              # Docker Compose for development
├── package.json                     # Dependencies and scripts
├── .env.example                     # Environment variables template
├── README.md                        # Project documentation
├── ANIMATION_EDITOR.md              # Editor user guide
└── CLAUDE.md                        # This file (AI assistant guide)
```

### Important Files

| File | Purpose |
|------|---------|
| `src/lib/stores/project.svelte.ts` | Global project state using Svelte 5 runes |
| `src/lib/schemas/animation.ts` | Core type definitions (Zod schemas) |
| `src/lib/ai/mutations.ts` | Shared mutation logic for web + MCP |
| `src/lib/engine/interpolation.ts` | Keyframe interpolation with easing |
| `src/routes/mcp/+server.ts` | MCP server implementation |
| `src/lib/layers/registry.ts` | Dynamic layer type registration |
| `src/lib/server/db/schema/` | Database schema definitions |

---

## Development Workflows

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/epavanello/devmotion.git
cd devmotion

# 2. Install dependencies (MUST use pnpm)
pnpm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration:
# - DATABASE_URL (PostgreSQL connection string)
# - BETTER_AUTH_SECRET (random string)
# - GOOGLE_CLIENT_ID/SECRET (for OAuth)
# - OPENROUTER_API_KEY (for AI features)

# 4. Start PostgreSQL (Docker)
pnpm db:start

# 5. Push database schema
pnpm db:push

# 6. Start development server
pnpm dev
# Opens at http://localhost:5173
```

### Development Commands

```bash
# Development
pnpm dev              # Start dev server (with inspector on port 6000)
pnpm build            # Build for production
pnpm preview          # Preview production build

# Code Quality
pnpm check            # Type-check with svelte-check
pnpm check:watch      # Type-check in watch mode
pnpm lint             # Run ESLint + Prettier check
pnpm lint:fix         # Auto-fix ESLint issues
pnpm format           # Format code with Prettier

# Testing
pnpm test             # Run all tests (Vitest)
pnpm test:unit        # Run tests in watch mode

# Database
pnpm db:start         # Start PostgreSQL via Docker Compose
pnpm db:push          # Push schema to database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio (DB GUI)
```

### Git Workflow

1. **Feature branches**: Create from `main` with descriptive names
2. **Commits**: Clear, concise messages in present tense
3. **Pull requests**: Include description, screenshots for UI changes
4. **Code review**: Required before merging

### Environment Variables

Required environment variables (see `.env.example`):

```bash
# Base URL for the application
PUBLIC_BASE_URL=http://localhost:5173

# Database connection
PRIVATE_DATABASE_URL="postgres://user:password@localhost:5432/devmotion"

# Authentication
PRIVATE_BETTER_AUTH_SECRET="random-secret-string"

# Google OAuth (optional)
PRIVATE_GOOGLE_CLIENT_ID="your-google-client-id"
PRIVATE_GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AI Features (optional)
OPENROUTER_API_KEY="your-openrouter-api-key"
```

---

## Code Conventions

### TypeScript

- **Strict mode**: Always enabled
- **Type inference**: Prefer inference over explicit types
- **No `any`**: Use `unknown` or proper types
- **Zod schemas**: Define runtime types, infer TypeScript types

```typescript
// ✅ Good: Infer from Zod schema
export const UserSchema = z.object({ name: z.string() });
export type User = z.infer<typeof UserSchema>;

// ❌ Bad: Duplicate type definition
export type User = { name: string };
export const UserSchema = z.object({ name: z.string() });
```

### Svelte 5 Runes

- Use Svelte 5 runes API (not legacy stores)
- `$state` for reactive state
- `$derived` for computed values
- `$effect` for side effects
- `$props()` for component props

```svelte
<script lang="ts">
  // Component props
  let { value, onChange }: { value: number; onChange: (n: number) => void } = $props();

  // Reactive state
  let count = $state(0);

  // Derived state
  let doubled = $derived(count * 2);

  // Side effects
  $effect(() => {
    console.log('Count changed:', count);
  });
</script>
```

### Naming Conventions

- **Files**: `kebab-case.ts`, `PascalCase.svelte` for components
- **Components**: `PascalCase`
- **Functions**: `camelCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase`
- **Store files**: `name.svelte.ts` (Svelte 5 rune stores)

```typescript
// Constants
export const MAX_LAYERS = 100;

// Functions
export function createLayer(type: LayerType): Layer { }

// Types
export type Project = z.infer<typeof ProjectSchema>;

// Classes
export class ProjectStore { }
```

### Code Style (Prettier)

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100
}
```

### ESLint Rules

- No unused variables (prefix with `_` to ignore)
- No `console.log` in production code (use proper logging)
- Svelte-specific rules enforced
- TypeScript-specific rules enforced

### Import Organization

```typescript
// 1. External dependencies
import { z } from 'zod';
import { nanoid } from 'nanoid';

// 2. SvelteKit imports
import { page } from '$app/state';

// 3. Internal lib imports
import type { Project } from '$lib/types/animation';
import { projectStore } from '$lib/stores/project.svelte';

// 4. Relative imports
import { helper } from './utils';
```

### File Organization

Within a file:
1. Imports
2. Type definitions
3. Constants
4. Helper functions
5. Main export (component, class, or default export)

---

## Key Concepts

### 1. Project Structure

A **Project** is the root data structure containing all animation data:

```typescript
type Project = {
  id: string;
  name: string;
  width: number;        // Canvas width in pixels
  height: number;       // Canvas height in pixels
  duration: number;     // Duration in seconds
  fps: number;          // Frames per second
  background: string;   // Background color or gradient
  layers: Layer[];      // Array of layers
};
```

### 2. Layers

**Layers** are the building blocks of animations. Each layer has:

```typescript
type Layer = {
  id: string;
  name: string;
  type: LayerType;      // 'text' | 'shape' | 'html' | 'icon' | 'mouse'
  transform: Transform;  // Position, rotation, scale
  style: LayerStyle;    // Opacity, etc.
  visible: boolean;
  locked: boolean;
  keyframes: Keyframe[];
  props: Record<string, unknown>; // Layer-specific properties
};
```

**Layer Types**:
- `text`: Animated text with font, size, color
- `shape`: Rectangles, circles, triangles
- `html`: Custom HTML content
- `icon`: Lucide icons
- `mouse`: Mouse cursor animations

### 3. Keyframes

**Keyframes** define property values at specific times:

```typescript
type Keyframe = {
  id: string;
  time: number;         // Time in seconds
  property: string;     // e.g., 'position.x', 'opacity', 'props.fontSize'
  value: number | string | boolean;
  easing: Easing;       // Interpolation curve
};
```

**Animatable Properties**:
- `position.x`, `position.y`, `position.z`
- `scale.x`, `scale.y`, `scale.z`
- `rotation.x`, `rotation.y`, `rotation.z`
- `opacity`
- `color`
- `props.*` (layer-specific, e.g., `props.fontSize`)

### 4. Easing

**Easing** controls interpolation between keyframes:

```typescript
type Easing = {
  type: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'cubic-bezier';
  bezier?: { x1: number; y1: number; x2: number; y2: number };
};
```

### 5. Transform

**Transform** defines layer position, rotation, and scale:

```typescript
type Transform = {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  anchor: AnchorPoint; // Transform origin point
};
```

### 6. Animation Engine

The animation engine interpolates values between keyframes:

1. **Find surrounding keyframes** for the current time and property
2. **Calculate interpolation factor** (0 to 1) between keyframes
3. **Apply easing function** to the factor
4. **Interpolate value** based on type (number, color, etc.)

```typescript
// src/lib/engine/interpolation.ts
export function interpolateValue(
  from: KeyframeValue,
  to: KeyframeValue,
  progress: number,
  type: InterpolationType
): KeyframeValue {
  // Implementation depends on type (number, color, etc.)
}
```

### 7. MCP Server

The **MCP (Model Context Protocol) Server** exposes animation tools to Claude and other MCP clients:

- **Endpoint**: `/mcp` (HTTP SSE transport)
- **Tools**:
  - `create_project`: Create new animation project
  - `get_project`: Retrieve project state
  - `create_text_layer`, `create_shape_layer`, etc.: Add layers
  - `animate_layer`: Add keyframes to layers
  - `edit_layer`: Modify layer properties
  - `remove_layer`: Delete layers
  - `configure_project`: Update project settings

All tools accept a `projectId` parameter and use shared mutation functions.

### 8. Database Schema

**Projects** are stored in PostgreSQL:

```typescript
// src/lib/server/db/schema/projects.ts
export const project = pgTable('project', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  userId: text('user_id'), // Nullable for anonymous MCP projects
  data: jsonb('data').notNull(), // Full Project object
  isPublic: boolean('is_public').default(false),
  isMcp: boolean('is_mcp').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

### 9. AI Integration

AI features use Vercel AI SDK with OpenRouter:

- **Chat interface**: Conversational project editing
- **Tool calling**: AI calls mutation functions to modify projects
- **Streaming**: Real-time AI responses

```typescript
// src/routes/(app)/chat/+server.ts
import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const result = streamText({
  model: openrouter('anthropic/claude-3.5-sonnet'),
  tools: animationTools,
  // ...
});
```

---

## Testing

### Test Structure

Tests are split into two environments:

1. **Client tests** (Vitest browser mode with Playwright):
   - Files: `*.svelte.spec.ts`, `*.svelte.test.ts`
   - Location: Anywhere in `src/` except `src/lib/server/`
   - Environment: Chromium browser

2. **Server tests** (Vitest node mode):
   - Files: `*.spec.ts`, `*.test.ts`
   - Location: Anywhere in `src/`
   - Environment: Node.js

### Running Tests

```bash
pnpm test              # Run all tests once
pnpm test:unit         # Run tests in watch mode
```

### Writing Tests

#### Client/Component Tests

```typescript
// src/lib/components/Button.svelte.spec.ts
import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import Button from './Button.svelte';

test('renders button with text', async () => {
  render(Button, { props: { text: 'Click me' } });
  expect(screen.getByText('Click me')).toBeInTheDocument();
});
```

#### Server/Logic Tests

```typescript
// src/lib/engine/interpolation.spec.ts
import { describe, it, expect } from 'vitest';
import { interpolateNumber } from './interpolation';

describe('interpolateNumber', () => {
  it('interpolates between two numbers', () => {
    expect(interpolateNumber(0, 100, 0.5)).toBe(50);
  });
});
```

---

## Common Tasks

### 1. Adding a New Layer Type

1. **Create layer component**:

```svelte
<!-- src/lib/layers/components/MyLayer.svelte -->
<script lang="ts">
  import { z } from 'zod';

  // Define props schema
  export const MyLayerPropsSchema = z.object({
    customProp: z.string().default('default')
  });

  // Component props
  let { layer, time } = $props<{ layer: Layer; time: number }>();
</script>

<div>
  <!-- Layer rendering -->
</div>
```

2. **Register layer**:

```typescript
// src/lib/layers/components/MyLayer.svelte
import { registerLayer } from '$lib/layers/registry';
import MyLayer, { MyLayerPropsSchema } from './MyLayer.svelte';

registerLayer('my-layer', MyLayer, MyLayerPropsSchema);
```

3. **Add to AI tools** (optional):

```typescript
// src/lib/ai/schemas.ts
export const animationTools = {
  create_my_layer: {
    description: 'Create a custom layer',
    inputSchema: z.object({
      name: z.string(),
      customProp: z.string()
    })
  }
};
```

### 2. Adding an Animation Preset

```typescript
// src/lib/engine/presets.ts
export const presets: AnimationPreset[] = [
  {
    id: 'my-preset',
    name: 'My Animation',
    keyframes: [
      { time: 0, property: 'opacity', value: 0, easing: { type: 'ease-in' } },
      { time: 1, property: 'opacity', value: 1, easing: { type: 'ease-out' } }
    ]
  }
];
```

### 3. Adding a Database Table

1. **Define schema**:

```typescript
// src/lib/server/db/schema/my-table.ts
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const myTable = pgTable('my_table', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});
```

2. **Export from index**:

```typescript
// src/lib/server/db/schema/index.ts
export * from './my-table';
```

3. **Generate migration**:

```bash
pnpm db:generate
```

4. **Push to database**:

```bash
pnpm db:push
```

### 4. Adding an API Endpoint

```typescript
// src/routes/api/my-endpoint/+server.ts
import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
  // Handle GET request
  return json({ message: 'Hello' });
};

export const POST: RequestHandler = async ({ request }) => {
  const data = await request.json();
  // Handle POST request
  return json({ success: true });
};
```

### 5. Adding an MCP Tool

```typescript
// src/routes/mcp/+server.ts
server.registerTool(
  'my_tool',
  {
    description: 'Description of the tool',
    inputSchema: z.object({
      projectId: z.string(),
      param: z.string()
    })
  },
  async ({ projectId, param }) => {
    // Tool implementation
    return {
      content: [{ type: 'text', text: 'Result' }]
    };
  }
);
```

### 6. Modifying Project Store

```typescript
// Add a new method to ProjectStore
class ProjectStore {
  // ... existing code

  myNewMethod(param: string) {
    // Modify this.project
    this.project = { ...this.project, name: param };
  }
}
```

**Important**: Store modifications automatically trigger:
- Local storage save (debounced)
- Reactive UI updates

---

## Troubleshooting

### Common Issues

#### 1. "Module not found" errors

**Solution**: Ensure you're using `pnpm` (not npm/yarn) and run `pnpm install`.

#### 2. Database connection errors

**Solution**:
```bash
# Start PostgreSQL
pnpm db:start

# Push schema
pnpm db:push

# Check environment variable
echo $PRIVATE_DATABASE_URL
```

#### 3. Type errors after schema changes

**Solution**:
```bash
# Regenerate types
pnpm prepare

# Restart TypeScript server in your editor
```

#### 4. Tests failing in CI but passing locally

**Solution**: Ensure Playwright browsers are installed:
```bash
pnpm exec playwright install chromium
```

#### 5. Canvas not rendering

**Solution**:
- Check `projectStore.project` has valid dimensions
- Verify layers have visible=true
- Check transform values are not NaN

#### 6. MCP server not responding

**Solution**:
- Check `/mcp` endpoint is accessible
- Verify environment variables are set
- Check server logs for errors
- Test with `curl -X POST http://localhost:5173/mcp`

#### 7. Video export stuck or slow

**Solution**:
- Check browser console for errors
- Reduce video quality or duration
- Clear frame cache and retry: `projectStore.clearFrameCache()`

### Debug Tools

```bash
# Start dev server with Node inspector
pnpm dev
# Attach debugger at chrome://inspect

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Check build output
pnpm build
```

### Logging

```typescript
// Use console methods appropriately
console.log('Info message');     // Development only
console.warn('Warning');         // Warnings
console.error('Error:', error);  // Errors

// Production logging (use a proper logger)
import { logger } from '$lib/server/logger';
logger.info('Info message');
```

---

## Best Practices

### 1. State Management

- ✅ Use `projectStore` for global project state
- ✅ Use local `$state` for component-specific state
- ✅ Keep state minimal and derived values as `$derived`
- ❌ Don't duplicate state between store and components

### 2. Performance

- ✅ Use frame cache for video export (`prepareRecording()`)
- ✅ Debounce expensive operations (e.g., auto-save)
- ✅ Use `$derived` for computed values (cached automatically)
- ❌ Don't recalculate values unnecessarily

### 3. Type Safety

- ✅ Define Zod schemas first, infer TypeScript types
- ✅ Use strict TypeScript mode
- ✅ Validate external data with Zod
- ❌ Don't use `any` or `@ts-ignore` without good reason

### 4. Error Handling

- ✅ Handle errors gracefully with user-friendly messages
- ✅ Log errors for debugging
- ✅ Use try-catch for async operations
- ❌ Don't let unhandled errors crash the app

### 5. Database

- ✅ Use Drizzle ORM for type-safe queries
- ✅ Use transactions for multi-step operations
- ✅ Index frequently queried columns
- ❌ Don't expose raw SQL queries to clients

### 6. Security

- ✅ Validate all user input with Zod
- ✅ Sanitize HTML content (use DOMPurify)
- ✅ Use environment variables for secrets
- ❌ Don't commit secrets to Git
- ❌ Don't trust client-side validation alone

### 7. Testing

- ✅ Test critical paths and edge cases
- ✅ Use descriptive test names
- ✅ Mock external dependencies
- ❌ Don't test implementation details

---

## Additional Resources

### Documentation

- [README.md](./README.md): Project overview and quick start
- [ANIMATION_EDITOR.md](./ANIMATION_EDITOR.md): User guide for the editor
- [SvelteKit Docs](https://kit.svelte.dev/docs): Framework documentation
- [Svelte 5 Docs](https://svelte.dev/docs/svelte/overview): Runes API reference
- [Drizzle ORM Docs](https://orm.drizzle.team/): Database ORM documentation
- [Vercel AI SDK](https://sdk.vercel.ai/docs): AI integration documentation

### Project Links

- **Live App**: https://devmotion.app
- **GitHub**: https://github.com/epavanello/devmotion
- **Issues**: https://github.com/epavanello/devmotion/issues

---

## Changelog

This CLAUDE.md file should be updated when:

- New major features are added
- Architecture changes significantly
- New conventions are established
- Breaking changes occur

**Last Updated**: 2026-02-05
**Version**: 1.0.0
