# CLAUDE.md - DevMotion AI Assistant Guide

Quick reference for AI assistants working with DevMotion, an animation editor built with SvelteKit.

---

## Core Architecture Patterns

### 1. **Svelte 5 Runes** - Use exclusively, no legacy stores
```typescript
let count = $state(0);              // Reactive state
let doubled = $derived(count * 2);  // Computed values
$effect(() => { /* side effects */ });
```

### 2. **Zod-First Types** - Single source of truth
```typescript
// Define schema first, infer types
export const LayerSchema = z.object({ /* ... */ });
export type Layer = z.infer<typeof LayerSchema>;
```

### 3. **Shared Mutations** - Web app and MCP server share logic
```typescript
// src/lib/ai/mutations.ts - pure functions that modify Project objects
export function mutateCreateLayer(ctx: MutationContext, input) { }
```

### 4. **Layer Registry** - Dynamic layer type system
```typescript
// Register layer components with validation schemas
registerLayer('my-layer', Component, PropsSchema);
```

---

## Key File Locations

| What | Where |
|------|-------|
| **Global state** | `src/lib/stores/project.svelte.ts` (ProjectStore class) |
| **Type definitions** | `src/lib/schemas/animation.ts` (Zod schemas) |
| **Shared mutations** | `src/lib/ai/mutations.ts` (web + MCP) |
| **Animation engine** | `src/lib/engine/interpolation.ts` |
| **Layer components** | `src/lib/layers/components/` |
| **MCP server** | `src/routes/mcp/+server.ts` |
| **Database schemas** | `src/lib/server/db/schema/` |

---

## Essential Conventions

### Code Style
- **Package manager**: `pnpm` only (not npm/yarn)
- **Naming**: `kebab-case.ts`, `PascalCase.svelte`, `camelCase` functions
- **Imports**: External → SvelteKit → Internal → Relative
- **Store files**: `name.svelte.ts` suffix for rune-based stores
- **Prettier**: 2 spaces, single quotes, no trailing commas, 100 line width

### TypeScript
- Strict mode always on
- Prefer type inference over explicit types
- No `any` - use `unknown` or proper types
- Prefix unused vars with `_`

### Project Structure
```
src/lib/
├── stores/           # Global state (Svelte 5 runes)
├── schemas/          # Zod schemas (source of truth for types)
├── engine/           # Animation interpolation & rendering
├── layers/           # Layer type components & registry
├── ai/              # Shared mutation logic for web + MCP
├── components/       # UI components (editor/, ui/, ai/)
└── server/          # Server-only code (db/, services/)
```

---

## Core Data Types

```typescript
// Project - Root animation data
{ id, name, width, height, duration, fps, background, layers[] }

// Layer - Animation building blocks
{ id, name, type, transform, style, visible, locked, keyframes[], props }

// Keyframe - Property values at specific times
{ id, time, property, value, easing }

// Transform - Position, rotation, scale
{ x, y, z, rotationX/Y/Z, scaleX/Y/Z, anchor }
```

### Animatable Properties
- Built-in: `position.x/y/z`, `scale.x/y/z`, `rotation.x/y/z`, `opacity`, `color`
- Custom: `props.fontSize`, `props.fill`, etc.

---

## Common Tasks

### Adding a Layer Type
1. Create component in `src/lib/layers/components/`
2. Export props schema: `export const MyLayerPropsSchema = z.object({ ... })`
3. Call `registerLayer('my-layer', MyComponent, MyLayerPropsSchema)`

### Modifying Project Store
```typescript
// src/lib/stores/project.svelte.ts
class ProjectStore {
  myMethod() {
    this.project = { ...this.project, /* changes */ };
    // Auto-saves to localStorage (debounced)
  }
}
```

### Database Changes
```bash
# 1. Define schema in src/lib/server/db/schema/
# 2. Export from schema/index.ts
pnpm db:generate  # Generate migration
pnpm db:push      # Apply to database
```

### Adding MCP Tools
```typescript
// src/routes/mcp/+server.ts
server.registerTool('tool_name', {
  description: '...',
  inputSchema: z.object({ projectId: z.string(), /* ... */ })
}, async ({ projectId, ...params }) => {
  // Use shared mutations from src/lib/ai/mutations.ts
});
```

---

## Development Workflow

```bash
pnpm install          # Install (must use pnpm!)
cp .env.example .env  # Configure environment
pnpm db:start         # Start PostgreSQL (Docker)
pnpm db:push          # Push schema
pnpm dev              # Start dev server (localhost:5173)

# Other commands
pnpm lint             # ESLint + Prettier check
pnpm lint:fix         # Auto-fix
pnpm format           # Format with Prettier
pnpm test             # Run tests (Vitest)
pnpm db:studio        # Database GUI
```

---

## Critical Patterns to Follow

### ✅ DO
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Define Zod schemas first, infer TypeScript types
- Use `projectStore` for global animation state
- Share mutation logic between web app and MCP
- Validate external data with Zod
- Use `pnpm` exclusively

### ❌ DON'T
- Use legacy Svelte stores (`writable`, `derived`)
- Duplicate type definitions (Zod + TypeScript)
- Mutate state directly without reactivity
- Use `any` type or `@ts-ignore` casually
- Use npm/yarn (breaks lockfile)
- Duplicate mutation logic between web/MCP

---

## Animation Engine Flow

1. Find keyframes surrounding current time for property
2. Calculate interpolation factor (0-1) between keyframes
3. Apply easing function (bezier curves)
4. Interpolate value based on type (number, color, discrete)
5. Apply to layer transform/style/props

See `src/lib/engine/interpolation.ts` for implementation.

---

## MCP Server Architecture

- **Endpoint**: `/mcp` (HTTP SSE transport via `@vercel/mcp-adapter`)
- **Tools**: `create_project`, `get_project`, layer CRUD, animations
- **Storage**: Anonymous projects in PostgreSQL (userId nullable)
- **Logic**: Uses shared mutations from `src/lib/ai/mutations.ts`

---

## Testing

- **Client tests**: `*.svelte.spec.ts` (Vitest browser + Playwright)
- **Server tests**: `*.spec.ts` (Vitest Node environment)
- Run with `pnpm test` or `pnpm test:unit` (watch mode)

---

## Environment Variables

```bash
PUBLIC_BASE_URL                    # App URL
PRIVATE_DATABASE_URL               # PostgreSQL connection
PRIVATE_BETTER_AUTH_SECRET         # Auth secret
PRIVATE_GOOGLE_CLIENT_ID/SECRET    # OAuth (optional)
OPENROUTER_API_KEY                 # AI features (optional)
```

---

## When You Need More Details

- **User guide**: See `ANIMATION_EDITOR.md`
- **Project overview**: See `README.md`
- **Specific implementations**: Read the source files directly
- **Type definitions**: Check `src/lib/schemas/animation.ts`
- **Layer examples**: Look at existing layer components

**Last Updated**: 2026-02-05
