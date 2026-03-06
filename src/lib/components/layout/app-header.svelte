<script lang="ts">
  import Logo from '../editor/Logo.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Github, Loader2 } from '@lucide/svelte';
  import UserMenu from './user-menu.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    /**
     * Optional snippets for different sections of the header.
     * If no snippets are provided, renders a simple header with just logo and GitHub link.
     */
    leftContent?: Snippet;
    centerContent?: Snippet;
    rightContent?: Snippet;
    /**
     * Custom CSS classes to apply to the header container.
     * Default: "flex items-center gap-2 border-b bg-muted/50 p-2"
     */
    class?: string;
  }

  let {
    leftContent,
    centerContent,
    rightContent,
    class: className = 'flex items-center gap-2 border-b bg-muted/50 p-2'
  }: Props = $props();
</script>

<div class={className}>
  <!-- Left Section: Logo & Branding -->
  <div class="flex items-center gap-2">
    <Logo />

    <!-- SEO: Internal link to gallery for better crawling -->
    <Button variant="ghost" size="sm" href="/gallery" class="hidden">Gallery</Button>

    <Button
      variant="ghost"
      size="icon"
      href="https://github.com/epavanello/devmotion"
      target="_blank"
      rel="noreferrer"
      icon={Github}
      class="hidden md:inline-flex"
    />

    {#if leftContent}
      {@render leftContent()}
    {/if}
  </div>

  <!-- Center Section: Flexible content area -->
  {#if centerContent}
    <div class="flex flex-1 items-center gap-2">
      {@render centerContent()}
    </div>
  {:else}
    <div class="flex-1"></div>
  {/if}

  <!-- Right Section: Actions & User Menu -->
  <div class="flex items-center gap-2">
    {#if rightContent}
      {@render rightContent()}
    {/if}
    <svelte:boundary>
      {#snippet pending()}
        <Loader2 class="animate-spin" />
      {/snippet}
      <UserMenu />
    </svelte:boundary>
  </div>
</div>
