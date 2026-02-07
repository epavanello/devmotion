<script module lang="ts">
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Image } from '@lucide/svelte';
  import { calculateCoverDimensions, ASPECT_RATIOS } from '$lib/utils/media';
  import { projectStore } from '$lib/stores/project.svelte';
  import { fieldRegistry } from '../base';

  /**
   * Schema for Image Layer custom properties
   *
   * Now supports both URL sources and uploaded file URLs from S3 storage.
   */
  const schema = z.object({
    src: z
      .string()
      .default('')
      .describe('Image source URL or uploaded file URL')
      .register(fieldRegistry, { widget: 'upload', mediaType: 'image' }),
    width: z
      .number()
      .min(1)
      .max(5000)
      .default(
        () =>
          calculateCoverDimensions(
            projectStore.project.width,
            projectStore.project.height,
            ASPECT_RATIOS.IMAGE_DEFAULT
          ).width
      )
      .describe('Width (px)'),
    height: z
      .number()
      .min(1)
      .max(5000)
      .default(
        () =>
          calculateCoverDimensions(
            projectStore.project.width,
            projectStore.project.height,
            ASPECT_RATIOS.IMAGE_DEFAULT
          ).height
      )
      .describe('Height (px)'),
    objectFit: z
      .enum(['contain', 'cover', 'fill', 'none', 'scale-down'])
      .default('cover')
      .describe('Object fit mode'),
    /** The storage key if file was uploaded (used for cleanup) */
    fileKey: z.string().default('').describe('Storage key (for uploaded files)'),
    /** Original filename if uploaded */
    fileName: z.string().default('').describe('Original filename')
  });

  export const meta: LayerMeta = {
    schema,
    type: 'image',
    label: 'Image',
    icon: Image,
    description:
      'Display images from URL or uploaded files with configurable size and object-fit modes'
  };

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let { src, width, height, objectFit, fileKey: _fileKey, fileName }: Props = $props();
</script>

<div class="overflow-hidden" style:width="{width}px" style:height="{height}px">
  {#if src}
    <img {src} alt={fileName || ''} class="h-full w-full" style:object-fit={objectFit} />
  {:else}
    <div class="flex h-full w-full items-center justify-center bg-gray-800 text-sm text-gray-400">
      No image source
    </div>
  {/if}
</div>
