import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { asset } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

const MAX_USER_STORAGE =
  process.env.NODE_ENV === 'development' ? 100 * 1024 * 1024 : 40 * 1024 * 1024; // 40MB per user

/**
 * Check if user has enough storage quota for a file of the given size
 * @param userId - User ID to check quota for
 * @param fileSize - Size of the file to be uploaded in bytes
 * @throws SvelteKit error if quota exceeded
 */
export async function checkStorageQuota(userId: string, fileSize: number): Promise<void> {
  const userStorageResult = await db
    .select({ total: sql<number>`COALESCE(SUM(${asset.size}), 0)` })
    .from(asset)
    .where(eq(asset.userId, userId));

  const currentUsage = Number(userStorageResult[0]?.total || 0);
  const willExceed = currentUsage + fileSize > MAX_USER_STORAGE;

  if (willExceed) {
    const usedMB = (currentUsage / (1024 * 1024)).toFixed(2);
    const maxMB = (MAX_USER_STORAGE / (1024 * 1024)).toFixed(0);
    error(
      413,
      `Storage quota exceeded. You've used ${usedMB}MB of ${maxMB}MB. Please delete some files to free up space.`
    );
  }
}
