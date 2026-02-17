<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Smartphone } from '@lucide/svelte';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';
  import { sizeMiddleware } from '$lib/schemas/size';
  import AspectRatioToggle from '../properties/AspectRatioToggle.svelte';

  /**
   * Schema for Phone Layer custom properties
   */
  const schema = z.object({
    url: z
      .string()
      .default('https://example.com')
      .describe(
        'The URL to display inside the phone screen iframe. The page is loaded in a sandboxed iframe at mobile viewport size. Note: some sites block embedding via X-Frame-Options.'
      ),
    width: z
      .number()
      .min(200)
      .max(600)
      .default(375)
      .describe(
        'The width of the phone device mockup in pixels, including the bezel frame. Common sizes: 375 (iPhone SE), 390 (iPhone 14). Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Width'
      }),
    height: z
      .number()
      .min(400)
      .max(1200)
      .default(667)
      .describe(
        'The height of the phone device mockup in pixels, including the bezel frame. Common sizes: 667 (iPhone SE), 844 (iPhone 14). Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Height'
      }),
    phoneColor: z
      .string()
      .default('#1f2937')
      .describe(
        'The color of the phone body/bezel frame in hexadecimal. Dark colors (black, space gray) match modern phones. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Frame Color'
      }),
    notchHeight: z
      .number()
      .min(20)
      .max(40)
      .default(28)
      .describe(
        'The height of the notch/dynamic island cutout at the top of the screen in pixels. Visible when showNotch is enabled. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        label: 'Notch Height'
      }),
    showNotch: z
      .boolean()
      .default(true)
      .describe(
        'Whether to display the camera notch at the top of the screen. Enable for modern phone look, disable for older/notchless design. Changes discretely (on/off).'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Show Notch' }),
    borderRadius: z
      .number()
      .min(20)
      .max(60)
      .default(40)
      .describe(
        'The corner radius of the phone body and screen in pixels. Higher values = more rounded corners. Typical modern phones use 40–50px. Smoothly animatable.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'Corner Radius' }),
    bezelWidth: z
      .number()
      .min(8)
      .max(20)
      .default(12)
      .describe(
        'The width of the phone bezel border around the screen in pixels. Smaller values = thinner, more modern look. Defines the padding between the frame edge and the screen. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        label: 'Bezel'
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
  } as const satisfies LayerMeta;

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
