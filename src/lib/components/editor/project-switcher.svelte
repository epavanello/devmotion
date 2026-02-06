<script lang="ts">
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { Button } from '$lib/components/ui/button';
  import {
    ChevronDown,
    Plus,
    FolderOpen,
    Trash2,
    Globe,
    Lock,
    Film,
    Pencil,
    Check,
    X
  } from '@lucide/svelte';
  import { getUserProjects, deleteProject, renameProject } from '$lib/functions/projects.remote';
  import { goto } from '$app/navigation';
  import { projectStore } from '$lib/stores/project.svelte';
  import { resolve } from '$app/paths';
  import { getUser } from '$lib/functions/auth.remote';

  interface Props {
    currentProjectId?: string | null;
  }

  let { currentProjectId = null }: Props = $props();

  let isOpen = $state(false);
  let editingProjectId = $state<string | null>(null);
  let editingName = $state('');
  let renaming = $state(false);

  const projects = $derived(await getUserProjects());
  const user = $derived(await getUser());

  function handleNewProject() {
    projectStore.resetToNew();
    goto(resolve('/'));
  }

  function handleOpenProject(id: string) {
    if (editingProjectId === id) return; // Don't navigate while editing
    goto(resolve(`/p/${id}`));
  }

  function startRename(project: { id: string; name: string }, e: Event) {
    e.stopPropagation();
    editingProjectId = project.id;
    editingName = project.name;
  }

  function cancelRename(e: Event) {
    e.stopPropagation();
    editingProjectId = null;
    editingName = '';
  }

  async function saveRename(e: Event) {
    e.stopPropagation();
    if (!editingProjectId || !editingName.trim()) return;
    renaming = true;
    try {
      await renameProject({ id: editingProjectId, name: editingName.trim() });
      getUserProjects().refresh();
      editingProjectId = null;
      editingName = '';
    } catch (error) {
      console.error('Failed to rename project:', error);
    } finally {
      renaming = false;
    }
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
          class="flex items-center gap-2 p-2 {currentProjectId === proj.id
            ? 'border-l-2 border-l-primary bg-accent/50'
            : ''}"
        >
          <!-- Thumbnail -->
          <div class="relative h-10 w-10 shrink-0">
            {#if proj.thumbnailUrl}
              <div
                class="h-full w-full overflow-hidden rounded border {currentProjectId === proj.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border'}"
              >
                <img src={proj.thumbnailUrl} alt={proj.name} class="h-full w-full object-cover" />
              </div>
            {:else}
              <div
                class="flex h-full w-full items-center justify-center rounded border bg-muted {currentProjectId ===
                proj.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border'}"
              >
                <Film class="h-5 w-5 text-muted-foreground" />
              </div>
            {/if}
            {#if currentProjectId === proj.id}
              <div
                class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground"
              >
                <Check class="h-2.5 w-2.5" />
              </div>
            {/if}
          </div>

          <!-- Project Info -->
          {#if editingProjectId === proj.id}
            <div
              class="flex min-w-0 flex-1 items-center gap-1"
              onclick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                bind:value={editingName}
                class="h-7 min-w-0 flex-1 rounded border border-input bg-background px-2 text-sm"
                disabled={renaming}
                onkeydown={(e) => {
                  if (e.key === 'Enter') saveRename(e);
                  if (e.key === 'Escape') cancelRename(e);
                }}
                autofocus
              />
              <Button
                variant="ghost"
                size="sm"
                class="h-7 w-7 shrink-0 p-0"
                disabled={renaming}
                onclick={saveRename}
              >
                <Check class="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="h-7 w-7 shrink-0 p-0"
                disabled={renaming}
                onclick={cancelRename}
              >
                <X class="h-3 w-3" />
              </Button>
            </div>
          {:else}
            <div class="flex min-w-0 flex-1 flex-col">
              <span class="truncate text-sm font-medium">{proj.name}</span>
              <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                {#if proj.isPublic}
                  <Globe class="h-3 w-3" />
                  <span>Public</span>
                {:else}
                  <Lock class="h-3 w-3" />
                  <span>Private</span>
                {/if}
              </div>
            </div>

            <!-- Actions -->
            <div class="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                class="h-7 w-7 p-0"
                onclick={(e: Event) => startRename(proj, e)}
              >
                <Pencil class="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                class="h-7 w-7 p-0"
                onclick={(e: Event) => handleDeleteProject(proj.id, e)}
              >
                <Trash2 class="h-3 w-3" />
              </Button>
            </div>
          {/if}
        </DropdownMenu.Item>
      {/each}
    {/if}
  </DropdownMenu.Content>
</DropdownMenu.Root>
