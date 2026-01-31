<script lang="ts">
  import AppHeader from '$lib/components/layout/app-header.svelte';
  import { Button } from '$lib/components/ui/button';
  import {
    Download,
    Upload,
    Save,
    Settings,
    User,
    LogOut,
    LogIn,
    Keyboard,
    Lock,
    Unlock,
    GitFork,
    FileDown,
    Trash
  } from 'lucide-svelte';
  import { projectStore } from '$lib/stores/project.svelte';
  import ExportDialog from './export-dialog.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import Tooltip from '$lib/components/ui/tooltip';
  import ProjectSettingsDialog from './project-settings-dialog.svelte';
  import { getUser, signOut } from '$lib/functions/auth.remote';
  import {
    saveProject as saveProjectToDb,
    toggleVisibility,
    forkProject
  } from '$lib/functions/projects.remote';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import ProjectSwitcher from './project-switcher.svelte';

  interface Props {
    getCanvasElement: () => HTMLDivElement | undefined;
    isRecording?: boolean;
    projectId?: string | null;
    isOwner?: boolean;
    canEdit?: boolean;
    isPublic?: boolean;
  }

  let {
    getCanvasElement,
    isRecording = $bindable(false),
    projectId = null,
    isOwner = true,
    canEdit = true,
    isPublic = false
  }: Props = $props();

  let showExportDialog = $state(false);
  let showProjectSettings = $state(false);

  const user = $derived(await getUser());

  const shortcuts = [
    { key: 'Ctrl/Cmd + S', description: 'Save Project' },
    { key: 'Ctrl/Cmd + O', description: 'Open Project' },
    { key: 'Ctrl/Cmd + N', description: 'New Project' },
    { key: 'Ctrl/Cmd + E', description: 'Export Video' }
  ];

  function exportProject() {
    const json = projectStore.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectStore.project.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function loadProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const json = e.target?.result as string;
          projectStore.importFromJSON(json);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  function newProject() {
    if (confirm('Create new project? Unsaved changes will be lost.')) {
      projectStore.newProject();
    }
  }

  function openExportDialog() {
    showExportDialog = true;
  }

  function openProjectSettings() {
    showProjectSettings = true;
  }

  function handleLogin() {
    goto(resolve('/login'));
  }

  async function handleSaveToCloud() {
    if (!user) return;

    const result = await saveProjectToDb({
      id: projectId || undefined,
      data: projectStore.project
    });

    if (result.success && result.data.id) {
      if (!projectId) {
        goto(resolve(`/p/${result.data.id}`));
      }
    }
  }

  async function handleToggleVisibility() {
    if (!projectId) return;
    await toggleVisibility({ id: projectId });
    isPublic = !isPublic;
  }

  async function handleFork() {
    if (!projectId || !user) return;
    const result = await forkProject({ id: projectId });
    if (result.success && result.data.id) {
      goto(resolve(`/p/${result.data.id}`));
    }
  }
</script>

<AppHeader>
  {#snippet leftContent()}
    <!-- Project Switcher (only when logged in) -->
    <Tooltip content={!user ? 'Login to switch projects' : undefined}>
      <ProjectSwitcher currentProjectId={projectId} />
    </Tooltip>

    <!-- Project Actions -->
    <div class="flex items-center gap-1">
      <Tooltip content="Project Settings (Dimensions, Duration, etc.)">
        <Button
          variant="ghost"
          onclick={() => openProjectSettings()}
          disabled={isRecording || !canEdit}
          icon={Settings}
        />
      </Tooltip>

      <Tooltip content="New Project (Ctrl/Cmd + N)">
        <Button variant="ghost" onclick={newProject} disabled={isRecording} icon={Trash} />
      </Tooltip>

      <Tooltip content="Download as JSON">
        <Button variant="ghost" onclick={exportProject} disabled={isRecording} icon={FileDown} />
      </Tooltip>

      <Tooltip content="Load from JSON (Ctrl/Cmd + O)">
        <Button variant="ghost" onclick={loadProject} disabled={isRecording} icon={Upload} />
      </Tooltip>

      {#if user}
        <Tooltip content="Save to Cloud (Ctrl/Cmd + S)">
          <Button
            variant="ghost"
            onclick={handleSaveToCloud}
            disabled={isRecording || !canEdit}
            icon={Save}
          />
        </Tooltip>
      {/if}
    </div>

    <!-- Share/Fork Actions (only for saved projects) -->
    {#if projectId}
      <div class="flex items-center gap-1">
        {#if isOwner}
          <Tooltip content={isPublic ? 'Make Private' : 'Make Public'}>
            <Button
              variant="ghost"
              onclick={handleToggleVisibility}
              disabled={isRecording}
              icon={isPublic ? Unlock : Lock}
            />
          </Tooltip>
        {:else if user}
          <Tooltip content="Fork Project">
            <Button variant="ghost" onclick={handleFork} disabled={isRecording} icon={GitFork} />
          </Tooltip>
        {/if}
      </div>
    {/if}
  {/snippet}

  {#snippet rightContent()}
    {#if isRecording}
      <div
        class="flex animate-pulse items-center gap-2 rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white"
      >
        <span class="h-2 w-2 rounded-full bg-white"></span>
        Recording...
      </div>
    {/if}

    <!-- Keyboard Shortcuts -->
    <Tooltip content="Keyboard Shortcuts">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button variant="ghost" icon={Keyboard} {...props} />
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-64">
          <DropdownMenu.Label>Keyboard Shortcuts</DropdownMenu.Label>
          <DropdownMenu.Separator />
          {#each shortcuts as shortcut (shortcut.key)}
            <div class="flex items-center justify-between px-2 py-1.5 text-sm">
              <span class="text-muted-foreground">{shortcut.description}</span>
              <kbd
                class="pointer-events-none inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 select-none"
              >
                {shortcut.key}
              </kbd>
            </div>
          {/each}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </Tooltip>

    <!-- Export -->
    <Tooltip content="Export as MP4 or WebM (Ctrl/Cmd + E)">
      <Button variant="outline" onclick={openExportDialog} disabled={isRecording} icon={Download}>
        Export Video
      </Button>
    </Tooltip>

    <!-- User Menu -->
    {#if user}
      <Tooltip content="Account Menu">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button variant="ghost" icon={User} {...props} />
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            <DropdownMenu.Label>
              <div class="flex flex-col space-y-1">
                <p class="text-sm leading-none font-medium">{user.name}</p>
                <p class="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenu.Label>
            <DropdownMenu.Separator />
            <form {...signOut}>
              <DropdownMenu.Item>
                {#snippet child({ props })}
                  <Button {...props} variant="ghost" type="submit" class="w-full">Logout</Button>
                {/snippet}
                <LogOut />
                Logout
              </DropdownMenu.Item>
            </form>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Tooltip>
    {:else}
      <Button onclick={handleLogin} icon={LogIn}>Login</Button>
    {/if}
  {/snippet}
</AppHeader>

<ExportDialog
  open={showExportDialog}
  onOpenChange={(open) => (showExportDialog = open)}
  {getCanvasElement}
  bind:isRecording
/>

<ProjectSettingsDialog
  open={showProjectSettings}
  onOpenChange={(open) => (showProjectSettings = open)}
/>
