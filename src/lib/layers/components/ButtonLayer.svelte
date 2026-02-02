<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Zap } from 'lucide-svelte';
  import { BRAND_COLORS } from '$lib/constants/branding';

  /**
   * Schema for Button Layer custom properties
   */
  const schema = z.object({
    text: z.string().default('Click me').describe('Button text'),
    width: z.number().min(50).max(500).default(120).describe('Width (px)'),
    height: z.number().min(30).max(150).default(48).describe('Height (px)'),
    backgroundColor: z.string().default(BRAND_COLORS.blue).describe('Background color'),
    textColor: z.string().default('#ffffff').describe('Text color'),
    fontSize: z.number().min(10).max(32).default(16).describe('Font size (px)'),
    borderRadius: z.number().min(0).max(100).default(8).describe('Border radius (px)'),
    fontWeight: z
      .enum(['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'])
      .default('bold')
      .describe('Font weight'),
    style: z.enum(['solid', 'outline', 'ghost']).default('solid').describe('Button style variant'),
    borderColor: z.string().default(BRAND_COLORS.blue).describe('Border color (for outline/ghost)'),
    shadow: z.boolean().default(true).describe('Show shadow')
  });

  export const meta: LayerMeta = {
    schema,
    type: 'button',
    label: 'Button',
    icon: Zap,
    description:
      'Interactive button with solid, outline, or ghost styles and customizable appearance'
  };

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
