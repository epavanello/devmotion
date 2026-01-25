import { getProject } from '$lib/functions/projects.remote';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

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

  return {
    project: result.project,
    isOwner: result.isOwner,
    canEdit: result.canEdit
  };
};
