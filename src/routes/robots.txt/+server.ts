import { PUBLIC_BASE_URL } from '$env/static/public';

export const GET = () => {
  const robotsTxt = `# DevMotion - AI-Powered Animation Editor
# Create stunning animated videos with AI assistance

User-agent: *
Allow: /
Allow: /gallery
Allow: /p/

# Disallow private/internal routes
Disallow: /render/
Disallow: /api/
Disallow: /mcp/

# Disallow auth pages from indexing (no SEO value)
Disallow: /login
Disallow: /signup
Disallow: /forgot-password

# Sitemap location
Sitemap: ${PUBLIC_BASE_URL}/sitemap.xml

# Crawl delay - be respectful to server resources
Crawl-delay: 1
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    }
  });
};
