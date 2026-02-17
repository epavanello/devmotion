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
      .describe(
        'The text label displayed inside the button. Supports text interpolation for typewriter effects. Use this to show button labels like "Submit", "Learn More", etc.'
      )
      .register(fieldRegistry, { interpolationFamily: 'text', label: 'Text' }),
    width: z
      .number()
      .min(50)
      .max(500)
      .default(120)
      .describe(
        'The button width in pixels. Defines the horizontal size of the clickable button area. Smoothly animatable for size transitions.'
      )
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Width'
      }),
    height: z
      .number()
      .min(30)
      .max(150)
      .default(48)
      .describe(
        'The button height in pixels. Defines the vertical size of the clickable button area. Smoothly animatable for size transitions.'
      )
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Height'
      }),
    fontSize: z
      .number()
      .min(10)
      .max(32)
      .default(16)
      .describe(
        'The font size of the button text in pixels. Controls text legibility and visual hierarchy. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'typography',
        interpolationFamily: 'continuous',
        label: 'Font Size'
      }),
    fontFamily: z
      .enum(googleFontValues)
      .optional()
      .describe(
        'The font family from Google Fonts for the button text. Determines the typeface style. Changes discretely (no smooth transitions between fonts).'
      )
      .register(fieldRegistry, {
        group: 'typography',
        interpolationFamily: 'discrete',
        widget: 'custom',
        component: FontProperty,
        label: 'Font'
      }),
    fontWeight: z
      .enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'])
      .default('bold')
      .describe(
        'The font weight/thickness of the button text. Ranges from 100 (thin) to 900 (black). Buttons typically use bold for emphasis. Changes discretely.'
      )
      .register(fieldRegistry, {
        group: 'typography',
        interpolationFamily: 'discrete',
        label: 'Weight'
      }),
    backgroundColor: z
      .string()
      .default(BRAND_COLORS.blue)
      .describe(
        'The background fill color in hexadecimal format (e.g., #4a90e2). Used for solid buttons. Smoothly animatable for color transitions and hover effects.'
      )
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Background'
      }),
    textColor: z
      .string()
      .default('#ffffff')
      .describe(
        'The color of the button text in hexadecimal format. Should contrast well with the background for readability. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Text Color'
      }),
    borderColor: z
      .string()
      .default(BRAND_COLORS.blue)
      .describe(
        'The border/outline color in hexadecimal format. Visible in outline and ghost button styles. Smoothly animatable for interactive effects.'
      )
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Border'
      }),
    borderRadius: z
      .number()
      .min(0)
      .max(100)
      .default(8)
      .describe(
        'The roundness of button corners in pixels. 0 = sharp corners, higher values = more rounded. Use 999 for pill-shaped buttons. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'style',
        interpolationFamily: 'continuous',
        label: 'Radius'
      }),
    style: z
      .enum(['solid', 'outline', 'ghost'])
      .default('solid')
      .describe(
        'The visual style variant. Solid = filled background, Outline = transparent with border, Ghost = transparent with no border. Changes discretely.'
      )
      .register(fieldRegistry, { group: 'style', interpolationFamily: 'discrete', label: 'Style' }),
    shadow: z
      .boolean()
      .default(true)
      .describe(
        'Whether to display a drop shadow beneath the button for depth. Adds elevation and visual prominence. Changes discretely (on/off).'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Shadow' }),
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
      { id: 'appearance', label: 'Appearance' },
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
