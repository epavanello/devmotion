import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import '$lib/server/thumbnail-queue';
import type { UserRole } from '$lib/server/db/schema';

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;

    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%paraglide.lang%', locale)
    });
  });

const authHandle: Handle = async ({ event, resolve }) => {
  // Fetch current session from Better Auth
  const session = await auth.api.getSession({
    headers: event.request.headers
  });
  // Make session and user available on server
  if (session) {
    event.locals.session = session.session;
    event.locals.user = {
      ...session.user,
      role: (session.user.role ?? 'user') as UserRole
    };
  }
  return svelteKitHandler({ event, resolve, auth, building });
};

/**
 * SEO-optimized caching handle
 * Adds cache control headers for public pages to improve performance and SEO
 */
const cacheHandle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  // Only cache GET requests
  if (event.request.method !== 'GET') return response;

  const path = event.url.pathname;

  // Cache public project pages (1 hour)
  if (path.startsWith('/p/') && !path.includes('/og.png')) {
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
  }

  // Cache gallery page (30 minutes, stale-while-revalidate for better UX)
  if (path === '/gallery' || path.startsWith('/gallery?')) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=1800, s-maxage=3600, stale-while-revalidate=600'
    );
  }

  // Cache OG images (1 week - they rarely change)
  if (path.endsWith('/og.png')) {
    response.headers.set('Cache-Control', 'public, max-age=604800, immutable');
  }

  // Cache static resources (sitemap, robots.txt)
  if (path === '/sitemap.xml' || path === '/robots.txt') {
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=7200');
  }

  return response;
};

export const handle: Handle = sequence(handleParaglide, authHandle, cacheHandle);
