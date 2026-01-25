import { PUBLIC_BASE_URL } from '$env/static/public';
export const GET = async () => {
  const robotsTxt = `User-agent: *
Allow: /
  
Sitemap: ${PUBLIC_BASE_URL}/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain'
    }
  });
};
