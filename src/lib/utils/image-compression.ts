/**
 * Image compression utilities for client-side image processing
 */

export interface CompressImageOptions {
  /** Maximum width in pixels (default: 800) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 600) */
  maxHeight?: number;
  /** JPEG quality 0-1 (default: 0.7) */
  quality?: number;
  /** Target format (default: 'image/jpeg') */
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
  /** Target max file size in bytes (will reduce quality if needed) */
  targetMaxSize?: number;
}

export interface CompressedImage {
  /** Compressed image as base64 data URL */
  dataUrl: string;
  /** Compressed file size in bytes */
  size: number;
  /** Final width */
  width: number;
  /** Final height */
  height: number;
  /** Compression ratio (original / compressed) */
  compressionRatio: number;
  /** Media type */
  mediaType: string;
}

/**
 * Compress an image file using canvas API
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Compressed image data
 */
export async function compressImage(
  file: File,
  options: CompressImageOptions = {}
): Promise<CompressedImage> {
  const {
    maxWidth = 800,
    maxHeight = 600,
    quality: initialQuality = 0.7,
    mimeType = 'image/jpeg',
    targetMaxSize = 100 * 1024 // 100KB default
  } = options;

  // Load image
  const img = await loadImage(file);

  // Calculate new dimensions maintaining aspect ratio
  const dimensions = calculateResizeDimensions(img.width, img.height, maxWidth, maxHeight);

  // Create canvas and draw resized image
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Use better image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw image
  ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

  // Progressively reduce quality to hit target size
  let quality = initialQuality;
  let dataUrl = canvas.toDataURL(mimeType, quality);
  let base64Length = dataUrl.split(',')[1].length;
  let size = Math.floor((base64Length * 3) / 4);

  // Reduce quality until we're under target size (min quality: 0.3)
  while (size > targetMaxSize && quality > 0.3) {
    quality -= 0.05;
    dataUrl = canvas.toDataURL(mimeType, quality);
    base64Length = dataUrl.split(',')[1].length;
    size = Math.floor((base64Length * 3) / 4);
  }

  return {
    dataUrl,
    size,
    width: dimensions.width,
    height: dimensions.height,
    compressionRatio: file.size / size,
    mediaType: mimeType
  };
}

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Calculate resize dimensions maintaining aspect ratio
 */
function calculateResizeDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  // No resize needed
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const aspectRatio = width / height;

  // Determine which dimension to constrain
  if (width / maxWidth > height / maxHeight) {
    // Width is the limiting factor
    return {
      width: maxWidth,
      height: Math.round(maxWidth / aspectRatio)
    };
  } else {
    // Height is the limiting factor
    return {
      width: Math.round(maxHeight * aspectRatio),
      height: maxHeight
    };
  }
}

/**
 * Convert a File to a base64 data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Check if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
