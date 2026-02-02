import { PUBLIC_BASE_URL } from '$env/static/public';
import type { Component } from 'svelte';
import { image_from_component } from 'svelte-component-to-image';

export default async function svelteToPng<T extends Record<string, unknown>>(
  c: Component<T>,
  { props, ...size }: { width: number; height: number; props?: T }
) {
  const image = await image_from_component(c, {
    ...size,
    props,
    fonts: [
      {
        name: 'Montserrat',
        url: `${PUBLIC_BASE_URL}/montserrat-v31-latin-regular.woff`,
        weight: 400,
        style: 'normal'
      },
      {
        name: 'Montserrat',
        url: `${PUBLIC_BASE_URL}/montserrat-v31-latin-700.woff`,
        weight: 700,
        style: 'normal'
      }
    ]
  });
  const response = new Response(image ? new Uint8Array(image) : null);
  response.headers.append('Content-Type', 'image/png');
  response.headers.append('Cache-Control', 's-maxage=604800, stale-while-revalidate=604800');
  return response;
}
