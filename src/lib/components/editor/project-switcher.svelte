<script lang="ts">
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { Button } from '$lib/components/ui/button';
  import { ChevronDown, Plus, FolderOpen, Trash2, Globe, Lock } from '@lucide/svelte';
  import { getUserProjects, deleteProject } from '$lib/functions/projects.remote';
  import { goto } from '$app/navigation';
  import { projectStore } from '$lib/stores/project.svelte';
  import { resolve } from '$app/paths';
  import { getUser } from '$lib/functions/auth.remote';

  interface Props {
    currentProjectId?: string | null;
  }

  let { currentProjectId = null }: Props = $props();

  let isOpen = $state(false);
  const projects = $derived(await getUserProjects());
  const user = $derived(await getUser());

  function handleNewProject() {
    projectStore.resetToNew();
    goto(resolve('/'));
  }

  function handleOpenProject(id: string) {
    goto(resolve(`/p/${id}`));
  }

  async function handleDeleteProject(id: string, e: Event) {
    e.stopPropagation();
    if (confirm('Delete this project?')) {
      await deleteProject({ id });
      getUserProjects().refresh();
      if (currentProjectId === id) {
        handleNewProject();
      }
    }
  }
</script>

<DropdownMenu.Root bind:open={isOpen}>
  <DropdownMenu.Trigger disabled={!user}>
    {#snippet child({ props })}
      <Button variant="outline" size="sm" class="max-w-48" {...props}>
        <FolderOpen />
        <ChevronDown />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content class="w-64" align="start">
    <DropdownMenu.Label>My Projects</DropdownMenu.Label>
    <DropdownMenu.Separator />
    <DropdownMenu.Item onclick={handleNewProject}>
      <Plus class="mr-2 h-4 w-4" />
      New Project
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    {#if projects.length === 0}
      <div class="px-2 py-4 text-center text-sm text-muted-foreground">No saved projects</div>
    {:else}
      {#each projects as proj (proj.id)}
        <DropdownMenu.Item
          onclick={() => handleOpenProject(proj.id)}
          class="flex items-center justify-between"
        >
          <div class="flex min-w-0 items-center gap-2">
            {#if proj.isPublic}
              <Globe class="h-3 w-3 shrink-0 text-muted-foreground" />
            {:else}
              <Lock class="h-3 w-3 shrink-0 text-muted-foreground" />
            {/if}
            <span class="truncate">{proj.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="h-6 w-6 shrink-0 p-0"
            onclick={(e: Event) => handleDeleteProject(proj.id, e)}
          >
            <Trash2 class="h-3 w-3" />
          </Button>
        </DropdownMenu.Item>
      {/each}
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>
