import type { RequestHandler } from './$types';
import Og from './og.svelte';
import svelteToPng from '$lib/server/svelte-to-image';
import { getProject } from '$lib/functions/projects.remote';
import { error } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
  const result = await getProject({ id: params.id });

  if ('error' in result) {
    error(404, 'Project not found');
  }

  const project = result.project;
  const projectData = project.data;

  return svelteToPng(Og, {
    width: 1200,
    height: 600,
    props: {
      name: projectData.name || 'Untitled Project',
      authorName: project.user?.name || 'Anonymous',
      views: project.views || 0,
      updatedAt: project.updatedAt
    }
  });
};
