<script lang="ts">
  import Logo from '../editor/Logo.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Github } from 'lucide-svelte';

  interface Props {
    /**
     * Optional snippets for different sections of the header.
     * If no snippets are provided, renders a simple header with just logo and GitHub link.
     */
    leftContent?: import('svelte').Snippet;
    centerContent?: import('svelte').Snippet;
    rightContent?: import('svelte').Snippet;
  }

  let { leftContent, centerContent, rightContent }: Props = $props();
</script>

<div class="flex items-center gap-2 border-b bg-muted/50 p-2">
  <!-- Left Section: Logo & Branding -->
  <div class="flex items-center gap-2">
    <Logo />

    <Button
      variant="ghost"
      size="icon"
      href="https://github.com/epavanello/devmotion"
      target="_blank"
      rel="noreferrer"
      icon={Github}
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
  {#if rightContent}
    <div class="flex items-center gap-2">
      {@render rightContent()}
    </div>
  {/if}
</div>
