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

export const POST: RequestHandler = async ({ params, request, url, locals }) => {
  // Check authorization
  const isLogged = !!locals.user?.id;
  if (!isLogged) {
    error(403, 'Forbidden');
  }

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

  const baseUrl = PUBLIC_BASE_URL;

  try {
    // Start rendering and get stream (include project data for audio merging)
    const videoStream = await renderProjectToVideoStream({
      projectId: id,
      renderId,
      width: config.width,
      height: config.height,
      fps: config.fps,
      duration: config.duration,
      baseUrl,
      projectData
    });

    // Return the stream as response
    const webStream = Readable.toWeb(videoStream) as ReadableStream;

    // Sanitize filename to prevent header injection and filesystem issues
    const sanitizedName =
      (dbProject.name || 'video')
        .replace(/[;="\r\n\\/:<>|?*]/g, '_')
        .replace(/_{2,}/g, '_')
        .trim()
        .substring(0, 100) || 'video';

    return new Response(webStream, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${sanitizedName}.mp4"; filename*=UTF-8''${encodeURIComponent(
          sanitizedName
        )}.mp4`,
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
export const GET: RequestHandler = async ({ url, locals }) => {
  // Check authorization
  const isLogged = !!locals.user?.id;
  if (!isLogged) {
    error(403, 'Forbidden');
  }

  const renderId = url.searchParams.get('renderId');

  if (!renderId) {
    error(400, 'Missing renderId');
  }

  let onProgress: ((progress: RenderProgress) => void) | undefined;

  const body = new ReadableStream({
    start(controller) {
      onProgress = (progress: RenderProgress) => {
        controller.enqueue(`data: ${JSON.stringify(progress)}\n\n`);
        if (progress.phase === 'done' || progress.phase === 'error') {
          if (onProgress) {
            renderEmitter.removeListener(`progress:${renderId}`, onProgress);
          }
          controller.close();
        }
      };

      renderEmitter.on(`progress:${renderId}`, onProgress);
    },
    cancel() {
      if (onProgress) {
        renderEmitter.removeListener(`progress:${renderId}`, onProgress);
      }
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
