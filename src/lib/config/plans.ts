/**
 * Centralized plan configurations for DevMotion.
 * Single source of truth for pricing, features, and limits.
 */

import { PUBLIC_POLAR_CREATOR_PRODUCT_ID, PUBLIC_POLAR_PRO_PRODUCT_ID } from '$env/static/public';

export type PlanTier = 'free' | 'creator' | 'pro';

export interface PlanFeature {
  text: string;
  highlight?: boolean;
}

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  price: number;
  period: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  ctaAction: 'start' | 'login' | 'upgrade';
  variant: 'outline' | 'default';
  popular?: boolean;
  // External billing provider IDs
  polarProductId?: string; // Polar product ID from dashboard
  stripeProductId?: string; // Future: Stripe product ID
  limits: {
    // AI usage - represented as "credits" in UI (1 credit = $0.01)
    maxCostPerMonth: number; // Max monthly AI cost in USD (-1 = unlimited)
    cloudProjects: number; // -1 = unlimited, 0 = local only
    storageBytes: number; // Storage limit in bytes
    watermarkFree: boolean;
    maxExportResolution: '720p' | '1080p' | '4k';
    prioritySupport: boolean;
  };
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

/**
 * All available plans - single source of truth
 */
export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    tier: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Perfect for getting started',
    features: [
      { text: 'Full timeline & keyframe editor', highlight: true },
      { text: '20 AI credits/month' },
      { text: '5 cloud projects' },
      { text: '100 MB storage' },
      { text: 'HD (720p) export with watermark' }
    ],
    cta: 'Start Creating',
    ctaAction: 'start',
    variant: 'outline',
    popular: false,
    limits: {
      maxCostPerMonth: 0.2, // $0.20 = 20 credits
      cloudProjects: 5,
      storageBytes: 100 * MB,
      watermarkFree: false,
      maxExportResolution: '720p',
      prioritySupport: false
    }
  },
  creator: {
    tier: 'creator',
    name: 'Creator',
    price: 9,
    period: 'month',
    description: 'For regular content creators',
    features: [
      { text: 'Everything in Free', highlight: true },
      { text: '200 AI credits/month' },
      { text: '50 cloud projects' },
      { text: '10 GB storage' },
      { text: 'Full HD (1080p) exports', highlight: true },
      { text: 'Watermark-free', highlight: true }
    ],
    cta: 'Get Creator',
    ctaAction: 'login',
    variant: 'outline',
    popular: false,
    // TODO: Replace with actual Polar product IDs from your dashboard
    polarProductId: PUBLIC_POLAR_CREATOR_PRODUCT_ID,
    limits: {
      maxCostPerMonth: 2.0, // $2.00 = 200 credits
      cloudProjects: 50,
      storageBytes: 1 * GB,
      watermarkFree: true,
      maxExportResolution: '1080p',
      prioritySupport: false
    }
  },
  pro: {
    tier: 'pro',
    name: 'Pro',
    price: 29,
    period: 'month',
    description: 'For professional studios',
    features: [
      { text: 'Everything in Creator', highlight: true },
      { text: '1000 AI credits/month', highlight: true },
      { text: 'Unlimited cloud projects' },
      { text: '100 GB storage' },
      { text: '4K export quality', highlight: true },
      { text: 'Priority support' },
      { text: 'Team collaboration (coming soon)' }
    ],
    cta: 'Get Pro',
    ctaAction: 'login',
    variant: 'default',
    popular: true,
    // TODO: Replace with actual Polar product IDs from your dashboard
    polarProductId: PUBLIC_POLAR_PRO_PRODUCT_ID,
    limits: {
      maxCostPerMonth: 10.0, // $10.00 = 1000 credits
      cloudProjects: -1, // unlimited
      storageBytes: 10 * GB,
      watermarkFree: true,
      maxExportResolution: '4k',
      prioritySupport: true
    }
  }
};

/**
 * Get all plans as array (useful for iteration)
 */
export function getAllPlans(): PlanConfig[] {
  return Object.values(PLANS);
}

/**
 * Get specific plan by tier
 */
export function getPlan(tier: PlanTier): PlanConfig {
  return PLANS[tier];
}

/**
 * Get only paid plans (for upgrade dialogs)
 */
export function getPaidPlans(): PlanConfig[] {
  return [PLANS.creator, PLANS.pro];
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return price === 0 ? 'Free' : `$${price}`;
}

/**
 * Convert USD cost to credits for display (1 credit = $0.01)
 */
export function costToCredits(costUSD: number): number {
  return Math.round(costUSD * 100);
}

/**
 * Convert credits to USD cost
 */
export function creditsToCost(credits: number): number {
  return credits / 100;
}

/**
 * Format storage bytes for display
 */
export function formatStorage(bytes: number): string {
  if (bytes === 0) return '0 MB';
  if (bytes < GB) return `${Math.round(bytes / MB)} MB`;
  return `${Math.round(bytes / GB)} GB`;
}

/**
 * Get tier priority (higher = better plan)
 */
export function getTierPriority(tier: PlanTier): number {
  const priority = { free: 0, creator: 1, pro: 2 };
  return priority[tier];
}

/**
 * Compare two tiers
 * Returns: -1 if tier1 < tier2, 0 if equal, 1 if tier1 > tier2
 */
export function compareTiers(tier1: PlanTier, tier2: PlanTier): number {
  const priority1 = getTierPriority(tier1);
  const priority2 = getTierPriority(tier2);
  return Math.sign(priority1 - priority2);
}
