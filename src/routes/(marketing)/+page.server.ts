import { db } from '$lib/server/db';
import { project, user } from '$lib/server/db/schema';
import { count, countDistinct } from 'drizzle-orm';

export const prerender = true;

export const load = async () => {
  const [projectStats, userStats] = await Promise.all([
    db.select({ count: count() }).from(project),
    db.select({ count: countDistinct(user.id) }).from(user)
  ]);

  const totalProjects = projectStats[0]?.count || 0;
  const totalUsers = userStats[0]?.count || 0;

  return {
    stats: {
      totalProjects,
      totalUsers
    }
  };
};
