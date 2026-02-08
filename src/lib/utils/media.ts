/**
 * Media utilities for calculating dimensions and aspect ratios
 */

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
