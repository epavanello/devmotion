import { getPublicProjects } from '$lib/functions/projects.remote';

export const load = async ({ url }) => {
  const page = Number(url.searchParams.get('page')) || 1;
  const limit = 12;
  const data = await getPublicProjects({ page, limit });
  return {
    projects: data.projects,
    total: data.total,
    pages: data.pages,
    currentPage: page
  };
};
