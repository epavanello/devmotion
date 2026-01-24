<script module lang="ts">
  import { z } from 'zod';

  /**
   * Schema for Phone Layer custom properties
   */
  export const PhoneLayerPropsSchema = z.object({
    url: z.string().default('https://example.com').describe('URL to display in iframe'),
    width: z.number().min(200).max(600).default(375).describe('Phone width (px)'),
    height: z.number().min(400).max(1200).default(667).describe('Phone height (px)'),
    phoneColor: z.string().default('#1f2937').describe('Phone frame color'),
    borderRadius: z.number().min(20).max(60).default(40).describe('Screen border radius (px)'),
    notchHeight: z.number().min(20).max(40).default(28).describe('Notch height (px)'),
    showNotch: z.boolean().default(true).describe('Show device notch'),
    bezelWidth: z.number().min(8).max(20).default(12).describe('Bezel width (px)')
  });

  export type PhoneLayerProps = z.infer<typeof PhoneLayerPropsSchema>;
</script>

<script lang="ts">
  let { url, width, height, phoneColor, borderRadius, notchHeight, showNotch, bezelWidth }: PhoneLayerProps = $props();
</script>

<div
  class="relative mx-auto shadow-2xl"
  style:width="{width}px"
  style:height="{height}px"
  style:background-color={phoneColor}
  style:border-radius="{borderRadius}px"
  style:padding="{bezelWidth}px"
>
  <!-- Notch -->
  {#if showNotch}
    <div
      class="absolute left-1/2 top-0 z-20 -translate-x-1/2 bg-black rounded-b-2xl"
      style:width="{width * 0.5}px"
      style:height="{notchHeight}px"
    ></div>
  {/if}

  <!-- Screen content -->
  <div
    class="relative w-full h-full overflow-hidden bg-white"
    style:border-radius="{borderRadius - bezelWidth}px"
  >
    <iframe
      src={url}
      title="Phone content"
      class="w-full h-full border-none pointer-events-none"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-modals"
    ></iframe>
  </div>

  <!-- Home indicator -->
  <div
    class="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-black bg-opacity-80 z-10"
    style:width="{width * 0.3}px"
    style:height="4px"
  ></div>
</div>
