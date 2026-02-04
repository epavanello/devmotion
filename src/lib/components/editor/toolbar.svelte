<script lang="ts">
  import AppHeader from '$lib/components/layout/app-header.svelte';
  import { Button } from '$lib/components/ui/button';
  import {
    Download,
    Save,
    Settings,
    User,
    LogOut,
    LogIn,
    Keyboard,
    Lock,
    Unlock,
    GitFork,
    Trash,
    Globe
  } from 'lucide-svelte';
  import { projectStore } from '$lib/stores/project.svelte';
  import ExportDialog from './export-dialog.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import Tooltip from '$lib/components/ui/tooltip';
  import ProjectSettingsDialog from './project-settings-dialog.svelte';
  import { uiStore } from '$lib/stores/ui.svelte';
  import { getUser, signOut } from '$lib/functions/auth.remote';
  import {
    saveProject as saveProjectToDb,
    toggleVisibility,
    forkProject
  } from '$lib/functions/projects.remote';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import ProjectSwitcher from './project-switcher.svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  interface Props {
    getCanvasElement: () => HTMLDivElement | undefined;
    isRecording?: boolean;
    projectId?: string | null;
    isOwner?: boolean;
    canEdit?: boolean;
    isPublic?: boolean;
    isMcp?: boolean;
    isMobile?: boolean;
  }

  let {
    getCanvasElement,
    isRecording = $bindable(false),
    projectId = null,
    isOwner = true,
    canEdit = true,
    isPublic = false,
    isMcp = false,
    isMobile = false
  }: Props = $props();

  import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
  } from '$lib/components/ui/collapsible';
  import { Menu, X } from 'lucide-svelte';

  let headerOpen = $state(false);

  let showExportDialog = $state(false);
  let showProjectSettings = $state(false);

  const user = $derived(await getUser());

  const WELCOME_TOAST_KEY = 'devmotion_welcome_shown';

  onMount(() => {
    if (!localStorage.getItem(WELCOME_TOAST_KEY) && !user) {
      localStorage.setItem(WELCOME_TOAST_KEY, '1');
      toast('Welcome to DevMotion', {
        description:
          'Sign in with Google to get free AI credits and save your projects to the cloud.',
        duration: 8_000
      });
    }

    const onSave = () => handleSaveToCloud();
    window.addEventListener('devmotion:save', onSave);
    return () => window.removeEventListener('devmotion:save', onSave);
  });

  const shortcuts = [
    { key: 'Ctrl/Cmd + S', description: 'Save Project' },
    { key: 'Ctrl/Cmd + N', description: 'New Project' },
    { key: 'Ctrl/Cmd + E', description: 'Export Video' }
  ];

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

  async function doSaveToCloud() {
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

  function handleSaveToCloud() {
    uiStore.requireLogin('save your project', doSaveToCloud);
  }

  async function handleToggleVisibility() {
    if (!projectId) return;
    await toggleVisibility({ id: projectId });
    isPublic = !isPublic;
  }

  async function doFork() {
    if (!projectId) return;
    const result = await forkProject({ id: projectId });
    if (result.success && result.data.id) {
      goto(resolve(`/p/${result.data.id}`));
    }
  }

  function handleFork() {
    uiStore.requireLogin('fork this project', doFork);
  }
</script>

<Collapsible bind:open={headerOpen} class="w-full">
  <AppHeader>
    {#snippet leftContent()}
      <div class="flex items-center gap-2">
        <!-- Project Switcher (only when logged in) -->
        <Tooltip content={!user ? 'Login to switch projects' : undefined}>
          <ProjectSwitcher currentProjectId={projectId} />
        </Tooltip>

        {#if isMcp}
          <div
            class="flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary"
          >
            MCP
          </div>
        {/if}

        {#if isMobile}
          <CollapsibleTrigger>
            {#snippet child({ props })}
              <Button variant="ghost" size="icon" {...props}>
                {#if headerOpen}
                  <X class="size-4" />
                {:else}
                  <Menu class="size-4" />
                {/if}
              </Button>
            {/snippet}
          </CollapsibleTrigger>
        {/if}
      </div>

      {#if !isMobile}
        <!-- Project Actions (Desktop) -->
        <div class="flex items-center gap-1">
          <Tooltip content="Explore Community Gallery">
            <Button variant="ghost" href="/gallery" disabled={isRecording} icon={Globe} />
          </Tooltip>

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

          <Tooltip content="Save to Cloud (Ctrl/Cmd + S)">
            <Button
              variant="ghost"
              onclick={handleSaveToCloud}
              disabled={isRecording || !canEdit}
              icon={Save}
            />
          </Tooltip>
        </div>

        <!-- Share/Fork Actions (Desktop) -->
        {#if projectId}
          <div class="flex items-center gap-1">
            {#if isOwner && user}
              <Tooltip content={isPublic ? 'Make Private' : 'Make Public'}>
                <Button
                  variant="ghost"
                  onclick={handleToggleVisibility}
                  disabled={isRecording}
                  icon={isPublic ? Unlock : Lock}
                />
              </Tooltip>
            {:else if !isOwner}
              <Tooltip content="Fork Project">
                <Button
                  variant="ghost"
                  onclick={handleFork}
                  disabled={isRecording}
                  icon={GitFork}
                />
              </Tooltip>
            {/if}
          </div>
        {/if}
      {/if}
    {/snippet}

    {#snippet rightContent()}
      {#if isRecording}
        <div
          class="flex animate-pulse items-center gap-2 rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white lg:text-sm"
        >
          <span class="h-2 w-2 rounded-full bg-white"></span>
          Recording...
        </div>
      {/if}

      <div class="flex items-center gap-2">
        {#if !isMobile}
          <!-- Keyboard Shortcuts (Desktop) -->
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

          <!-- Export (Desktop) -->
          <Tooltip content="Export as MP4 or WebM (Ctrl/Cmd + E)">
            <Button
              variant="outline"
              onclick={openExportDialog}
              disabled={isRecording}
              icon={Download}
            >
              Export Video
            </Button>
          </Tooltip>
        {/if}

        <!-- User Menu (Always Visible) -->
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
                      <Button {...props} variant="ghost" type="submit" class="w-full">Logout</Button
                      >
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
      </div>
    {/snippet}
  </AppHeader>

  <CollapsibleContent>
    <div class="flex flex-col gap-2 border-b bg-muted/30 p-4">
      <!-- Mobile Specific Actions -->
      <div class="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onclick={openExportDialog}
          disabled={isRecording}
          icon={Download}
          class="justify-start"
        >
          Export Video
        </Button>

        <Button
          variant="outline"
          onclick={() => openProjectSettings()}
          disabled={isRecording || !canEdit}
          icon={Settings}
          class="justify-start"
        >
          Settings
        </Button>

        <Button
          variant="outline"
          href="/gallery"
          disabled={isRecording}
          icon={Globe}
          class="justify-start"
        >
          Gallery
        </Button>

        <Button
          variant="outline"
          onclick={handleSaveToCloud}
          disabled={isRecording || !canEdit}
          icon={Save}
          class="justify-start"
        >
          Save Cloud
        </Button>

        <Button
          variant="outline"
          onclick={newProject}
          disabled={isRecording}
          icon={Trash}
          class="justify-start"
        >
          New
        </Button>

        {#if projectId}
          {#if isOwner && user}
            <Button
              variant="outline"
              onclick={handleToggleVisibility}
              disabled={isRecording}
              icon={isPublic ? Unlock : Lock}
              class="justify-start"
            >
              {isPublic ? 'Private' : 'Public'}
            </Button>
          {:else if !isOwner}
            <Button
              variant="outline"
              onclick={handleFork}
              disabled={isRecording}
              icon={GitFork}
              class="justify-start"
            >
              Fork
            </Button>
          {/if}
        {/if}
      </div>
    </div>
  </CollapsibleContent>
</Collapsible>

<ExportDialog
  open={showExportDialog}
  onOpenChange={(open) => (showExportDialog = open)}
  {getCanvasElement}
  bind:isRecording
  {projectId}
/>

<ProjectSettingsDialog bind:open={showProjectSettings} />
