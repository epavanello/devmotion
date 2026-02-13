import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { validateRenderToken } from '$lib/server/render-token';

export const load: PageServerLoad = async ({ params, url }) => {
  const token = url.searchParams.get('token');

  // Validate render token (internal use only)
  if (!token || !validateRenderToken(token, params.id)) {
    error(403, 'Invalid or missing render token');
  }

  const result = await db.query.project.findFirst({
    where: eq(project.id, params.id)
  });

  if (!result) {
    error(404, 'Project not found');
  }

  return {
    project: result.data
  };
};
