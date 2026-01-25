import { PUBLIC_BASE_URL } from '$env/static/public';

export const GET = async () => {
  const baseUrl = PUBLIC_BASE_URL;
  const pages = [
    {
      url: '',
      changefreq: 'daily',
      priority: '1.0',
      lastmod: new Date().toISOString()
    },
    {
      url: '/login',
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: new Date().toISOString()
    },
    {
      url: '/signup',
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: new Date().toISOString()
    }
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
};
