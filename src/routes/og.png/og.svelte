<svelte:options css="injected" />

<script lang="ts">
  import { Fullscreen } from 'lucide-svelte';
  import { BRAND_GRADIENTS } from '$lib/constants/branding';
</script>

<div
  tw="flex flex-col w-full h-full items-center justify-center"
  style=" background: {BRAND_GRADIENTS.background};"
>
  <div tw="flex flex-col items-center">
    <div tw="flex mb-10">
      <div
        tw="w-32 h-32 rounded-[2rem] flex items-center justify-center shadow-2xl font-bold"
        style="background: {BRAND_GRADIENTS.logo};"
      >
        <Fullscreen size={72} color="white" />
      </div>
    </div>

    <h1 tw="flex text-[128px] font-bold text-white tracking-tighter" style="line-height: 1;">
      DevMotion
    </h1>

    <div tw="flex mt-2">
      <p tw="text-slate-400 text-4xl font-medium tracking-tight">AI-Powered Motion Design Editor</p>
    </div>
  </div>

  <div tw="absolute bottom-12 flex items-center">
    <div tw="flex items-center px-6 py-2 rounded-full border border-slate-800 bg-slate-900/50 mx-3">
      <span tw="text-slate-400 text-sm font-bold uppercase tracking-widest">Manual Controls</span>
    </div>
    <div tw="flex items-center px-6 py-2 rounded-full border border-slate-800 bg-slate-900/50 mx-3">
      <span tw="text-slate-400 text-sm font-bold uppercase tracking-widest">AI Generation</span>
    </div>
    <div tw="flex items-center px-6 py-2 rounded-full border border-slate-800 bg-slate-900/50 mx-3">
      <span tw="text-slate-400 text-sm font-bold uppercase tracking-widest">Free Export</span>
    </div>
  </div>
</div>

<style>
  @layer theme, base, components, utilities;
  @import 'tailwindcss/theme.css' layer(theme);
  @import 'tailwindcss/utilities.css' layer(utilities);
</style>
