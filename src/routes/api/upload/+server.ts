/**
 * File Upload API Endpoint
 *
 * Handles multipart file uploads for images, videos, and audio files.
 * Stores files in S3-compatible storage and returns URLs.
 * Files must be linked to a saved project.
 */
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  uploadFile,
  validateMediaType,
  validateFileSize,
  detectMediaType,
  isStorageConfigured,
  type MediaType
} from '$lib/server/storage';
import { db } from '$lib/server/db';
import { project, asset } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

const MAX_REQUEST_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_USER_STORAGE = 10 * 1024 * 1024; // 10MB per user

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  if (!locals.user?.id) {
    error(401, 'Unauthorized');
  }

  // Check if storage is configured
  if (!isStorageConfigured()) {
    error(503, 'File storage is not configured. Set S3 environment variables.');
  }

  // Enforce size limit
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_REQUEST_SIZE) {
    error(413, 'Payload Too Large');
  }

  try {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      error(400, 'Expected multipart/form-data');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const mediaTypeHint = formData.get('mediaType') as string | null;
    const projectId = formData.get('projectId') as string | null;

    if (!file) {
      error(400, 'No file provided');
    }

    // Require projectId - uploads must be linked to a saved project
    if (!projectId) {
      error(400, 'Project ID is required. Save your project before uploading files.');
    }

    // Verify project exists and user has access to it
    const existingProject = await db.query.project.findFirst({
      where: eq(project.id, projectId)
    });

    if (!existingProject) {
      error(404, 'Project not found');
    }

    // Verify user owns the project (or project is MCP-created with no owner)
    if (existingProject.userId && existingProject.userId !== locals.user.id) {
      error(403, 'You do not have permission to upload files to this project');
    }

    // Check user's total storage quota
    const userStorageResult = await db
      .select({ total: sql<number>`COALESCE(SUM(${asset.size}), 0)` })
      .from(asset)
      .where(eq(asset.userId, locals.user.id));

    const currentUsage = Number(userStorageResult[0]?.total || 0);
    const willExceed = currentUsage + file.size > MAX_USER_STORAGE;

    if (willExceed) {
      const usedMB = (currentUsage / (1024 * 1024)).toFixed(2);
      const maxMB = (MAX_USER_STORAGE / (1024 * 1024)).toFixed(0);
      error(
        413,
        `Storage quota exceeded. You've used ${usedMB}MB of ${maxMB}MB. Please delete some files to upload new ones.`
      );
    }

    // Validate and use mediaTypeHint if provided, otherwise detect from MIME
    let mediaType: MediaType | null = null;
    if (mediaTypeHint) {
      // Validate that mediaTypeHint is a valid MediaType
      const detectedType = detectMediaType(file.type);
      if (mediaTypeHint === 'image' || mediaTypeHint === 'video' || mediaTypeHint === 'audio') {
        mediaType = mediaTypeHint as MediaType;
      } else {
        mediaType = detectedType;
      }
    } else {
      mediaType = detectMediaType(file.type);
    }

    if (!mediaType) {
      error(400, `Unsupported file type: ${file.type}`);
    }

    // Validate MIME type
    if (!validateMediaType(file.type, mediaType)) {
      error(400, `File type ${file.type} is not allowed for ${mediaType} uploads`);
    }

    // Validate file size
    if (!validateFileSize(file.size, mediaType)) {
      error(400, `File too large for ${mediaType} upload`);
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to storage
    const result = await uploadFile(buffer, file.name, file.type, mediaType, projectId);

    // Save asset metadata to database
    const assetId = nanoid();
    await db.insert(asset).values({
      id: assetId,
      projectId,
      userId: locals.user.id,
      storageKey: result.key,
      url: result.url,
      originalName: result.originalName,
      mimeType: result.mimeType,
      mediaType: result.mediaType,
      size: result.size
    });

    return json({
      success: true,
      file: {
        id: assetId,
        url: result.url,
        key: result.key,
        originalName: result.originalName,
        mimeType: result.mimeType,
        size: result.size,
        mediaType: result.mediaType
      }
    });
  } catch (err) {
    if (err && typeof err === 'object' && 'status' in err) {
      throw err; // Re-throw SvelteKit errors
    }
    console.error('Upload error:', err);
    error(500, `Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
};
