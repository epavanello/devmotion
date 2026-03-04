import { resolve } from '$app/paths';
import { db } from '$lib/server/db';
import { project } from '$lib/server/db/schema';
import { absoluteUrl } from '$lib/utils/urls';
import { eq, desc } from 'drizzle-orm';

export const GET = async () => {
  // Static pages with SEO priorities
  const staticPages = [
    {
      url: resolve('/(marketing)'),
      changefreq: 'daily' as const,
      priority: '1.0',
      lastmod: new Date().toISOString()
    },
    {
      url: resolve('/(app)/editor'),
      changefreq: 'daily' as const,
      priority: '1.0',
      lastmod: new Date().toISOString()
    },
    {
      url: resolve('/(marketing)/gallery'),
      changefreq: 'hourly' as const,
      priority: '0.9',
      lastmod: new Date().toISOString()
    },
    {
      url: resolve('/(auth)/login'),
      changefreq: 'monthly' as const,
      priority: '0.5',
      lastmod: new Date().toISOString()
    },
    {
      url: resolve('/(auth)/signup'),
      changefreq: 'monthly' as const,
      priority: '0.5',
      lastmod: new Date().toISOString()
    }
  ];

  // Fetch all public projects for dynamic sitemap
  const publicProjects = await db
    .select({
      id: project.id,
      updatedAt: project.updatedAt,
      views: project.views
    })
    .from(project)
    .where(eq(project.isPublic, true))
    .orderBy(desc(project.views), desc(project.updatedAt));

  // Generate project URLs with priority based on views
  const projectPages = publicProjects.map((p) => {
    // Higher views = higher priority (0.6 to 0.8)
    const priorityScore = Math.min(0.6 + (p.views / 1000) * 0.2, 0.8);
    return {
      url: resolve('/(app)/editor/p/[id]', { id: p.id }),
      changefreq: 'weekly' as const,
      priority: priorityScore.toFixed(1),
      lastmod: p.updatedAt.toISOString()
    };
  });

  const allPages = [...staticPages, ...projectPages];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${allPages
  .map(
    (page) => `  <url>
    <loc>${absoluteUrl(page.url)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  });
};
