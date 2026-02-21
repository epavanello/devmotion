import { command, getRequestEvent, query } from '$app/server';
import { db } from '$lib/server/db';
import { asset } from '$lib/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { withErrorHandling } from '.';
import { invalid } from '@sveltejs/kit';
import { deleteFile } from '$lib/server/storage';

/**
 * Get all assets for the current user (shared across projects)
 */
export const getUserAssets = query(
  z.object({
    mediaType: z.enum(['image', 'video', 'audio']).optional()
  }),
  async ({ mediaType }) => {
    const { locals } = getRequestEvent();
    if (!locals.user) return [];

    const conditions = [eq(asset.userId, locals.user.id)];
    if (mediaType) {
      conditions.push(eq(asset.mediaType, mediaType));
    }

    return db.query.asset.findMany({
      where: and(...conditions),
      orderBy: [desc(asset.createdAt)]
    });
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
