import { command } from '$app/server';
import { z } from 'zod';
import { LUMMI_API_KEY } from '$env/static/private';

const lummiImageTypeSchema = z.enum(['photo', 'illustration', '3d']);
const lummiOrientationSchema = z.enum(['square', 'horizontal', 'vertical']);
const lummiRoleSchema = z.enum(['user', 'creator']);
const lummiStyleSchema = z.enum([
  'stillLife',
  'overheadStillLife',
  'streetArt',
  'collage',
  'whimsical',
  'blurred',
  'urban',
  'neon',
  'blackAndWhite'
]);
const lummiFocalZoneSchema = z.enum([
  'top_left',
  'top_center',
  'top_right',
  'center_left',
  'center',
  'center_right',
  'bottom_left',
  'bottom_center',
  'bottom_right'
]);
const lummiContentTypeSchema = z.enum(['image/png', 'image/jpeg', 'image/jpg']);

const lummiAuthorSchema = z.object({
  attributionUrl: z.string(),
  id: z.string(),
  username: z.string(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  role: lummiRoleSchema
});

const lummiTagSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string()
});

const lummiCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string()
});

const lummiColorInfoSchema = z.object({
  hex: z.string(),
  weight: z.number()
});

const lummiGenerationSchema = z.object({
  mediaType: z.string(),
  aiModel: z.string(),
  batchId: z.string().optional(),
  parentId: z.string().optional(),
  parentUrl: z.string().optional(),
  referenceImages: z.array(z.string()).optional(),
  rootId: z.string().optional(),
  prompt: z.string().optional(),
  aspectRatio: z.string().optional(),
  imageType: lummiImageTypeSchema.optional(),
  shotType: z.string().optional(),
  trend: z.string().optional(),
  style: lummiStyleSchema.optional(),
  audio: z.boolean().optional(),
  duration: z.number().optional()
});

const lummiImageSchema = z.object({
  attributionUrl: z.string(),
  url: z.string(),
  author: lummiAuthorSchema,
  imageType: lummiImageTypeSchema,
  contentType: lummiContentTypeSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  featuredAt: z.string().nullable(),
  featuredScoreUpdatedAt: z.string().nullable(),
  vibeDescription: z.string(),
  detailedDescription: z.string(),
  description: z.string(),
  collections: z.number(),
  searchAppearances: z.number(),
  viewCount: z.number(),
  downloadCount: z.number(),
  trendScore: z.number(),
  randomFieldScore: z.number(),
  featuredScore: z.number(),
  luminance: z.number(),
  focalPositionX: z.number(),
  focalPositionY: z.number(),
  focalWidth: z.number(),
  focalHeight: z.number(),
  focalZone: lummiFocalZoneSchema,
  numberOfPeople: z.number(),
  shootId: z.string().nullable(),
  tags: z.array(lummiTagSchema),
  categories: z.array(lummiCategorySchema),
  colorPalette: z.record(z.string(), lummiColorInfoSchema),
  colorGroups: z.array(z.string()),
  dominantColorGroup: z.string(),
  dominantColorWeight: z.number(),
  pro: z.boolean(),
  free: z.boolean(),
  transparent: z.boolean(),
  discoverable: z.boolean(),
  becameDiscoverableAt: z.string().nullable(),
  unsafe: z.boolean(),
  reference: z.boolean(),
  approved: z.boolean(),
  removed: z.boolean(),
  visionPromptVersion: z.number(),
  size: z.number(),
  width: z.number(),
  height: z.number(),
  aspectRatio: z.number(),
  orientation: lummiOrientationSchema,
  generation: lummiGenerationSchema.optional(),
  purpose: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  blurhash: z.string(),
  slug: z.string(),
  path: z.string(),
  flags: z.array(z.string()),
  videoUpdatedAt: z.string().nullable(),
  defaultAsset: z.unknown().nullable(),
  outpaintAssetPath: z.string().nullable(),
  outpaintAssetUrl: z.string().nullable(),
  real3dAssetPath: z.string().nullable(),
  real3dAssetUrl: z.string().nullable(),
  real3dCamera: z.unknown().nullable(),
  videoAssetUrl: z.string().nullable(),
  videoAssetPath: z.string().nullable(),
  variants: z.record(z.string(), z.object({ path: z.string(), url: z.string() }))
});

const lummiApiResponseSchema = z.object({
  data: z.array(lummiImageSchema),
  meta: z.object({
    totalCount: z.number()
  })
});

export type LummiImage = z.infer<typeof lummiImageSchema>;

export const searchLummiImages = command(
  z.object({
    query: z.string().min(1),
    page: z.number().default(1),
    perPage: z.number().default(20),
    imageType: lummiImageTypeSchema.optional(),
    orientation: lummiOrientationSchema.optional()
  }),
  async ({ query, page, perPage, imageType, orientation }) => {
    if (!LUMMI_API_KEY) {
      throw new Error('Lummi API key not configured');
    }

    try {
      const lummiParams = new URLSearchParams({
        query,
        page: page.toString(),
        perPage: perPage.toString()
      });

      if (imageType) lummiParams.append('imageType', imageType);
      if (orientation) lummiParams.append('orientation', orientation);

      const response = await fetch(`https://api.lummi.ai/v1/images/search?${lummiParams}`, {
        headers: {
          Authorization: `Bearer ${LUMMI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lummi API error:', response.status, errorText);

        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }

        throw new Error(`Lummi API error: ${response.statusText}`);
      }

      const rawData = await response.json();

      // Validate the response
      const validationResult = lummiApiResponseSchema.safeParse(rawData);

      if (!validationResult.success) {
        console.error('Lummi API response validation failed:', validationResult.error);
        throw new Error('Invalid response from Lummi API');
      }

      const data = validationResult.data;

      return {
        images: data.data,
        totalCount: data.meta.totalCount,
        page,
        perPage
      };
    } catch (error) {
      console.error('Error fetching from Lummi:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch images');
    }
  }
);
