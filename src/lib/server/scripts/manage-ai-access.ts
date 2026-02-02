/**
 * AI Access Management Script
 * Utility functions to enable/disable AI access for users
 *
 * Usage examples:
 * - Enable AI for a user with unlimited usage:
 *   await enableAI('user-id-123');
 *
 * - Enable AI with monthly cost limit:
 *   await enableAI('user-id-123', { maxCostPerMonth: 10.00, notes: 'Beta tester' });
 *
 * - Disable AI for a user:
 *   await disableAI('user-id-123');
 *
 * - Get usage stats:
 *   await getStats('user-id-123');
 */

import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import {
	enableAIForUser,
	disableAIForUser,
	getUserAIUnlock,
	getUserUsageStats,
	getMonthlyUsageCost
} from '$lib/server/services/ai-access';
import { eq } from 'drizzle-orm';

/**
 * Enable AI access for a user by email
 */
export async function enableAI(
	emailOrId: string,
	options?: {
		maxCostPerMonth?: number;
		notes?: string;
	}
) {
	const userRecord = await findUser(emailOrId);
	if (!userRecord) {
		throw new Error(`User not found: ${emailOrId}`);
	}

	await enableAIForUser({
		userId: userRecord.id,
		maxCostPerMonth: options?.maxCostPerMonth,
		notes: options?.notes
	});

	console.log(`✓ AI access enabled for ${userRecord.email} (${userRecord.id})`);
	if (options?.maxCostPerMonth) {
		console.log(`  Monthly limit: $${options.maxCostPerMonth.toFixed(2)}`);
	} else {
		console.log(`  Monthly limit: Unlimited`);
	}
	if (options?.notes) {
		console.log(`  Notes: ${options.notes}`);
	}
}

/**
 * Disable AI access for a user by email
 */
export async function disableAI(emailOrId: string) {
	const userRecord = await findUser(emailOrId);
	if (!userRecord) {
		throw new Error(`User not found: ${emailOrId}`);
	}

	await disableAIForUser(userRecord.id);
	console.log(`✓ AI access disabled for ${userRecord.email} (${userRecord.id})`);
}

/**
 * Get AI access status and usage stats for a user
 */
export async function getStats(emailOrId: string) {
	const userRecord = await findUser(emailOrId);
	if (!userRecord) {
		throw new Error(`User not found: ${emailOrId}`);
	}

	const unlock = await getUserAIUnlock(userRecord.id);
	const monthlyCost = await getMonthlyUsageCost(userRecord.id);

	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	const stats = await getUserUsageStats(userRecord.id, startOfMonth);

	console.log('\n' + '='.repeat(60));
	console.log(`AI Access Status: ${userRecord.email}`);
	console.log('='.repeat(60));

	if (unlock) {
		console.log(`Status: ${unlock.enabled ? '✓ ENABLED' : '✗ DISABLED'}`);
		console.log(
			`Monthly Limit: ${unlock.maxCostPerMonth ? `$${unlock.maxCostPerMonth.toFixed(2)}` : 'Unlimited'}`
		);
		if (unlock.notes) {
			console.log(`Notes: ${unlock.notes}`);
		}
		console.log(`Created: ${unlock.createdAt.toISOString()}`);
		console.log(`Updated: ${unlock.updatedAt.toISOString()}`);
	} else {
		console.log('Status: ✗ NOT ENABLED');
	}

	console.log('\n' + '-'.repeat(60));
	console.log('Current Month Usage:');
	console.log('-'.repeat(60));
	console.log(`Total Requests: ${stats.totalRequests}`);
	console.log(`Total Tokens: ${stats.totalTokens.toLocaleString()}`);
	console.log(`Total Cost: $${stats.totalCost.toFixed(4)}`);

	if (unlock?.maxCostPerMonth) {
		const percentage = (stats.totalCost / unlock.maxCostPerMonth) * 100;
		console.log(`Limit Usage: ${percentage.toFixed(1)}%`);
	}

	console.log('='.repeat(60) + '\n');

	return { userRecord, unlock, stats };
}

/**
 * List all users with AI access
 */
export async function listAIUsers() {
	const users = await db
		.select({
			userId: user.id,
			email: user.email,
			name: user.name
		})
		.from(user)
		.innerJoin(aiUserUnlock, eq(user.id, aiUserUnlock.userId));

	console.log('\n' + '='.repeat(60));
	console.log('Users with AI Access:');
	console.log('='.repeat(60));

	for (const u of users) {
		const unlock = await getUserAIUnlock(u.userId);
		const monthlyCost = await getMonthlyUsageCost(u.userId);

		console.log(`\n${u.email} (${u.name})`);
		console.log(`  ID: ${u.userId}`);
		console.log(`  Status: ${unlock?.enabled ? '✓ ENABLED' : '✗ DISABLED'}`);
		console.log(`  Monthly Cost: $${monthlyCost.toFixed(4)}`);
		if (unlock?.maxCostPerMonth) {
			console.log(`  Monthly Limit: $${unlock.maxCostPerMonth.toFixed(2)}`);
		}
	}

	console.log('='.repeat(60) + '\n');
	return users;
}

/**
 * Find a user by email or ID
 */
async function findUser(emailOrId: string) {
	// Try by ID first
	let users = await db.select().from(user).where(eq(user.id, emailOrId)).limit(1);

	// If not found, try by email
	if (users.length === 0) {
		users = await db.select().from(user).where(eq(user.email, emailOrId)).limit(1);
	}

	return users[0] || null;
}

// Import statement for listAIUsers
import { aiUserUnlock } from '$lib/server/db/schema';
