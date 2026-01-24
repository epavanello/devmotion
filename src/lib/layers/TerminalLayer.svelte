<script module lang="ts">
  import { z } from 'zod';

  /**
   * Schema for Terminal Layer custom properties
   */
  export const TerminalLayerPropsSchema = z.object({
    title: z.string().default('Terminal').describe('Terminal window title'),
    content: z.string().default('$ Welcome to terminal').describe('Terminal content/text'),
    width: z.number().min(200).max(2000).default(600).describe('Width (px)'),
    height: z.number().min(150).max(2000).default(400).describe('Height (px)'),
    backgroundColor: z.string().default('#1e1e1e').describe('Background color'),
    textColor: z.string().default('#00ff00').describe('Text color'),
    fontSize: z.number().min(10).max(32).default(14).describe('Font size (px)'),
    showBorder: z.boolean().default(true).describe('Show terminal border'),
    borderColor: z.string().default('#404040').describe('Border color')
  });

  export type TerminalLayerProps = z.infer<typeof TerminalLayerPropsSchema>;
</script>

<script lang="ts">
  let { title, content, width, height, backgroundColor, textColor, fontSize, showBorder, borderColor }: TerminalLayerProps = $props();
</script>

<div
  class="flex flex-col rounded-lg overflow-hidden"
  style:width="{width}px"
  style:height="{height}px"
  style:border={showBorder ? `1px solid ${borderColor}` : 'none'}
  style:background-color={backgroundColor}
>
  <!-- Header -->
  <div class="flex items-center justify-between px-4 py-2 border-b" style:border-color={borderColor}>
    <span class="text-xs font-semibold" style:color={textColor}>
      {title}
    </span>
    <div class="flex gap-1">
      <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
      <div class="w-3 h-3 rounded-full bg-orange-500"></div>
      <div class="w-3 h-3 rounded-full bg-red-500"></div>
    </div>
  </div>

  <!-- Content -->
  <div
    class="flex-1 p-4 font-mono overflow-hidden text-left whitespace-pre-wrap break-words"
    style:font-size="{fontSize}px"
    style:color={textColor}
  >
    {content}
  </div>
</div>
