<script module lang="ts">
  /* eslint-disable svelte/no-navigation-without-resolve */
  import { z } from 'zod';
  import type { LayerMeta } from '../registry';
  import { Image } from '@lucide/svelte';
  import { fieldRegistry } from '$lib/layers/properties/field-registry';
  import { sizeMiddleware } from '$lib/schemas/size';
  import AspectRatioToggle from '../properties/AspectRatioToggle.svelte';

  /**
   * Schema for Image Layer custom properties
   *
   * Now supports both URL sources and uploaded file URLs from S3 storage.
   */
  const schema = z.object({
    src: z
      .string()
      .default('')
      .describe(
        'The image source URL or uploaded file URL. Can be an external URL (e.g., https://...) or a storage URL from an uploaded file. Leave empty to show placeholder.'
      )
      .register(fieldRegistry, { widget: 'upload', mediaType: 'image', label: 'Image' }),
    width: z
      .number()
      .min(1)
      .max(5000)
      .default(720)
      .describe(
        'The display width of the image container in pixels. Does not affect the source image resolution. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Width'
      }),
    height: z
      .number()
      .min(1)
      .max(5000)
      .default(1280)
      .describe(
        'The display height of the image container in pixels. Does not affect the source image resolution. Smoothly animatable.'
      )
      .register(fieldRegistry, {
        group: 'size',
        interpolationFamily: 'continuous',
        label: 'Height'
      }),
    objectFit: z
      .enum(['contain', 'cover', 'fill', 'none', 'scale-down'])
      .default('cover')
      .describe(
        'How the image fills its container. Cover = crop to fill (no whitespace), Contain = fit inside (may have letterbox), Fill = stretch to fill, None = use original size, Scale-down = smallest of none/contain. Changes discretely.'
      )
      .register(fieldRegistry, { interpolationFamily: 'discrete', label: 'Fit' }),
    _aspectRatioLocked: z
      .boolean()
      .default(false)
      .describe('Internal property: whether aspect ratio is locked during resize')
      .register(fieldRegistry, { hidden: true }),
    _aspectRatio: z
      .number()
      .default(1)
      .describe('Internal property: stored aspect ratio value when locked')
      .register(fieldRegistry, { hidden: true }),
    fileKey: z
      .string()
      .default('')
      .describe('Internal property: S3 storage key for uploaded files, used for cleanup on delete')
      .register(fieldRegistry, { hidden: true }),
    fileName: z
      .string()
      .default('')
      .describe('Internal property: original filename of the uploaded image, used for alt text')
      .register(fieldRegistry, { hidden: true }),
    attribution: z
      .object({
        imageUrl: z.string(),
        authorUrl: z.string(),
        authorName: z.string()
      })
      .optional()
      .describe('Internal property: attribution data for Lummi stock images')
      .register(fieldRegistry, { hidden: true })
  });

  export const meta = {
    category: 'media',
    schema,
    type: 'image',
    label: 'Image',
    icon: Image,
    description:
      'Display images from URL or uploaded files with configurable size and object-fit modes',

    propertyGroups: [{ id: 'size', label: 'Size', widget: AspectRatioToggle }],

    middleware: sizeMiddleware
  } as const satisfies LayerMeta;

  type Props = z.infer<typeof schema>;
</script>

<script lang="ts">
  let { src, width, height, objectFit, fileKey: _fileKey, fileName, attribution }: Props = $props();
</script>

<div class="relative overflow-hidden" style:width="{width}px" style:height="{height}px">
  {#if src}
    <img {src} alt={fileName || ''} class="h-full w-full" style:object-fit={objectFit} />

    {#if attribution}
      <div
        class="absolute right-0 bottom-0 left-0 bg-black/70 px-2 py-1 text-[9px] leading-tight text-white"
      >
        <a
          href={attribution.imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="hover:underline"
        >
          Image from Lummi
        </a>
        •
        <a
          href={attribution.authorUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="hover:underline"
        >
          by {attribution.authorName}
        </a>
      </div>
    {/if}
  {:else}
    <div class="flex h-full w-full items-center justify-center bg-gray-800 text-sm text-gray-400">
      No image source
    </div>
  {/if}
</div>
