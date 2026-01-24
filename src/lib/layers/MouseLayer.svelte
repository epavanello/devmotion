<script module lang="ts">
  import { z } from 'zod';

  /**
   * Schema for Mouse Layer custom properties
   */
  export const MouseLayerPropsSchema = z.object({
    pointerType: z
      .enum(['arrow', 'pointer', 'hand', 'crosshair', 'text'])
      .default('arrow')
      .describe('Mouse pointer type'),
    size: z.number().min(16).max(64).default(24).describe('Pointer size (px)'),
    color: z.string().default('#ffffff').describe('Pointer color'),
    backgroundColor: z.string().default('#000000').describe('Background circle color')
  });

  export type MouseLayerProps = z.infer<typeof MouseLayerPropsSchema>;
</script>

<script lang="ts">
  import { Hand, Crosshair, Pointer, MousePointer2, TextCursor } from 'lucide-svelte';

  let { pointerType, size, color, backgroundColor }: MouseLayerProps = $props();

  const iconMap = {
    arrow: MousePointer2,
    pointer: Pointer,
    hand: Hand,
    crosshair: Crosshair,
    text: TextCursor
  };

  const Icon = $derived(iconMap[pointerType]);
</script>

<div class="relative" style:width="{size}px" style:height="{size}px">
  <!-- Background circle -->
  <div
    class="absolute rounded-full"
    style:width="{size * 1.5}px"
    style:height="{size * 1.5}px"
    style:left="{-size * 0.25}px"
    style:top="{-size * 0.25}px"
    style:background-color={backgroundColor}
    style:opacity="0.4"
  ></div>

  <!-- Main pointer icon -->
  <div
    class="absolute flex items-center justify-center"
    style:width="{size}px"
    style:height="{size}px"
    style:color
  >
    <Icon {size} stroke-width={2} />
  </div>
</div>
