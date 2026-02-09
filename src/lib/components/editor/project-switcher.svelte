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
  import Input from '../ui/input/input.svelte';

  interface Props {
    currentProjectId?: string | null;
  }

  let { currentProjectId = null }: Props = $props();

  let inputElement = $state<HTMLInputElement | null>(null);
  let editingProjectId = $state<string | null>(null);
  let editingName = $state('');
  let renaming = $state(false);

  $effect(() => {
    if (editingProjectId && inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  });

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

<DropdownMenu.Root>
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
          onpointermove={(e) => {
            if (editingProjectId) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          onmousemove={(e) => {
            if (editingProjectId) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          onmouseenter={(e) => {
            if (editingProjectId) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
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
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
              class="flex items-center gap-2"
              onclick={(e) => e.stopPropagation()}
              onmousedown={(e) => {
                e.stopPropagation();
                // Only prevent default if not clicking the input
                if (e.target !== inputElement) {
                  e.preventDefault();
                }
              }}
            >
              <Input
                type="text"
                bind:value={editingName}
                bind:ref={inputElement}
                onkeydown={(e) => {
                  if (e.key === 'Enter') {
                    saveRename(e);
                  }
                  if (e.key === 'Escape') {
                    cancelRename(e);
                  }
                }}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={renaming}
                onclick={saveRename}
                icon={Check}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={renaming}
                onclick={cancelRename}
                icon={X}
              />
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
