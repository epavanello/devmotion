<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Terminal } from '@lucide/svelte';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';
  import { sizeMiddleware } from '$lib/schemas/size';
  import AspectRatioToggle from '../properties/AspectRatioToggle.svelte';

  /**
   * Schema for Terminal Layer custom properties
   */
  const schema = z.object({
    title: z
      .string()
      .default('Terminal')
      .describe(
        'The title text displayed in the terminal window header bar. Typically the shell name or current directory (e.g., "bash", "zsh", "~/projects"). Animatable with text interpolation.'
      )
      .register(fieldRegistry, { interpolationFamily: 'text', label: 'Title' }),
    content: z
      .string()
      .default('$ Welcome to terminal')
      .describe(
        'The text content displayed in the terminal body. Write multi-line content with newlines. Supports the $ prompt prefix and any terminal output. Animatable with text interpolation for typewriter effects.'
      )
      .register(fieldRegistry, {
        widget: 'textarea',
        interpolationFamily: 'text',
        label: 'Content'
      }),
    width: z
      .number()
      .min(200)
      .max(2000)
      .default(600)
      .describe('The width of the terminal window in pixels. Smoothly animatable.')
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Width'
      }),
    height: z
      .number()
      .min(150)
      .max(2000)
      .default(400)
      .describe('The height of the terminal window in pixels. Smoothly animatable.')
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Height'
      }),
    fontSize: z
      .number()
      .min(10)
      .max(32)
      .default(14)
      .describe(
        'The font size of terminal text in pixels. Uses a monospace font. Larger values improve readability in presentations. Smoothly animatable.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'Font Size' }),
    backgroundColor: z
      .string()
      .default('#1e1e1e')
      .describe(
        'The background color of the terminal body in hexadecimal. Classic terminals use black (#000000) or dark gray (#1e1e1e). Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Background'
      }),
    textColor: z
      .string()
      .default('#00ff00')
      .describe(
        'The text color inside the terminal in hexadecimal. Classic terminals use green (#00ff00) or white (#ffffff). Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Text Color'
      }),
    borderColor: z
      .string()
      .default('#404040')
      .describe(
        'The border/outline color of the terminal window in hexadecimal. Visible when showBorder is enabled. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Border Color'
      }),
    showBorder: z
      .boolean()
      .default(true)
      .describe(
        'Whether to display a border/outline around the terminal window. When true, draws a 1px border using the borderColor. Changes discretely (on/off).'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Show Border' }),
    _aspectRatioLocked: z
      .boolean()
      .default(false)
      .describe('Internal property: whether aspect ratio is locked during resize')
      .register(fieldRegistry, { hidden: true }),
    _aspectRatio: z
      .number()
      .default(1)
      .describe('Internal property: stored aspect ratio value when locked')
      .register(fieldRegistry, { hidden: true })
  });

  export const meta = {
    category: 'code',
    schema,
    type: 'terminal',
    label: 'Terminal',
    icon: Terminal,
    description: 'Terminal window with customizable content, colors, and monospace font display',

    propertyGroups: [
      { id: 'size', label: 'Size', widget: AspectRatioToggle },
      { id: 'appearance', label: 'Appearance' }
    ],

    middleware: sizeMiddleware
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let {
    title,
    content,
    width,
    height,
    backgroundColor,
    textColor,
    fontSize,
    showBorder,
    borderColor
  }: Props = $props();
</script>

<div
  class="flex flex-col overflow-hidden rounded-lg"
  style:width="{width}px"
  style:height="{height}px"
  style:border={showBorder ? `1px solid ${borderColor}` : 'none'}
  style:background-color={backgroundColor}
>
  <!-- Header -->
  <div
    class="flex items-center justify-between border-b px-4 py-2"
    style:border-color={borderColor}
  >
    <span class="text-xs font-semibold" style:color={textColor}>
      {title}
    </span>
    <div class="flex gap-1">
      <div class="h-3 w-3 rounded-full bg-yellow-500"></div>
      <div class="h-3 w-3 rounded-full bg-orange-500"></div>
      <div class="h-3 w-3 rounded-full bg-red-500"></div>
    </div>
  </div>

  <!-- Content -->
  <div
    class="flex-1 overflow-hidden p-4 text-left font-mono wrap-break-word whitespace-pre-wrap"
    style:font-size="{fontSize}px"
    style:color={textColor}
  >
    {content}
  </div>
</div>
