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
      .describe('Terminal window title')
      .register(fieldRegistry, { interpolationFamily: 'text' }),
    content: z
      .string()
      .default('$ Welcome to terminal')
      .describe('Terminal content/text')
      .register(fieldRegistry, { widget: 'textarea', interpolationFamily: 'text' }),
    width: z
      .number()
      .min(200)
      .max(2000)
      .default(600)
      .describe('Width (px)')
      .register(fieldRegistry, { group: 'size', interpolationFamily: 'continuous' }),
    height: z
      .number()
      .min(150)
      .max(2000)
      .default(400)
      .describe('Height (px)')
      .register(fieldRegistry, { group: 'size', interpolationFamily: 'continuous' }),
    fontSize: z
      .number()
      .min(10)
      .max(32)
      .default(14)
      .describe('Font size (px)')
      .register(fieldRegistry, { interpolationFamily: 'continuous' }),
    backgroundColor: z
      .string()
      .default('#1e1e1e')
      .describe('Background color')
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        widget: 'color'
      }),
    textColor: z.string().default('#00ff00').describe('Text color').register(fieldRegistry, {
      group: 'appearance',
      interpolationFamily: 'continuous',
      widget: 'color'
    }),
    borderColor: z.string().default('#404040').describe('Border color').register(fieldRegistry, {
      group: 'appearance',
      interpolationFamily: 'continuous',
      widget: 'color'
    }),
    showBorder: z
      .boolean()
      .default(true)
      .describe('Show terminal border')
      .register(fieldRegistry, { interpolationFamily: 'discrete' }),
    _aspectRatioLocked: z
      .boolean()
      .default(false)
      .describe('Aspect ratio locked')
      .register(fieldRegistry, { hidden: true }),
    _aspectRatio: z
      .number()
      .default(1)
      .describe('Aspect ratio value')
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
