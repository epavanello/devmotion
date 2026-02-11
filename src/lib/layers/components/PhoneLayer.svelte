<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Smartphone } from '@lucide/svelte';
  import { fieldRegistry } from '../base';
  import { sizeMiddleware } from '$lib/schemas/size';
  import AspectRatioToggle from '../properties/AspectRatioToggle.svelte';

  /**
   * Schema for Phone Layer custom properties
   */
  const schema = z.object({
    url: z.string().default('https://example.com').describe('URL to display in iframe'),
    width: z
      .number()
      .min(200)
      .max(600)
      .default(375)
      .describe('Phone width (px)')
      .register(fieldRegistry, { group: 'size', interpolationFamily: 'continuous' }),
    height: z
      .number()
      .min(400)
      .max(1200)
      .default(667)
      .describe('Phone height (px)')
      .register(fieldRegistry, { group: 'size', interpolationFamily: 'continuous' }),
    phoneColor: z
      .string()
      .default('#1f2937')
      .describe('Phone frame color')
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        widget: 'color'
      }),
    notchHeight: z
      .number()
      .min(20)
      .max(40)
      .default(28)
      .describe('Notch height (px)')
      .register(fieldRegistry, { group: 'appearance', interpolationFamily: 'continuous' }),
    showNotch: z
      .boolean()
      .default(true)
      .describe('Show device notch')
      .register(fieldRegistry, { interpolationFamily: 'discrete' }),
    borderRadius: z
      .number()
      .min(20)
      .max(60)
      .default(40)
      .describe('Screen border radius (px)')
      .register(fieldRegistry, { interpolationFamily: 'continuous' }),
    bezelWidth: z
      .number()
      .min(8)
      .max(20)
      .default(12)
      .describe('Bezel width (px)')
      .register(fieldRegistry, { group: 'appearance', interpolationFamily: 'continuous' }),
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

  export const meta: LayerMeta = {
    category: 'ui',
    schema,
    type: 'phone',
    label: 'Phone',
    icon: Smartphone,
    description: 'Mobile phone mockup with notch, bezel, and iframe for app/website previews',

    propertyGroups: [
      { id: 'size', label: 'Size', widget: AspectRatioToggle },
      { id: 'appearance', label: 'Appearance' }
    ],

    middleware: sizeMiddleware
  };

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let { url, width, height, phoneColor, borderRadius, notchHeight, showNotch, bezelWidth }: Props =
    $props();
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
      class="absolute top-0 left-1/2 z-20 -translate-x-1/2 rounded-b-2xl bg-black"
      style:width="{width * 0.5}px"
      style:height="{notchHeight}px"
    ></div>
  {/if}

  <!-- Screen content -->
  <div
    class="relative h-full w-full overflow-hidden bg-white"
    style:border-radius="{borderRadius - bezelWidth}px"
  >
    <iframe
      src={url}
      title="Phone content"
      class="pointer-events-none h-full w-full border-none"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation allow-modals"
    ></iframe>
  </div>

  <!-- Home indicator -->
  <div
    class="bg-opacity-80 absolute bottom-1 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black"
    style:width="{width * 0.3}px"
    style:height="4px"
  ></div>
</div>
