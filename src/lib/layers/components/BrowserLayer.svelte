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
    browserColor: z
      .string()
      .default('#f3f4f6')
      .describe(
        'The color of the browser chrome (toolbar area and window frame) in hexadecimal. Use light grays for Chrome-style, dark colors for dark mode. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'chrome',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Chrome Color'
      }),
    barBackgroundColor: z
      .string()
      .default('#ffffff')
      .describe(
        'The background color of the address bar and tab bar in hexadecimal. Usually white or slightly off-white. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'chrome',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Bar Color'
      }),
    textColor: z
      .string()
      .default('#1f2937')
      .describe(
        'The color of text, icons, and UI elements within the browser chrome in hexadecimal. Should contrast with the chrome color. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'chrome',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Text Color'
      }),
    showTabs: z
      .boolean()
      .default(true)
      .describe(
        'Whether to display the tab bar above the address bar. When true, shows a tab strip with a "New Tab" tab. Changes discretely (on/off).'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Show Tabs' }),
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
    description: 'Browser window mockup with address bar, tabs, and iframe to display websites',

    propertyGroups: [
      { id: 'size', label: 'Size', widget: AspectRatioToggle },
      { id: 'chrome', label: 'Chrome' }
    ],

    middleware: sizeMiddleware
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let { url, width, height, browserColor, barBackgroundColor, textColor, showTabs }: Props =
    $props();
</script>

<div
  class="flex flex-col overflow-hidden rounded-lg border border-gray-300 shadow-2xl"
  style:width="{width}px"
  style:height="{height}px"
  style:background-color={browserColor}
>
  <!-- Browser controls -->
  <div
    class="flex items-center gap-2 border-b px-4 py-2"
    style:border-color={textColor}
    style:background-color={browserColor}
  >
    <!-- Traffic lights -->
    <div class="flex gap-2">
      <div class="h-3 w-3 rounded-full bg-red-500"></div>
      <div class="h-3 w-3 rounded-full bg-yellow-500"></div>
      <div class="h-3 w-3 rounded-full bg-green-500"></div>
    </div>
  </div>

  <!-- Tab bar -->
  {#if showTabs}
    <div
      class="flex items-center gap-2 overflow-x-auto border-b px-4 py-2"
      style:border-color={textColor}
      style:background-color={barBackgroundColor}
    >
      <div
        class="flex items-center gap-2 rounded-t border bg-white px-3 py-1"
        style:border-color={textColor}
      >
        <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" style:color={textColor}>
          <path
            d="M10.5 1.5H3a1 1 0 00-1 1v15a1 1 0 001 1h14a1 1 0 001-1v-12a1 1 0 00-1-1h-7V2.5z"
          />
        </svg>
        <span class="text-xs font-semibold" style:color={textColor}>New Tab</span>
      </div>
      <button class="text-lg" style:color={textColor}>+</button>
    </div>
  {/if}

  <!-- Address bar -->
  <div
    class="flex items-center gap-2 border-b px-4 py-2"
    style:border-color={textColor}
    style:background-color={barBackgroundColor}
  >
    <svg
      class="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      style:color={textColor}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
    <svg
      class="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      style:color={textColor}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M13 5l7 7-7 7M5 5l7 7-7 7"
      />
    </svg>
    <div
      class="flex flex-1 items-center gap-2 rounded-full px-3 py-1 text-xs"
      style:background-color={browserColor}
    >
      <svg
        class="h-4 w-4 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        style:color={textColor}
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6v6m0 0v6m0-6h6m0 0h6m-6-6H6"
        />
      </svg>
      <span class="truncate text-xs" style:color={textColor}>{url}</span>
    </div>
    <div class="flex gap-2">
      <svg
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        style:color={textColor}
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
        />
      </svg>
      <svg
        class="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        style:color={textColor}
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    </div>
  </div>

  <!-- Content area -->
  <div class="flex-1 overflow-hidden">
    <iframe
      src={url}
      title="Browser content"
      class="pointer-events-none h-full w-full border-none"
      style:height="{height}px"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-modals"
    ></iframe>
  </div>
</div>
