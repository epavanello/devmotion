import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { renderProjectToVideo } from '$lib/server/video-renderer';
import { PUBLIC_BASE_URL } from '$env/static/public';
import type { ProjectData } from '$lib/schemas/animation';

export const POST: RequestHandler = async ({ params, request }) => {
  const { id } = params;

  // Fetch project from DB
  const dbProject = await db.query.project.findFirst({
    where: eq(project.id, id)
  });

  if (!dbProject) {
    error(404, 'Project not found');
  }

  const projectData = dbProject.data as ProjectData;

  // Parse optional config from request body
  const config = {
    width: projectData.width,
    height: projectData.height,
    fps: projectData.fps,
    duration: projectData.duration
  };

  try {
    const body = await request.json();
    if (body.width) config.width = body.width;
    if (body.height) config.height = body.height;
    if (body.fps) config.fps = body.fps;
  } catch {
    // No body or invalid JSON, use defaults
  }

  // Determine base URL for internal rendering
  // In development, use localhost; in production, use PUBLIC_BASE_URL
  const baseUrl = PUBLIC_BASE_URL || 'http://localhost:5173';

  try {
    // Render video and get stream
    const videoStream = await renderProjectToVideo({
      projectId: id,
      width: config.width,
      height: config.height,
      fps: config.fps,
      duration: config.duration,
      baseUrl
    });

    // Return streaming response
    return new Response(videoStream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${projectData.name || 'video'}.mp4"`,
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked'
      }
    });
  } catch (err) {
    console.error('Video rendering error:', err);
    error(500, `Failed to render video: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
};

// GET for checking status (optional, for future queue implementation)
export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;

  const dbProject = await db.query.project.findFirst({
    where: eq(project.id, id),
    columns: { id: true, name: true }
  });

  if (!dbProject) {
    error(404, 'Project not found');
  }

  return json({
    projectId: id,
    name: dbProject.name,
    status: 'ready',
    message: 'Use POST to start rendering'
  });
};
