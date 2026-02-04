import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { renderProjectToVideoStream, renderEmitter } from '$lib/server/video-renderer';
import type { RenderProgress } from '$lib/server/video-renderer';
import { PUBLIC_BASE_URL } from '$env/static/public';
import type { ProjectData } from '$lib/schemas/animation';
import { Readable } from 'stream';

export const POST: RequestHandler = async ({ params, request, url }) => {
  const { id } = params;
  const renderId = url.searchParams.get('renderId');

  if (!renderId) {
    error(400, 'Missing renderId');
  }

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

  const baseUrl = PUBLIC_BASE_URL || 'http://localhost:5173';

  try {
    // Start rendering and get stream
    const videoStream = await renderProjectToVideoStream({
      projectId: id,
      renderId,
      width: config.width,
      height: config.height,
      fps: config.fps,
      duration: config.duration,
      baseUrl
    });

    // Return the stream as response
    const webStream = Readable.toWeb(videoStream) as ReadableStream;

    return new Response(webStream, {
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

/**
 * SSE endpoint for tracking progress
 */
export const GET: RequestHandler = async ({ params, url }) => {
  const { id } = params;
  const renderId = url.searchParams.get('renderId');

  if (!renderId) {
    error(400, 'Missing renderId');
  }

  const body = new ReadableStream({
    start(controller) {
      const onProgress = (progress: RenderProgress) => {
        controller.enqueue(`data: ${JSON.stringify(progress)}\n\n`);
        if (progress.phase === 'done' || progress.phase === 'error') {
          cleanup();
          controller.close();
        }
      };

      const cleanup = () => {
        renderEmitter.removeListener(`progress:${renderId}`, onProgress);
      };

      renderEmitter.on(`progress:${renderId}`, onProgress);
    },
    cancel() {
      // In case of client disconnect, thePOST might still be running,
      // but we should detach the listener.
    }
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
};
