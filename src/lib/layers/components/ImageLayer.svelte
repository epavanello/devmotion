<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Image } from 'lucide-svelte';

  /**
   * Schema for Image Layer custom properties
   */
  const schema = z.object({
    src: z.string().default('').describe('Image source URL'),
    width: z.number().min(1).max(5000).default(400).describe('Width (px)'),
    height: z.number().min(1).max(5000).default(300).describe('Height (px)'),
    objectFit: z
      .enum(['contain', 'cover', 'fill', 'none', 'scale-down'])
      .default('contain')
      .describe('Object fit mode')
  });

  export const meta: LayerMeta = {
    schema,
    type: 'image',
    label: 'Image',
    icon: Image,
    description: 'Display images from URL with configurable size and object-fit modes'
  };

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let { src, width, height, objectFit }: Props = $props();
</script>

<div class="overflow-hidden" style:width="{width}px" style:height="{height}px">
  <img {src} alt="" class="h-full w-full" style:object-fit={objectFit} />
</div>
