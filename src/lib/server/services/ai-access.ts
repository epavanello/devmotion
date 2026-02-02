/**
 * AI Access Control Service
 * Manages per-user AI unlock status and usage tracking
 */
import { db } from '$lib/server/db';
import { aiUserUnlock, aiUsageLog } from '$lib/server/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

/**
 * Model pricing per 1M tokens (in USD)
 * Based on OpenRouter pricing as of 2026
 */
export const MODEL_PRICING: Record<
	string,
	{ input: number; output: number; description: string }
> = {
	'moonshotai/kimi-k2.5': {
		input: 0.3,
		output: 0.6,
		description: 'Kimi K2.5 - Creative tasks'
	},
	'anthropic/claude-sonnet-4.5': {
		input: 3.0,
		output: 15.0,
		description: 'Claude Sonnet 4.5 - Excellent reasoning'
	},
	'openai/gpt-5.1': {
		input: 2.5,
		output: 10.0,
		description: 'GPT-5.1 - Fast multimodal'
	},
	'google/gemini-3-pro-preview': {
		input: 1.25,
		output: 5.0,
		description: 'Gemini 3 Pro - Structured output'
	}
};

/**
 * Default fallback pricing for unknown models
 */
const DEFAULT_PRICING = { input: 1.0, output: 3.0 };

/**
 * Calculate estimated cost for token usage
 */
export function calculateCost(modelId: string, promptTokens: number, completionTokens: number): number {
	const pricing = MODEL_PRICING[modelId] || DEFAULT_PRICING;

	// Convert from per-1M to actual cost
	const inputCost = (promptTokens / 1_000_000) * pricing.input;
	const outputCost = (completionTokens / 1_000_000) * pricing.output;

	return inputCost + outputCost;
}

/**
 * Check if AI is enabled for a specific user
 */
export async function isAIEnabledForUser(userId: string): Promise<boolean> {
	const unlock = await db
		.select()
		.from(aiUserUnlock)
		.where(and(eq(aiUserUnlock.userId, userId), eq(aiUserUnlock.enabled, true)))
		.limit(1);

	return unlock.length > 0;
}

/**
 * Get AI unlock details for a user
 */
export async function getUserAIUnlock(userId: string) {
	const unlock = await db
		.select()
		.from(aiUserUnlock)
		.where(eq(aiUserUnlock.userId, userId))
		.limit(1);

	return unlock[0] || null;
}

/**
 * Calculate total usage cost for a user in the current month
 */
export async function getMonthlyUsageCost(userId: string): Promise<number> {
	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	const result = await db
		.select({
			totalCost: sql<number>`COALESCE(SUM(${aiUsageLog.estimatedCost}), 0)`
		})
		.from(aiUsageLog)
		.where(and(eq(aiUsageLog.userId, userId), gte(aiUsageLog.createdAt, startOfMonth)));

	return result[0]?.totalCost || 0;
}

/**
 * Check if user can use AI (enabled + within monthly limit)
 */
export async function canUserAccessAI(userId: string): Promise<{
	allowed: boolean;
	reason?: string;
	currentCost?: number;
	maxCost?: number;
}> {
	const unlock = await getUserAIUnlock(userId);

	if (!unlock) {
		return { allowed: false, reason: 'AI access not enabled for this user' };
	}

	if (!unlock.enabled) {
		return { allowed: false, reason: 'AI access is disabled' };
	}

	// Check monthly cost limit if set
	if (unlock.maxCostPerMonth !== null) {
		const currentCost = await getMonthlyUsageCost(userId);

		if (currentCost >= unlock.maxCostPerMonth) {
			return {
				allowed: false,
				reason: 'Monthly cost limit exceeded',
				currentCost,
				maxCost: unlock.maxCostPerMonth
			};
		}

		return {
			allowed: true,
			currentCost,
			maxCost: unlock.maxCostPerMonth
		};
	}

	return { allowed: true };
}

/**
 * Log AI usage for tracking and billing
 */
export async function logAIUsage(params: {
	userId: string;
	modelId: string;
	promptTokens: number;
	completionTokens: number;
	metadata?: Record<string, unknown>;
}): Promise<void> {
	const { userId, modelId, promptTokens, completionTokens, metadata } = params;

	const totalTokens = promptTokens + completionTokens;
	const estimatedCost = calculateCost(modelId, promptTokens, completionTokens);

	await db.insert(aiUsageLog).values({
		id: nanoid(),
		userId,
		modelId,
		promptTokens,
		completionTokens,
		totalTokens,
		estimatedCost,
		metadata: metadata ? JSON.stringify(metadata) : null
	});
}

/**
 * Enable AI access for a user
 */
export async function enableAIForUser(params: {
	userId: string;
	maxCostPerMonth?: number;
	notes?: string;
}): Promise<void> {
	const { userId, maxCostPerMonth, notes } = params;

	// Check if unlock already exists
	const existing = await getUserAIUnlock(userId);

	if (existing) {
		// Update existing unlock
		await db
			.update(aiUserUnlock)
			.set({
				enabled: true,
				maxCostPerMonth: maxCostPerMonth ?? null,
				notes: notes ?? existing.notes,
				updatedAt: new Date()
			})
			.where(eq(aiUserUnlock.id, existing.id));
	} else {
		// Create new unlock
		await db.insert(aiUserUnlock).values({
			id: nanoid(),
			userId,
			enabled: true,
			maxCostPerMonth: maxCostPerMonth ?? null,
			notes
		});
	}
}

/**
 * Disable AI access for a user
 */
export async function disableAIForUser(userId: string): Promise<void> {
	const existing = await getUserAIUnlock(userId);

	if (existing) {
		await db
			.update(aiUserUnlock)
			.set({
				enabled: false,
				updatedAt: new Date()
			})
			.where(eq(aiUserUnlock.id, existing.id));
	}
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(userId: string, startDate?: Date, endDate?: Date) {
	const conditions = [eq(aiUsageLog.userId, userId)];

	if (startDate) {
		conditions.push(gte(aiUsageLog.createdAt, startDate));
	}

	if (endDate) {
		conditions.push(sql`${aiUsageLog.createdAt} <= ${endDate}`);
	}

	const logs = await db.select().from(aiUsageLog).where(and(...conditions));

	const totalCost = logs.reduce((sum, log) => sum + log.estimatedCost, 0);
	const totalTokens = logs.reduce((sum, log) => sum + log.totalTokens, 0);

	return {
		totalRequests: logs.length,
		totalCost,
		totalTokens,
		logs
	};
}
