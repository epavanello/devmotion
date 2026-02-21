/**
 * Media utilities for calculating dimensions, aspect ratios, and handling media layer operations
 */

import type { TypedLayer } from '$lib/layers/typed-registry';
import type { Project } from '$lib/types/animation';

/**
 * Extract duration from video or audio file
 * @param file - The media file
 * @param mediaType - Type of media (video or audio)
 * @returns Duration in seconds, or undefined if extraction fails
 */
export async function extractMediaDuration(
  file: File,
  mediaType: 'video' | 'audio' | 'image'
): Promise<number | undefined> {
  if (mediaType === 'image') return undefined;

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);

    if (mediaType === 'video') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      };
      video.src = url;
    } else if (mediaType === 'audio') {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      };
      audio.src = url;
    } else {
      URL.revokeObjectURL(url);
      resolve(undefined);
    }
  });
}

/**
 * Format duration in seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string (e.g., "2:30")
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted size string (e.g., "1.2MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export const ASPECT_RATIOS = {
  VIDEO_DEFAULT: 16 / 9,
  IMAGE_DEFAULT: 16 / 9,
  SQUARE: 1,
  STANDARD: 4 / 3,
  PHOTOGRAPHY: 3 / 2
} as const;

/**
 * Calculate dimensions to cover a viewport while maintaining aspect ratio.
 * This is similar to CSS object-fit: cover behavior.
 *
 * @param viewportWidth - Width of the target viewport
 * @param viewportHeight - Height of the target viewport
 * @param mediaAspect - Aspect ratio of the media (width/height)
 * @returns Dimensions that will cover the viewport while maintaining aspect ratio
 */
export function calculateCoverDimensions(
  viewportWidth: number,
  viewportHeight: number,
  mediaAspect: number
): { width: number; height: number } {
  const viewportAspect = viewportWidth / viewportHeight;

  if (mediaAspect > viewportAspect) {
    // Media is wider than viewport - match height, scale up width
    return {
      width: Math.round(viewportHeight * mediaAspect),
      height: viewportHeight
    };
  } else {
    // Media is taller or same - match width, scale up height
    return {
      width: viewportWidth,
      height: Math.round(viewportWidth / mediaAspect)
    };
  }
}

/**
 * Calculate dimensions to contain within a viewport while maintaining aspect ratio.
 * This is similar to CSS object-fit: contain behavior.
 *
 * @param viewportWidth - Width of the target viewport
 * @param viewportHeight - Height of the target viewport
 * @param mediaAspect - Aspect ratio of the media (width/height)
 * @returns Dimensions that will fit within the viewport while maintaining aspect ratio
 */
export function calculateContainDimensions(
  viewportWidth: number,
  viewportHeight: number,
  mediaAspect: number
): { width: number; height: number } {
  const viewportAspect = viewportWidth / viewportHeight;

  if (mediaAspect > viewportAspect) {
    // Media is wider than viewport - match width, scale down height
    return {
      width: viewportWidth,
      height: Math.round(viewportWidth / mediaAspect)
    };
  } else {
    // Media is taller or same - match height, scale down width
    return {
      width: Math.round(viewportHeight * mediaAspect),
      height: viewportHeight
    };
  }
}

/**
 * Result type for media upload/layer creation operations
 */
export interface MediaLayerResult {
  layerData: {
    /** Content duration (for video/audio) */
    contentDuration?: number;
    /** Enter time for the layer */
    enterTime: number;
    /** Exit time for the layer */
    exitTime: number;
    /** Name of the media */
    name?: string;
  };
  projectUpdates: {
    /** Whether the project duration should be extended */
    shouldExtendDuration: boolean;
    /** New duration if extending */
    newDuration?: number;
  };
}

/**
 * Prepare media layer data after upload or drop.
 * This centralizes the logic for setting up layer timing based on media duration.
 *
 * @param options - Configuration options
 * @returns Layer data and project updates to apply
 */
export function prepareMediaLayerData(options: {
  /** Duration of the media in seconds (undefined for images) */
  duration?: number;
  /** Media type: image, video, or audio */
  mediaType: 'image' | 'video' | 'audio';
  /** Current time in the project (for enter time) */
  currentTime: number;
  /** Current project duration */
  projectDuration: number;
  /** Original filename */
  name?: string;
}): MediaLayerResult {
  const { duration, mediaType, currentTime, projectDuration, name } = options;

  const enterTime = currentTime;

  // For video/audio with duration
  if (duration !== undefined && (mediaType === 'video' || mediaType === 'audio')) {
    const exitTime = enterTime + duration;

    // Check if we need to extend project duration
    const shouldExtendDuration = exitTime > projectDuration;
    const newDuration = shouldExtendDuration ? exitTime : undefined;

    return {
      layerData: {
        contentDuration: duration,
        enterTime,
        exitTime,
        name
      },
      projectUpdates: {
        shouldExtendDuration,
        newDuration
      }
    };
  }

  // For images (no duration) - use end of project as exit time
  const exitTime = projectDuration;

  return {
    layerData: {
      enterTime,
      exitTime,
      name
    },
    projectUpdates: {
      shouldExtendDuration: false
    }
  };
}

/**
 * Apply media layer data to a project store.
 * This handles setting content duration, layer times, and extending project duration if needed.
 *
 * @param projectStore - The project store with update methods
 * @param layerId - The ID of the layer to update
 * @param result - The result from prepareMediaLayerData
 */
export function applyMediaLayerData(
  projectStore: {
    updateLayer: (layerId: string, updates: Partial<TypedLayer>) => void;
    setLayerExitTime: (layerId: string, exitTime: number) => void;
    updateProject: (updates: Partial<Project>) => void;
  },
  layerId: string,
  result: MediaLayerResult
): void {
  // Update layer with content duration
  if (result.layerData.contentDuration !== undefined) {
    projectStore.updateLayer(layerId, {
      contentDuration: result.layerData.contentDuration
    });
  }

  // Extend project duration if needed
  if (
    result.projectUpdates.shouldExtendDuration &&
    result.projectUpdates.newDuration !== undefined
  ) {
    projectStore.updateProject({ duration: result.projectUpdates.newDuration });
  }

  // Set layer exit time
  projectStore.setLayerExitTime(layerId, result.layerData.exitTime);
}
