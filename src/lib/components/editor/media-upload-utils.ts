/**
 * Shared utility functions for media capture and upload
 */

import type { MediaCaptureResult, CaptureError } from './media-capture-types';

export type MediaType = 'image' | 'video' | 'audio';

/**
 * Upload a media blob to the server
 * @param blob The media blob to upload
 * @param fileName The filename to use
 * @param mediaType The type of media (image, video, audio)
 * @param projectId Optional project ID for organizing uploads
 * @returns Promise resolving to upload result
 */
export async function uploadMediaBlob(
  blob: Blob,
  fileName: string,
  mediaType: MediaType,
  projectId?: string
): Promise<MediaCaptureResult> {
  const formData = new FormData();
  formData.append('file', blob, fileName);
  formData.append('mediaType', mediaType);
  if (projectId) {
    formData.append('projectId', projectId);
  }

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || `Upload failed (${res.status})`);
  }

  const data = await res.json();
  if (data.success && data.file) {
    return {
      url: data.file.url,
      key: data.file.key,
      fileName: data.file.originalName
    };
  }

  throw new Error('Upload response missing file data');
}

/**
 * Generate a timestamped filename
 * @param prefix Filename prefix (e.g., 'recording', 'photo', 'video')
 * @param extension File extension without dot (e.g., 'webm', 'jpg')
 * @returns Timestamped filename
 */
export function generateTimestampedFileName(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${timestamp}.${extension}`;
}

/**
 * Format duration in seconds to MM:SS string
 * @param seconds Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Handle media capture errors and convert to user-friendly messages
 * @param err The error to handle
 * @returns Structured error object
 */
export function handleMediaError(err: unknown): CaptureError {
  if (err instanceof DOMException) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      return {
        type: 'permission',
        message:
          'Permission denied. Please allow camera/microphone access in your browser settings.'
      };
    }
    if (err.name === 'NotFoundError') {
      return {
        type: 'unsupported',
        message: 'No camera or microphone found on this device.'
      };
    }
    if (err.name === 'NotSupportedError') {
      return {
        type: 'unsupported',
        message:
          'Your browser does not support this feature. Please use Chrome, Firefox, or Safari.'
      };
    }
  }

  if (err instanceof Error) {
    return {
      type: 'unknown',
      message: err.message
    };
  }

  return {
    type: 'unknown',
    message: 'An unknown error occurred'
  };
}

/**
 * Get the first supported MIME type from a list
 * @param types Array of MIME types to try
 * @returns The first supported MIME type, or null if none supported
 */
export async function getSupportedMimeType(types: string[]): Promise<string | null> {
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return null;
}

/**
 * Check if the browser supports video recording
 * @returns true if MediaRecorder and getUserMedia are supported
 */
export function canRecordVideo(): boolean {
  return (
    typeof MediaRecorder !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia
  );
}

/**
 * Check if the browser supports photo capture
 * @returns true if getUserMedia and canvas are supported
 */
export function canCapturePhoto(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof document !== 'undefined' &&
    !!document.createElement('canvas').getContext
  );
}

/**
 * Stop all tracks in a media stream
 * @param stream The media stream to stop
 */
export function stopMediaStream(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}
