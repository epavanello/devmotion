<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Type } from '@lucide/svelte';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';
  import { googleFontValues } from '$lib/utils/fonts';
  import ApplyFont from '$lib/components/font/apply-font.svelte';
  import FontProperty from '../properties/FontProperty.svelte';

  /**
   * Schema for Text Layer custom properties
   */
  const schema = z.object({
    content: z
      .string()
      .default('New Text')
      .describe(
        'The text content to display. Supports text interpolation for typewriter effects (character-by-character or word-by-word reveal animations). Animatable using the text interpolation family.'
      )
      .register(fieldRegistry, { interpolationFamily: 'text', label: 'Content' }),
    fontSize: z
      .number()
      .min(8)
      .max(500)
      .default(48)
      .describe(
        'The font size in pixels. Controls how large the text appears. Smoothly animatable using continuous interpolation.'
      )
      .register(fieldRegistry, {
        group: 'typography',
        interpolationFamily: 'continuous',
        label: 'Size'
      }),
    fontFamily: z
      .enum(googleFontValues)
      .optional()
      .describe(
        'The font family from Google Fonts library. Determines the typeface style. Can be changed discretely (no smooth animation between fonts).'
      )
      .register(fieldRegistry, {
        interpolationFamily: 'discrete',
        widget: 'custom',
        component: FontProperty,
        label: 'Font'
      }),
    fontWeight: z
      .enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'])
      .default('normal')
      .describe(
        'The font weight/thickness. Options range from 100 (thin) to 900 (black), or named values normal/bold. Changes discretely.'
      )
      .register(fieldRegistry, {
        group: 'typography',
        interpolationFamily: 'discrete',
        label: 'Weight'
      }),
    color: z
      .string()
      .default('#ffffff')
      .describe(
        'The text color in hexadecimal format (e.g., #ffffff for white). Smoothly animatable between colors using continuous interpolation for color transitions.'
      )
      .register(fieldRegistry, {
        group: 'typography',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Color'
      }),
    letterSpacing: z
      .number()
      .min(-10)
      .max(100)
      .default(0)
      .describe(
        'The spacing between individual letters in pixels. Positive values spread letters apart, negative values bring them closer. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'spacing',
        interpolationFamily: 'continuous',
        label: 'Letter Spacing'
      }),
    lineHeight: z
      .number()
      .min(0.5)
      .max(5)
      .default(1.4)
      .describe(
        'The vertical spacing between lines as a multiplier of font size. 1.0 = single spacing, 1.5 = one-and-a-half spacing, etc. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'spacing',
        interpolationFamily: 'continuous',
        label: 'Line Height'
      }),
    autoWidth: z
      .boolean()
      .default(true)
      .describe(
        'Whether the text container automatically adjusts its width to fit content. When true, text stays on one line. When false, uses the specified width property for wrapping.'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Auto Width' }),
    width: z
      .number()
      .min(10)
      .max(5000)
      .default(400)
      .describe(
        'The fixed width of the text container in pixels when autoWidth is disabled. Text wraps to multiple lines if it exceeds this width. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'layout',
        interpolationFamily: 'continuous',
        label: 'Width'
      }),
    textAlign: z
      .enum(['left', 'center', 'right'])
      .default('center')
      .describe(
        'The horizontal alignment of text within its container. Left aligns to the start, center to the middle, right to the end. Changes discretely.'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Align' })
  });

  export const meta = {
    category: 'text',
    schema,
    type: 'text',
    label: 'Text',
    icon: Type,
    description: 'Styled text with Google Fonts, customizable size, weight, color, and alignment',

    propertyGroups: [
      { id: 'typography', label: 'Typography' },
      { id: 'spacing', label: 'Spacing' },
      { id: 'layout', label: 'Layout' }
    ]
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let {
    content,
    fontSize,
    fontFamily,
    fontWeight,
    color,
    letterSpacing,
    lineHeight,
    autoWidth,
    width,
    textAlign
  }: Props = $props();
</script>

<ApplyFont {fontFamily}>
  <div
    class="select-none"
    class:whitespace-nowrap={autoWidth}
    style:font-size="{fontSize}px"
    style:font-weight={fontWeight}
    style:color
    style:letter-spacing="{letterSpacing}px"
    style:line-height={lineHeight}
    style:width={autoWidth ? 'auto' : `${width}px`}
    style:text-align={textAlign}
  >
    {content}
  </div>
</ApplyFont>
