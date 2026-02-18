import { query } from '$app/server';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema/auth';
import { project } from '$lib/server/db/schema/projects';
import { aiUsageLog } from '$lib/server/db/schema/ai';
import { eq, sql, count, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { checkRole } from './auth.remote';

export const getAdminStats = query(
  z.object({
    // Accept both Date objects and coerce-able strings (datetime-local values)
    from: z.coerce.date(),
    to: z.coerce.date()
  }),
  async ({ from, to }) => {
    await checkRole('admin');

    // User list with all-time project counts (no date filter on projects)
    const userStats = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        projectCount: sql<number>`cast(count(distinct ${project.id}) as int)`
      })
      .from(user)
      .leftJoin(project, eq(project.userId, user.id))
      .groupBy(user.id, user.name, user.email, user.createdAt)
      .orderBy(user.createdAt);

    // Per-user per-model breakdown: run count + cost filtered by date range
    // Uses proper Drizzle gte/lte operators so dates are parameterised correctly
    const modelBreakdown = await db
      .select({
        userId: aiUsageLog.userId,
        modelId: aiUsageLog.modelId,
        runs: count(aiUsageLog.id),
        costUsd: sql<number>`coalesce(sum(${aiUsageLog.estimatedCost}), 0)`
      })
      .from(aiUsageLog)
      .where(and(gte(aiUsageLog.createdAt, from), lte(aiUsageLog.createdAt, to)))
      .groupBy(aiUsageLog.userId, aiUsageLog.modelId)
      .orderBy(aiUsageLog.userId, aiUsageLog.modelId);

    // Group model rows by userId
    const modelsByUser = new Map<string, typeof modelBreakdown>();
    for (const row of modelBreakdown) {
      if (!modelsByUser.has(row.userId)) modelsByUser.set(row.userId, []);
      modelsByUser.get(row.userId)!.push(row);
    }

    // All projects (public + private) – admins see everything
    const allProjects = await db
      .select({
        id: project.id,
        name: project.name,
        isPublic: project.isPublic,
        userId: project.userId,
        updatedAt: project.updatedAt,
        views: project.views
      })
      .from(project)
      .orderBy(project.updatedAt);

    // Group projects by userId
    const projectsByUser = new Map<string, typeof allProjects>();
    for (const p of allProjects) {
      if (!p.userId) continue;
      if (!projectsByUser.has(p.userId)) projectsByUser.set(p.userId, []);
      projectsByUser.get(p.userId)!.push(p);
    }

    return userStats.map((u) => {
      const models = (modelsByUser.get(u.id) ?? []).map((m) => ({
        modelId: m.modelId,
        runs: m.runs,
        // USD → cents, 4 decimal places
        costCents: Math.round(m.costUsd * 100 * 10000) / 10000
      }));

      const totalCostCents = models.reduce((s, m) => s + m.costCents, 0);

      return {
        ...u,
        totalCostCents,
        models,
        projects: (projectsByUser.get(u.id) ?? []).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      };
    });
  }
);
