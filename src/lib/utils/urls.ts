import { resolve } from '$app/paths';
import { PUBLIC_BASE_URL } from '$env/static/public';
import type { ResolvedPathname } from '$app/types';

/**
 * Converts a resolved pathname (which may be relative like "../../editor/p/123")
 * into an absolute URL by cleaning relative segments and prepending the base URL.
 *
 * Use this for meta tags, JSON-LD, and anywhere you need full URLs.
 *
 * @example
 * const path = resolve('/(app)/editor/p/[id]', { id: '123' });
 * const url = absoluteUrl(path);
 * // => 'https://devmotion.app/editor/p/123'
 */
export function absoluteUrl(resolvedPath: ResolvedPathname): string {
  // Clean relative segments (../../) to get absolute path
  const cleanPath = resolvedPath.replace(/^(\.\.\/)+/, '/');
  return `${PUBLIC_BASE_URL}${cleanPath}`;
}

/**
 * Helper for project URLs
 */
export function projectUrl(id: string): string {
  return absoluteUrl(resolve('/(app)/editor/p/[id]', { id }));
}

/**
 * Helper for project OG image URLs
 */
export function projectOgImageUrl(id: string): string {
  return absoluteUrl(resolve('/(app)/editor/p/[id]/og.png', { id }));
}
