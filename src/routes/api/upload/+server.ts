/**
 * File Upload API Endpoint
 *
 * Handles multipart file uploads for images, videos, and audio files.
 * Stores files in S3-compatible storage and returns URLs.
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

export const POST: RequestHandler = async ({ request }) => {
  // Check if storage is configured
  if (!isStorageConfigured()) {
    error(503, 'File storage is not configured. Set S3 environment variables.');
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

    // Detect media type from MIME type
    const mediaType = (mediaTypeHint as MediaType) || detectMediaType(file.type);
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
      projectId || undefined
    );

    return json({
      success: true,
      file: {
        id: result.fileId,
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
