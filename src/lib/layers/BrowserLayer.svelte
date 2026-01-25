<script module lang="ts">
  import { z } from 'zod';

  /**
   * Schema for Browser Layer custom properties
   */
  export const schema = z.object({
    url: z.string().default('https://example.com').describe('URL to display in iframe'),
    width: z.number().min(300).max(2000).default(1024).describe('Browser width (px)'),
    height: z.number().min(300).max(1200).default(600).describe('Browser height (px)'),
    browserColor: z.string().default('#f3f4f6').describe('Browser chrome color'),
    barBackgroundColor: z.string().default('#ffffff').describe('Address bar background'),
    textColor: z.string().default('#1f2937').describe('Text color in chrome'),
    showDevTools: z.boolean().default(false).describe('Show dev tools panel'),
    devToolsHeight: z.number().min(100).max(600).default(200).describe('Dev tools height (px)'),
    showTabs: z.boolean().default(true).describe('Show tab bar')
  });

  export type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let {
    url,
    width,
    height,
    browserColor,
    barBackgroundColor,
    textColor,
    showDevTools,
    devToolsHeight,
    showTabs
  }: Props = $props();

  const contentHeight = $derived(showDevTools ? height - 90 - devToolsHeight : height - 90);
</script>

<div
  class="flex flex-col overflow-hidden rounded-lg border border-gray-300 shadow-2xl"
  style:width="{width}px"
  style:height={showDevTools ? `${height}px` : `${height}px`}
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
      style:height="{contentHeight}px"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-modals"
    ></iframe>
  </div>

  <!-- Dev tools -->
  {#if showDevTools}
    <div
      class="flex flex-col border-t"
      style:border-color={textColor}
      style:background-color={barBackgroundColor}
      style:height="{devToolsHeight}px"
    >
      <div
        class="flex items-center gap-2 border-b px-4 py-2 text-xs font-semibold"
        style:border-color={textColor}
        style:color={textColor}
      >
        <span>Elements</span>
        <span>Console</span>
        <span>Sources</span>
      </div>
      <div class="flex-1 overflow-auto px-4 py-2 font-mono text-xs" style:color={textColor}>
        <div>&lt;html&gt;</div>
        <div class="ml-4">&lt;head&gt; ... &lt;/head&gt;</div>
        <div class="ml-4">&lt;body&gt; ... &lt;/body&gt;</div>
        <div>&lt;/html&gt;</div>
      </div>
    </div>
  {/if}
</div>
