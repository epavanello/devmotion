<script module lang="ts">
  import { z } from 'zod';
  /**
   * Schema for Image Layer custom properties
   */
  export const ImageLayerPropsSchema = z.object({
    src: z.string().default('').describe('Image source URL'),
    width: z.number().min(1).max(5000).default(400).describe('Width (px)'),
    height: z.number().min(1).max(5000).default(300).describe('Height (px)'),
    objectFit: z
      .enum(['contain', 'cover', 'fill', 'none', 'scale-down'])
      .default('contain')
      .describe('Object fit mode')
  });

  export type ImageLayerProps = z.infer<typeof ImageLayerPropsSchema>;
</script>

<script lang="ts">
  let { src, width, height, objectFit }: ImageLayerProps = $props();
</script>

<div class="overflow-hidden" style:width="{width}px" style:height="{height}px">
  <img {src} alt="" class="h-full w-full" style:object-fit={objectFit} />
</div>
