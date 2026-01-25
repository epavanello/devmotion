<script lang="ts">
  import { page } from '$app/stores';
  import AppHeader from '$lib/components/layout/app-header.svelte';
  import { Button } from '$lib/components/ui/button';
  import { Home, RefreshCw } from 'lucide-svelte';

  const errorMessages: Record<number, { title: string; description: string }> = {
    404: {
      title: 'Project Not Found',
      description: "The project you're looking for doesn't exist or has been deleted."
    },
    500: {
      title: 'Failed to Load Project',
      description: 'Something went wrong while loading the project. Please try again later.'
    },
    403: {
      title: 'Access Denied',
      description: "You don't have permission to view this project."
    },
    401: {
      title: 'Login Required',
      description: 'Please log in to access this project.'
    }
  };

  $: status = $page.status;
  $: errorInfo = errorMessages[status] || {
    title: 'Project Error',
    description: $page.error?.message || 'Unable to load the project.'
  };
</script>

<svelte:head>
  <title>{status} - {errorInfo.title} | DevMotion</title>
</svelte:head>

<div class="flex h-screen w-full flex-col bg-background">
  <AppHeader />

  <div class="flex flex-1 flex-col items-center justify-center gap-6 p-6">
    <!-- Error Code -->
    <div class="text-center">
      <h1 class="text-9xl font-bold text-muted-foreground/20">{status}</h1>
    </div>

    <!-- Error Message -->
    <div class="max-w-md space-y-2 text-center">
      <h2 class="text-2xl font-semibold tracking-tight">{errorInfo.title}</h2>
      <p class="text-muted-foreground">{errorInfo.description}</p>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3">
      <Button href="/" icon={Home}>Go Home</Button>
      <Button variant="outline" onclick={() => window.location.reload()} icon={RefreshCw}>
        Reload Page
      </Button>
    </div>

    <!-- Additional Debug Info (only in development) -->
    {#if import.meta.env.DEV && $page.error}
      <details class="mt-8 max-w-2xl">
        <summary class="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
          Debug Information
        </summary>
        <pre class="mt-4 overflow-auto rounded-lg bg-muted p-4 text-xs">{JSON.stringify(
            $page.error,
            null,
            2
          )}</pre>
      </details>
    {/if}
  </div>
</div>
