/**
 * Shared types and interfaces for media capture components
 * (AudioRecorder, VideoRecorder, CameraCapture)
 */

export interface MediaCaptureResult {
  url: string;
  key: string;
  fileName: string;
  duration?: number;
}

export interface MediaCaptureProps {
  onComplete: (result: MediaCaptureResult) => void;
  projectId?: string;
}

export type CaptureState = 'idle' | 'capturing' | 'uploading' | 'error';

export interface CaptureError {
  type: 'permission' | 'upload' | 'unsupported' | 'unknown';
  message: string;
}
