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

    const storageKeys = assets.map((a) => a.storageKey);

    const keysArray = sql`ARRAY[${sql.join(
      storageKeys.map((k) => sql`${k}`),
      sql`, `
    )}]`;
    const result = await db.execute<{ id: string; storage_key: string }>(
      sql`
        SELECT DISTINCT
          p.id,
          layer->'props'->>'fileKey' as storage_key
        FROM project p,
        LATERAL jsonb_array_elements(p.data->'layers') AS layer
        WHERE p.user_id = ${locals.user.id}
          AND layer->'props'->>'fileKey' = ANY(${keysArray})
      `
    );

    // Build map of storage key -> project IDs
    const keyToProjectIds = new Map<string, string[]>();
    for (const row of result) {
      const existing = keyToProjectIds.get(row.storage_key) || [];
      existing.push(row.id);
      keyToProjectIds.set(row.storage_key, existing);
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
