import { getProject } from '$lib/functions/projects.remote';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';

export const ssr = true;

export const load: PageServerLoad = async ({ params }) => {
  const result = await getProject({ id: params.id });

  if ('error' in result) {
    if (result.error === 'not_found') {
      error(404, 'Project not found');
    }
    if (result.error === 'access_denied') {
      error(403, 'Access denied');
    }
  }

  await db
    .update(project)
    .set({ views: sql`${project.views} + 1` })
    .where(eq(project.id, params.id));

  return {
    project: result.project,
    isOwner: result.isOwner,
    canEdit: result.canEdit
  };
};
