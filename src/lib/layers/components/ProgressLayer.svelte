<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Loader } from 'lucide-svelte';
  import { BRAND_COLORS } from '$lib/constants/branding';

  /**
   * Schema for Progress Bar Layer custom properties
   * Great for showing loading states, completion, stats
   */
  const schema = z.object({
    progress: z.number().min(0).max(100).default(75).describe('Progress percentage (0-100)'),
    width: z.number().min(50).max(1000).default(300).describe('Bar width (px)'),
    height: z.number().min(4).max(60).default(12).describe('Bar height (px)'),
    backgroundColor: z.string().default('#333333').describe('Background/track color'),
    progressColor: z.string().default(BRAND_COLORS.blue).describe('Progress fill color'),
    borderRadius: z.number().min(0).max(30).default(999).describe('Border radius (px)'),
    showLabel: z.boolean().default(false).describe('Show percentage label'),
    labelColor: z.string().default('#ffffff').describe('Label text color'),
    labelFontSize: z.number().min(8).max(24).default(12).describe('Label font size'),
    labelPosition: z.enum(['inside', 'right', 'top']).default('inside').describe('Label position'),
    animated: z.boolean().default(false).describe('Add shine animation'),
    gradient: z.boolean().default(false).describe('Use gradient fill'),
    gradientStart: z.string().default(BRAND_COLORS.blue).describe('Gradient start color'),
    gradientEnd: z.string().default(BRAND_COLORS.purple).describe('Gradient end color')
  });

  export const meta: LayerMeta = {
    schema,
    type: 'progress',
    label: 'Progress',
    icon: Loader,
    description:
      'Progress bar for loading states, completion tracking, with gradient and animation options'
  };

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let {
    progress,
    width,
    height,
    backgroundColor,
    progressColor,
    borderRadius,
    showLabel,
    labelColor,
    labelFontSize,
    labelPosition,
    animated,
    gradient,
    gradientStart,
    gradientEnd
  }: Props = $props();

  const clampedProgress = $derived(Math.max(0, Math.min(100, progress)));

  const progressFill = $derived.by(() => {
    if (gradient) {
      return `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})`;
    }
    return progressColor;
  });
</script>

<div
  class="flex items-center gap-2"
  style:flex-direction={labelPosition === 'top' ? 'column' : 'row'}
>
  {#if showLabel && labelPosition === 'top'}
    <span style:color={labelColor} style:font-size="{labelFontSize}px" class="font-medium">
      {Math.round(clampedProgress)}%
    </span>
  {/if}

  <div
    class="relative overflow-hidden"
    style:width="{width}px"
    style:height="{height}px"
    style:background-color={backgroundColor}
    style:border-radius="{borderRadius}px"
  >
    <div
      class="absolute top-0 left-0 h-full transition-all duration-300"
      class:animate-shimmer={animated}
      style:width="{clampedProgress}%"
      style:background={progressFill}
      style:border-radius="{borderRadius}px"
    >
      {#if showLabel && labelPosition === 'inside' && height >= 16}
        <span
          class="absolute inset-0 flex items-center justify-center font-medium"
          style:color={labelColor}
          style:font-size="{Math.min(labelFontSize, height - 4)}px"
        >
          {Math.round(clampedProgress)}%
        </span>
      {/if}
    </div>

    {#if animated}
      <div
        class="animate-shimmer absolute inset-0"
        style:background="linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)"
        style:border-radius="{borderRadius}px"
      ></div>
    {/if}
  </div>

  {#if showLabel && labelPosition === 'right'}
    <span style:color={labelColor} style:font-size="{labelFontSize}px" class="font-medium">
      {Math.round(clampedProgress)}%
    </span>
  {/if}
</div>

<style>
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  .animate-shimmer {
    animation: shimmer 2s infinite;
  }
</style>
