import { db } from '$lib/server/db';
import { project, user } from '$lib/server/db/schema';
import { ProjectSchema } from '$lib/types/animation';
import { eq } from 'drizzle-orm';
import { count, countDistinct } from 'drizzle-orm';

export const prerender = true;

export const load = async () => {
  const id = 'n7rYMwfGdUaYFnaGV6lLt';

  const [projectStats, userStats, projectSnapshot] = await Promise.all([
    db.select({ count: count() }).from(project),
    db.select({ count: countDistinct(user.id) }).from(user),
    db.query.project.findFirst({
      where: eq(project.id, id),
      with: {
        user: {
          columns: {
            name: true,
            id: true
          }
        }
      }
    })
  ]);

  const totalProjects = projectStats[0]?.count || 0;
  const totalUsers = userStats[0]?.count || 0;

  return {
    stats: {
      totalProjects,
      totalUsers
    },
    projectSnapshot: ProjectSchema.parse({ id, ...projectSnapshot?.data })
  };
};
