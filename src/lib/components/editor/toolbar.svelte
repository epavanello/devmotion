<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import {
    Download,
    Upload,
    Save,
    Fullscreen,
    Github,
    Settings,
    User,
    LogOut,
    LogIn,
    UserPlus,
    Keyboard,
    Lock,
    Unlock,
    GitFork,
    Loader2,
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

  let isSavingToCloud = $state(false);

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

  function handleSignup() {
    goto(resolve('/signup'));
  }

  async function handleSaveToCloud() {
    if (!user) return;

    isSavingToCloud = true;
    try {
      const result = await saveProjectToDb({
        id: projectId || undefined,
        data: projectStore.project
      });

      if (result.success && result.data.id) {
        if (!projectId) {
          goto(resolve(`/p/${result.data.id}`));
        }
      }
    } finally {
      isSavingToCloud = false;
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

<div class="flex items-center gap-2 bg-muted/50 p-2">
  <!-- DevMotion Branding -->
  <div class="flex items-center gap-2 pl-2">
    <div
      class="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-purple-600"
    >
      <Fullscreen class="h-5 w-5 text-white" />
    </div>
    <span class="hidden font-bold text-foreground sm:inline">DevMotion</span>
  </div>

  <Separator orientation="vertical" class="h-6" />

  <!-- Project Switcher (only when logged in) -->
  <Tooltip content={!user ? 'Login to switch projects' : undefined}>
    <ProjectSwitcher currentProjectId={projectId} />
  </Tooltip>
  <Separator orientation="vertical" class="h-6" />

  <!-- Project Actions -->
  <div class="flex items-center gap-1">
    <Tooltip content="Project Settings (Dimensions, Duration, etc.)">
      <Button
        variant="ghost"
        onclick={() => openProjectSettings()}
        disabled={isRecording || !canEdit}
      >
        <Settings />
      </Button>
    </Tooltip>

    <Tooltip content="New Project (Ctrl/Cmd + N)">
      <Button variant="ghost" onclick={newProject} disabled={isRecording}>
        <Trash />
      </Button>
    </Tooltip>

    <Tooltip content="Download as JSON">
      <Button variant="ghost" onclick={exportProject} disabled={isRecording}>
        <FileDown />
      </Button>
    </Tooltip>

    <Tooltip content="Load from JSON (Ctrl/Cmd + O)">
      <Button variant="ghost" onclick={loadProject} disabled={isRecording}>
        <Upload />
      </Button>
    </Tooltip>

    {#if user}
      <Tooltip content="Save to Cloud (Ctrl/Cmd + S)">
        <Button
          variant="ghost"
          onclick={handleSaveToCloud}
          disabled={isRecording || isSavingToCloud || !canEdit}
        >
          {#if isSavingToCloud}
            <Loader2 class="h-4 w-4 animate-spin" />
          {:else}
            <Save />
          {/if}
        </Button>
      </Tooltip>
    {/if}
  </div>

  <!-- Share/Fork Actions (only for saved projects) -->
  {#if projectId}
    <Separator orientation="vertical" class="h-6" />
    <div class="flex items-center gap-1">
      {#if isOwner}
        <Tooltip content={isPublic ? 'Make Private' : 'Make Public'}>
          <Button variant="ghost" onclick={handleToggleVisibility} disabled={isRecording}>
            {#if isPublic}
              <Unlock />
            {:else}
              <Lock />
            {/if}
          </Button>
        </Tooltip>
      {:else if user}
        <Tooltip content="Fork Project">
          <Button variant="ghost" onclick={handleFork} disabled={isRecording}>
            <GitFork />
          </Button>
        </Tooltip>
      {/if}
    </div>
  {/if}

  <div class="flex-1"></div>

  <!-- Export -->
  <Tooltip content="Export as MP4 or WebM (Ctrl/Cmd + E)">
    <Button variant="default" onclick={openExportDialog} disabled={isRecording}>
      <Download class="mr-2 h-4 w-4" />
      Export Video
    </Button>
  </Tooltip>

  {#if isRecording}
    <div
      class="flex animate-pulse items-center gap-2 rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white"
    >
      <span class="h-2 w-2 rounded-full bg-white"></span>
      Recording...
    </div>
  {/if}

  <Separator orientation="vertical" class="h-6" />

  <!-- Keyboard Shortcuts -->
  <Tooltip content="Keyboard Shortcuts">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="ghost">
          <Keyboard />
        </Button>
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

  <!-- User Menu -->
  <Tooltip content="Account Menu">
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variant="ghost">
          <User />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" class="w-56">
        {#if user}
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
              <LogOut class="mr-2 h-4 w-4" />
              Logout
            </DropdownMenu.Item>
          </form>
        {:else}
          <DropdownMenu.Label>Not logged in</DropdownMenu.Label>
          <DropdownMenu.Separator />
          <DropdownMenu.Item onclick={handleLogin}>
            <LogIn class="mr-2 h-4 w-4" />
            Login
          </DropdownMenu.Item>
          <DropdownMenu.Item onclick={handleSignup}>
            <UserPlus class="mr-2 h-4 w-4" />
            Sign Up
          </DropdownMenu.Item>
        {/if}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </Tooltip>

  <Button
    variant="ghost"
    size="icon"
    href="https://github.com/epavanello/devmotion"
    target="_blank"
    rel="noreferrer"
  >
    <Github />
  </Button>
</div>

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
