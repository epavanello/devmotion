import { asset } from '$app/paths';

export const GET = async () => {
  const manifest = {
    name: 'DevMotion - Create Amazing Animated Videos Free',
    short_name: 'DevMotion',
    description:
      'Create stunning animated videos with DevMotion. Design with manual controls or use AI-powered suggestions. Export your videos for free.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: '#000000',
    background_color: '#000000',
    orientation: 'any',
    icons: [
      {
        src: asset('/favicon.svg'),
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable'
      }
    ],
    categories: ['productivity', 'graphics', 'utilities'],
    lang: 'en-US',
    dir: 'ltr'
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json'
    }
  });
};
