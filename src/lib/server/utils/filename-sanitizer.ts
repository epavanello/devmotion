/**
 * Filename Sanitization Utilities
 *
 * Aggressively removes ALL non-ASCII characters including emojis.
 * Only allows basic alphanumeric characters for FFmpeg compatibility.
 */

/**
 * Sanitize a filename - BRUTALLY removes anything that's not basic ASCII alphanumeric
 * Only keeps: a-z, A-Z, 0-9, hyphen, underscore
 */
export function sanitizeFilename(filename: string): string {
  // Extract extension
  const lastDotIndex = filename.lastIndexOf('.');
  const name = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
  const ext = lastDotIndex > 0 ? filename.slice(lastDotIndex + 1) : '';

  // BRUTAL: Keep ONLY basic ASCII alphanumeric, hyphen, underscore
  // This removes ALL Unicode, emojis, special chars, everything
  let sanitized = name.replace(/[^a-zA-Z0-9\-_]/g, '').trim();

  // If nothing left, use default
  if (!sanitized) {
    sanitized = 'file';
  }

  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.slice(0, 100);
  }

  // Sanitize extension - only basic alphanumeric
  const sanitizedExt = ext
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10)
    .toLowerCase();

  return sanitizedExt ? `${sanitized}.${sanitizedExt}` : sanitized;
}

/**
 * Sanitize a URL or file path for FFmpeg
 * BRUTALLY removes ALL non-ASCII characters
 */
export function sanitizeForFFmpeg(input: string): string {
  // Remove ALL non-ASCII characters (anything above 0x7F)
  // This removes emojis, Unicode, everything that's not basic ASCII
  return input.replace(/[\x80-\uFFFF]/g, '');
}
