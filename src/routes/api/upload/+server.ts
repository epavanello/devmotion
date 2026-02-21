/**
 * File Upload API Endpoint
 *
 * Handles multipart file uploads for images, videos, and audio files.
 * Stores files in S3-compatible storage and returns URLs.
 * Assets are user-level; projectId is optional (for S3 path organization).
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
import { asset } from '$lib/server/db/schema';
import { checkStorageQuota } from '$lib/server/utils/storage-quota';
import { nanoid } from 'nanoid';

const MAX_REQUEST_SIZE = 40 * 1024 * 1024; // 10MB

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
    const durationStr = formData.get('duration') as string | null;
    const duration = durationStr ? parseFloat(durationStr) : null;

    if (!file) {
      error(400, 'No file provided');
    }

    // Check user's storage quota
    await checkStorageQuota(locals.user.id, file.size);

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
    const result = await uploadFile(
      buffer,
      file.name,
      file.type,
      mediaType,
      'media',
      locals.user.id
    );

    // Save asset metadata to database
    const assetId = nanoid();
    await db.insert(asset).values({
      id: assetId,
      userId: locals.user.id,
      storageKey: result.key,
      url: result.url,
      originalName: result.originalName,
      mimeType: result.mimeType,
      mediaType: result.mediaType,
      size: result.size,
      duration: duration && isFinite(duration) ? Math.floor(duration) : null
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
