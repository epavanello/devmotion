<script module lang="ts">
  import { z } from 'zod';

  /**
   * Schema for Divider/Line Layer custom properties
   */
  export const schema = z.object({
    orientation: z
      .enum(['horizontal', 'vertical'])
      .default('horizontal')
      .describe('Line direction'),
    length: z.number().min(10).max(2000).default(200).describe('Line length (px)'),
    thickness: z.number().min(1).max(50).default(2).describe('Line thickness (px)'),
    color: z.string().default('#ffffff').describe('Line color'),
    style: z.enum(['solid', 'dashed', 'dotted']).default('solid').describe('Line style'),
    dashLength: z.number().min(2).max(50).default(10).describe('Dash length for dashed style'),
    gapLength: z.number().min(2).max(50).default(5).describe('Gap length for dashed style'),
    rounded: z.boolean().default(false).describe('Rounded line caps'),
    gradient: z.boolean().default(false).describe('Apply gradient effect'),
    gradientStart: z.string().default('#ffffff').describe('Gradient start color'),
    gradientEnd: z.string().default('#888888').describe('Gradient end color'),
    opacity: z.number().min(0).max(1).default(1).describe('Line opacity')
  });

  export type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let {
    orientation,
    length,
    thickness,
    color,
    style,
    dashLength,
    gapLength,
    rounded,
    gradient,
    gradientStart,
    gradientEnd,
    opacity
  }: Props = $props();

  const isHorizontal = $derived(orientation === 'horizontal');
  const width = $derived(isHorizontal ? length : thickness);
  const height = $derived(isHorizontal ? thickness : length);

  const backgroundStyle = $derived.by(() => {
    if (gradient) {
      const direction = isHorizontal ? 'to right' : 'to bottom';
      return `linear-gradient(${direction}, ${gradientStart}, ${gradientEnd})`;
    }
    return color;
  });

  const dashStyle = $derived.by(() => {
    if (style === 'solid') return {};

    if (style === 'dashed') {
      const pattern = isHorizontal
        ? `repeating-linear-gradient(to right, ${color} 0, ${color} ${dashLength}px, transparent ${dashLength}px, transparent ${dashLength + gapLength}px)`
        : `repeating-linear-gradient(to bottom, ${color} 0, ${color} ${dashLength}px, transparent ${dashLength}px, transparent ${dashLength + gapLength}px)`;
      return { background: pattern };
    }

    if (style === 'dotted') {
      const dotSize = thickness;
      const pattern = isHorizontal
        ? `repeating-linear-gradient(to right, ${color} 0, ${color} ${dotSize}px, transparent ${dotSize}px, transparent ${dotSize * 2}px)`
        : `repeating-linear-gradient(to bottom, ${color} 0, ${color} ${dotSize}px, transparent ${dotSize}px, transparent ${dotSize * 2}px)`;
      return { background: pattern };
    }

    return {};
  });
</script>

{#if style === 'solid'}
  <div
    style:width="{width}px"
    style:height="{height}px"
    style:background={backgroundStyle}
    style:border-radius={rounded ? `${thickness / 2}px` : '0'}
    style:opacity
  ></div>
{:else}
  <div
    style:width="{width}px"
    style:height="{height}px"
    style={Object.entries(dashStyle)
      .map(([k, v]) => `${k}:${v}`)
      .join(';')}
    style:border-radius={rounded ? `${thickness / 2}px` : '0'}
    style:opacity
  ></div>
{/if}
