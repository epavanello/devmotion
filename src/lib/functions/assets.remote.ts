import { command, getRequestEvent, query } from '$app/server';
import { db } from '$lib/server/db';
import { asset, type Asset } from '$lib/server/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { withErrorHandling } from '.';
import { invalid } from '@sveltejs/kit';
import { deleteFile } from '$lib/server/storage';

/**
 * Extended asset type with project IDs
 */
export type AssetWithProjects = Asset & {
  projectIds: string[];
};

/**
 * Get all assets for the current user (shared across projects)
 * and the list of project IDs where each asset is used
 */
export const getUserAssets = query(
  z.object({
    mediaType: z.enum(['image', 'video', 'audio']).optional()
  }),
  async ({ mediaType }): Promise<AssetWithProjects[]> => {
    const { locals } = getRequestEvent();
    if (!locals.user) return [];

    const conditions = [eq(asset.userId, locals.user.id)];
    if (mediaType) {
      conditions.push(eq(asset.mediaType, mediaType));
    }

    const assets = await db.query.asset.findMany({
      where: and(...conditions),
      orderBy: [desc(asset.createdAt)]
    });

    if (assets.length === 0) return [];

    // Map storage key to project IDs
    const keyToProjectIds = new Map<string, string[]>();

    // For each asset, find projects that use it with a direct JSONB query
    for (const assetItem of assets) {
      const result = await db.execute<{ id: string }>(
        sql`
          SELECT id
          FROM project
          WHERE user_id = ${locals.user.id}
            AND EXISTS (
              SELECT 1
              FROM jsonb_array_elements(data->'layers') AS layer
              WHERE layer->'props'->>'fileKey' = ${assetItem.storageKey}
            )
        `
      );
      const projectIds = Array.isArray(result) ? result.map((r) => r.id) : [];
      keyToProjectIds.set(assetItem.storageKey, projectIds);
    }

    // Map project IDs to each asset
    return assets.map((a) => ({
      ...a,
      projectIds: keyToProjectIds.get(a.storageKey) || []
    }));
  }
);

/**
 * Delete an asset and its S3 file
 */
export const deleteAsset = command(
  z.object({ id: z.string() }),
  withErrorHandling(async ({ id }) => {
    const { locals } = getRequestEvent();
    if (!locals.user) {
      invalid('Not authenticated');
    }

    // Find the asset and verify ownership
    const existing = await db.query.asset.findFirst({
      where: and(eq(asset.id, id), eq(asset.userId, locals.user.id))
    });

    if (!existing) {
      throw new Error('Asset not found or access denied');
    }

    // Delete from S3
    try {
      await deleteFile(existing.storageKey);
    } catch (err) {
      console.error(`Failed to delete S3 file ${existing.storageKey}:`, err);
    }

    // Delete from database
    await db.delete(asset).where(eq(asset.id, id));

    return { success: true };
  })
);
