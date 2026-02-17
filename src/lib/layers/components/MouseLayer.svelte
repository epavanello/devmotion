<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { MousePointer } from '@lucide/svelte';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';

  /**
   * Schema for Mouse Layer custom properties
   */
  const schema = z.object({
    pointerType: z
      .enum(['arrow', 'pointer', 'hand', 'crosshair', 'text'])
      .default('arrow')
      .describe(
        'The mouse cursor icon type. Arrow = default cursor, Pointer = click cursor, Hand = grab/clickable, Crosshair = precision selection, Text = text editing. Changes discretely.'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Cursor' }),
    size: z
      .number()
      .min(16)
      .max(64)
      .default(24)
      .describe(
        'The size of the cursor icon in pixels. Larger sizes make the cursor more visible in videos. Smoothly animatable.'
      )
      .register(fieldRegistry, { interpolationFamily: 'continuous', label: 'Size' }),
    color: z
      .string()
      .default('#ffffff')
      .describe(
        'The color of the cursor icon in hexadecimal format. Should contrast with the background for visibility. Smoothly animatable for color transitions.'
      )
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Cursor Color'
      }),
    backgroundColor: z
      .string()
      .default('#000000')
      .describe(
        'The color of the background circle behind the cursor in hexadecimal format. Provides contrast and emphasis for the cursor. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'appearance',
        interpolationFamily: 'continuous',
        widget: 'color',
        label: 'Background'
      })
  });

  export const meta = {
    category: 'ui',
    schema,
    type: 'mouse',
    label: 'Mouse Cursor',
    icon: MousePointer,
    description: 'Mouse cursor pointer (arrow, hand, crosshair, text) for UI demonstrations',

    propertyGroups: [{ id: 'appearance', label: 'Appearance' }]
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  import { Hand, Crosshair, Pointer, MousePointer2, TextCursor } from '@lucide/svelte';

  let { pointerType, size, color, backgroundColor }: Props = $props();

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
