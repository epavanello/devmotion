import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { asset } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getUserTierAndLimits } from '$lib/server/services/subscription-limits';
import { formatStorage } from '$lib/config/plans';

/**
 * Check if user has enough storage quota for a file of the given size
 * Uses plan-specific storage limits from subscription service
 * @param userId - User ID to check quota for
 * @param fileSize - Size of the file to be uploaded in bytes
 * @throws SvelteKit error if quota exceeded
 */
export async function checkStorageQuota(userId: string, fileSize: number): Promise<void> {
  // Get user's plan limits
  const { limits } = await getUserTierAndLimits(userId);
  const maxStorage = limits.storageBytes;

  // Calculate current usage
  const userStorageResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${asset.size}), 0)` })
    .from(asset)
    .where(eq(asset.userId, userId));

  const currentUsage = Number(userStorageResult[0]?.total || 0);
  const willExceed = currentUsage + fileSize > maxStorage;

  if (willExceed) {
    const usedStr = formatStorage(currentUsage);
    const maxStr = formatStorage(maxStorage);
    const fileStr = formatStorage(fileSize);
    error(
      413,
      `Storage quota exceeded. You've used ${usedStr} of ${maxStr}. This file (${fileStr}) would exceed your limit. Upgrade your plan or delete some files to free up space.`
    );
  }
}
