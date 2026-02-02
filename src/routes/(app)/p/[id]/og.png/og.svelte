<svelte:options css="injected" />

<script lang="ts">
  import { Fullscreen, Calendar, Eye } from 'lucide-svelte';
  import { BRAND_GRADIENTS } from '$lib/constants/branding';

  export let name: string;
  export let authorName: string;
  export let views: number;
  export let updatedAt: Date;
</script>

<div
  tw="flex flex-col w-full h-full p-16 items-start justify-between"
  style="background: {BRAND_GRADIENTS.background};"
>
  <!-- Top: Logo and Site Name -->
  <div tw="flex items-center">
    <div
      tw="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
      style="background: {BRAND_GRADIENTS.logo};"
    >
      <Fullscreen size={36} color="white" />
    </div>
    <div tw="flex flex-col ml-4">
      <span tw="text-white text-3xl font-bold tracking-tight">DevMotion</span>
      <span tw="text-slate-400 text-lg font-medium">AI Motion Design</span>
    </div>
  </div>

  <!-- Middle: Project Info -->
  <div tw="flex flex-col mt-4">
    <h1 tw="text-[80px] font-bold text-white tracking-tighter leading-none mb-4">
      {name}
    </h1>

    <div tw="flex items-center mt-4">
      <div tw="flex items-center bg-white/10 px-4 py-2 rounded-xl mr-4 border border-white/10">
        <div
          tw="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-tr from-indigo-500 to-purple-500 text-sm font-bold text-white mr-3"
        >
          {(authorName || '?')[0].toUpperCase()}
        </div>
        <span tw="text-slate-200 text-xl font-medium">{authorName || 'Anonymous'}</span>
      </div>

      {#if views > 0}
        <div
          tw="flex items-center text-slate-400 bg-white/5 px-4 py-2 rounded-xl border border-white/10"
        >
          <Eye size={20} />
          <span tw="text-slate-200 text-xl font-medium ml-2">{views} views</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Bottom: Footer / Metadata -->
  <div tw="flex w-full justify-between items-center pt-8 border-t border-white/5">
    <div tw="flex items-center text-slate-500">
      <Calendar size={18} />
      <span tw="text-slate-400 text-lg ml-2">Created {updatedAt.toLocaleDateString()}</span>
    </div>
    <div tw="flex">
      <div tw="flex items-center px-4 py-1.5 rounded-full border border-slate-800 bg-slate-900/50">
        <span tw="text-slate-500 text-xs font-bold uppercase tracking-widest">devmotion.app</span>
      </div>
    </div>
  </div>
</div>

<style>
  @layer theme, base, components, utilities;
  @import 'tailwindcss/theme.css' layer(theme);
  @import 'tailwindcss/utilities.css' layer(utilities);
</style>
