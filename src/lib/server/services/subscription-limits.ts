/**
 * Subscription Limits Service
 * Enforces plan limits for projects, storage, and features
 */
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { getPlan } from '$lib/config/plans';
import { subscriptionService } from './subscription';

/**
 * Get user's current tier and limits
 */
export async function getUserTierAndLimits(userId: string) {
  // Ensure subscription exists, create if missing
  const sub = await subscriptionService.ensure(userId, 'free');

  if (!sub) {
    throw new Error('Failed to create subscription');
  }

  const tier = sub.tier;
  const plan = getPlan(tier);

  return {
    tier,
    limits: plan.limits,
    subscription: sub
  };
}

/**
 * Check if user can create a new project
 */
export async function canCreateProject(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  currentCount?: number;
  maxCount?: number;
}> {
  const { limits } = await getUserTierAndLimits(userId);

  // Unlimited projects
  if (limits.cloudProjects === -1) {
    return { allowed: true };
  }

  // No cloud projects allowed (local only)
  if (limits.cloudProjects === 0) {
    return {
      allowed: false,
      reason: 'Cloud projects not available on free plan. Upgrade to save projects to the cloud.',
      currentCount: 0,
      maxCount: 0
    };
  }

  // Count user's current projects
  const result = await db
    .select({
      count: sql<number>`COUNT(*)`
    })
    .from(project)
    .where(eq(project.userId, userId));

  const currentCount = result[0]?.count || 0;

  if (currentCount >= limits.cloudProjects) {
    return {
      allowed: false,
      reason: `Project limit reached (${currentCount}/${limits.cloudProjects}). Upgrade your plan or delete old projects.`,
      currentCount,
      maxCount: limits.cloudProjects
    };
  }

  return {
    allowed: true,
    currentCount,
    maxCount: limits.cloudProjects
  };
}

/**
 * Check if user can upload file based on storage limits
 */
export async function canUploadFile(
  userId: string,
  fileSizeBytes: number
): Promise<{
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  maxStorage?: number;
}> {
  const { limits, subscription } = await getUserTierAndLimits(userId);

  const currentUsage = subscription.storageUsedBytes;
  const maxStorage = limits.storageBytes;

  // Check if adding this file would exceed limit
  if (currentUsage + fileSizeBytes > maxStorage) {
    return {
      allowed: false,
      reason: `Storage limit exceeded. Current: ${formatBytes(currentUsage)}, Adding: ${formatBytes(fileSizeBytes)}, Max: ${formatBytes(maxStorage)}`,
      currentUsage,
      maxStorage
    };
  }

  return {
    allowed: true,
    currentUsage,
    maxStorage
  };
}

/**
 * Update user's storage usage
 */
export async function updateStorageUsage(userId: string, deltaBytes: number) {
  await subscriptionService.updateStorageUsage(userId, deltaBytes);
}

/**
 * Check if user has access to a feature
 */
export async function canUseFeature(
  userId: string,
  feature: 'watermarkFree' | 'prioritySupport'
): Promise<boolean> {
  const { limits } = await getUserTierAndLimits(userId);
  return limits[feature];
}

/**
 * Get user's export resolution limit
 */
export async function getMaxExportResolution(userId: string): Promise<'720p' | '1080p' | '4k'> {
  const { limits } = await getUserTierAndLimits(userId);
  return limits.maxExportResolution;
}

/**
 * Format bytes for display
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
