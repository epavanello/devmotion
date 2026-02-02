import Og from './og.svelte';
import svelteToPng from '$lib/server/svelte-to-image';

export const prerender = true;

export const GET = () => {
  return svelteToPng(Og, { width: 1200, height: 600 });
};
