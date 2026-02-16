<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Zap } from '@lucide/svelte';
  import { BRAND_COLORS } from '$lib/constants/branding';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';
  import { sizeMiddleware } from '$lib/schemas/size';
  import AspectRatioToggle from '../properties/AspectRatioToggle.svelte';
  import { googleFontValues } from '$lib/utils/fonts';
  import ApplyFont from '$lib/components/font/apply-font.svelte';
  import FontProperty from '../properties/FontProperty.svelte';

  /**
   * Schema for Button Layer custom properties
   */
  const schema = z.object({
    text: z
      .string()
      .default('Click me')
      .describe('Button text')
      .register(fieldRegistry, { interpolationFamily: 'text' }),
    width: z
      .number()
      .min(50)
      .max(500)
      .default(120)
      .describe('Width (px)')
      .register(fieldRegistry, { group: 'size', interpolationFamily: 'continuous' }),
    height: z
      .number()
      .min(30)
      .max(150)
      .default(48)
      .describe('Height (px)')
      .register(fieldRegistry, { group: 'size', interpolationFamily: 'continuous' }),
    fontSize: z
      .number()
      .min(10)
      .max(32)
      .default(16)
      .describe('Font size (px)')
      .register(fieldRegistry, { group: 'typography', interpolationFamily: 'continuous' }),
    fontFamily: z
      .enum(googleFontValues)
      .optional()
      .describe('Font family')
      .register(fieldRegistry, {
        group: 'typography',
        interpolationFamily: 'discrete',
        widget: 'custom',
        component: FontProperty
      }),
    fontWeight: z
      .enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'])
      .default('bold')
      .describe('Font weight')
      .register(fieldRegistry, { group: 'typography', interpolationFamily: 'discrete' }),
    backgroundColor: z
      .string()
      .default(BRAND_COLORS.blue)
      .describe('Background color')
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        widget: 'color'
      }),
    textColor: z.string().default('#ffffff').describe('Text color').register(fieldRegistry, {
      group: 'appearance',
      interpolationFamily: 'continuous',
      widget: 'color'
    }),
    borderColor: z
      .string()
      .default(BRAND_COLORS.blue)
      .describe('Border color (for outline/ghost)')
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        widget: 'color'
      }),
    borderRadius: z
      .number()
      .min(0)
      .max(100)
      .default(8)
      .describe('Border radius (px)')
      .register(fieldRegistry, { group: 'style', interpolationFamily: 'continuous' }),
    style: z
      .enum(['solid', 'outline', 'ghost'])
      .default('solid')
      .describe('Button style variant')
      .register(fieldRegistry, { group: 'style', interpolationFamily: 'discrete' }),
    shadow: z
      .boolean()
      .default(true)
      .describe('Show shadow')
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
    category: 'shape',
    schema,
    type: 'button',
    label: 'Button',
    icon: Zap,
    description:
      'Interactive button with solid, outline, or ghost styles and customizable appearance',

    propertyGroups: [
      { id: 'size', label: 'Size', widget: AspectRatioToggle },
      { id: 'typography', label: 'Typography' },
      { id: ' appearance', label: 'Appearance' },
      { id: 'style', label: 'Style' }
    ],

    middleware: sizeMiddleware
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let {
    text,
    width,
    height,
    backgroundColor,
    textColor,
    fontSize,
    borderRadius,
    fontFamily,
    fontWeight,
    style,
    borderColor,
    shadow
  }: Props = $props();

  const buttonClasses = $derived.by(() => {
    let classes = 'flex items-center justify-center font-semibold transition-all active:scale-95';

    if (shadow) {
      classes += ' shadow-lg hover:shadow-xl';
    }

    if (style === 'solid') {
      classes += ' hover:opacity-90';
    } else if (style === 'outline') {
      classes += ' hover:bg-opacity-10';
    } else if (style === 'ghost') {
      classes += ' hover:bg-opacity-5';
    }

    return classes;
  });

  const buttonStyle = $derived.by(() => {
    if (style === 'solid') {
      return {
        backgroundColor,
        color: textColor,
        border: 'none'
      };
    } else if (style === 'outline') {
      return {
        backgroundColor: 'transparent',
        color: borderColor,
        border: `2px solid ${borderColor}`
      };
    } else {
      // ghost
      return {
        backgroundColor: 'transparent',
        color: borderColor,
        border: 'none'
      };
    }
  });
</script>

<ApplyFont {fontFamily}>
  <button
    class={buttonClasses}
    style:width="{width}px"
    style:height="{height}px"
    style:font-size="{fontSize}px"
    style:font-weight={fontWeight}
    style:border-radius="{borderRadius}px"
    style:background-color={buttonStyle.backgroundColor}
    style:color={buttonStyle.color}
    style:border={buttonStyle.border}
    type="button"
  >
    {text}
  </button>
</ApplyFont>
