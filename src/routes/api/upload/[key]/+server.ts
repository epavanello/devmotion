/**
 * File Access & Deletion API Endpoint
 *
 * GET: Redirects to a presigned URL for accessing private files
 * DELETE: Deletes uploaded files from S3-compatible storage
 */
import { error, json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteFile, isStorageConfigured, getSignedFileUrl } from '$lib/server/storage';

/**
 * GET handler - generates and redirects to a presigned URL
 * This allows serving files from private S3 buckets
 */
export const GET: RequestHandler = async ({ params }) => {
  // Check if storage is configured
  if (!isStorageConfigured()) {
    error(503, 'File storage is not configured. Set S3 environment variables.');
  }

  const { key } = params;

  if (!key) {
    error(400, 'No file key provided');
  }

  try {
    // Decode the key (it may contain URL-encoded characters)
    const decodedKey = decodeURIComponent(key);

    console.log('Attempting to get signed URL for key:', decodedKey);

    // Generate presigned URL valid for 1 hour
    const signedUrl = await getSignedFileUrl(decodedKey, 3600);

    console.log('Generated signed URL:', signedUrl);

    // Redirect to the presigned URL
    throw redirect(302, signedUrl);
  } catch (err) {
    // Re-throw SvelteKit errors (redirect, error)
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }

    console.error('File access error:', err);
    // Extract error message from various error types
    let errorMessage = 'Unknown error';
    if (err instanceof Error) {
      errorMessage = err.message;
    } else if (err && typeof err === 'object') {
      errorMessage = JSON.stringify(err);
    }
    error(500, `File access failed: ${errorMessage}`);
  }
};

/**
 * DELETE handler - removes file from storage
 */
export const DELETE: RequestHandler = async ({ params }) => {
  // Check if storage is configured
  if (!isStorageConfigured()) {
    error(503, 'File storage is not configured. Set S3 environment variables.');
  }

  const { key } = params;

  if (!key) {
    error(400, 'No file key provided');
  }

  try {
    // Delete the file from storage
    await deleteFile(decodeURIComponent(key));

    return json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (err) {
    console.error('Delete error:', err);
    error(500, `Delete failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
};
