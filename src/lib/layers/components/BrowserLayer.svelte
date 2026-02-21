<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Globe } from '@lucide/svelte';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';
  import { sizeMiddleware } from '$lib/schemas/size';
  import AspectRatioToggle from '../properties/AspectRatioToggle.svelte';

  /**
   * Schema for Browser Layer custom properties
   */
  const schema = z.object({
    url: z
      .string()
      .default('https://example.com')
      .describe(
        'The URL to display inside the browser iframe content area. The page is loaded in a sandboxed iframe. Note: some sites block embedding via X-Frame-Options.'
      ),
    width: z
      .number()
      .min(300)
      .max(2000)
      .default(1024)
      .describe(
        'The total width of the browser window mockup in pixels, including chrome. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Width'
      }),
    height: z
      .number()
      .min(300)
      .max(1200)
      .default(600)
      .describe(
        'The total height of the browser window mockup in pixels, including chrome. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Height'
      }),
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
    type: 'browser',
    label: 'Browser',
    icon: Globe,
    description: 'Realistic dark-themed browser window with minimal chrome',

    propertyGroups: [{ id: 'size', label: 'Size', widget: AspectRatioToggle }],

    middleware: sizeMiddleware
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let { url, width, height }: Props = $props();
</script>

<div
  class="flex flex-col overflow-hidden rounded-lg"
  style:width="{width}px"
  style:height="{height}px"
  style="background: #202124; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);"
>
  <!-- Titlebar with window controls -->
  <div class="flex items-center justify-between px-3 py-2.5" style="background: #202124;">
    <!-- macOS traffic lights -->
    <div class="flex gap-2">
      <div
        class="h-3 w-3 rounded-full"
        style="background: #ff5f57; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);"
      ></div>
      <div
        class="h-3 w-3 rounded-full"
        style="background: #febc2e; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);"
      ></div>
      <div
        class="h-3 w-3 rounded-full"
        style="background: #28c840; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);"
      ></div>
    </div>
  </div>

  <!-- Address bar -->
  <div class="flex items-center gap-3 px-3 pb-3" style="background: #202124;">
    <div
      class="flex flex-1 items-center gap-2 rounded-md px-3 py-1.5"
      style="background: #2d2e30; border: 1px solid #3c3d40;"
    >
      <!-- Lock icon -->
      <svg
        class="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="#8e8f93"
        viewBox="0 0 24 24"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
      <span class="truncate text-xs" style="color: #e8e8e9; font-weight: 400;">{url}</span>
    </div>
  </div>

  <!-- Content area -->
  <div class="flex-1 overflow-hidden" style="background: #fff;">
    <iframe
      src={url}
      title="Browser content"
      class="pointer-events-none h-full w-full border-none"
      style:height="{height}px"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-modals"
    ></iframe>
  </div>
</div>
