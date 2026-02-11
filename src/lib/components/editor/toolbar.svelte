<script lang="ts">
  import AppHeader from '$lib/components/layout/app-header.svelte';
  import { Button } from '$lib/components/ui/button';
  import {
    Download,
    Save,
    Settings,
    User,
    LogOut,
    Keyboard,
    Lock,
    Unlock,
    GitFork,
    Globe,
    Github
  } from '@lucide/svelte';
  import { projectStore } from '$lib/stores/project.svelte';
  import ExportDialog from './export-dialog.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
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
  import { authClient } from '$lib/auth-client';
  import ProjectSwitcher from './project-switcher.svelte';
  import { onMount, type Component } from 'svelte';
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
  import { Menu, X } from '@lucide/svelte';
  import TooltipButton from '../ui/tooltip/tooltip-button.svelte';
  import GoogleIcon from '$lib/assets/svg/google-icon.svelte';

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
    return () => {
      window.removeEventListener('devmotion:save', onSave);
    };
  });

  const shortcuts = [
    { key: 'Ctrl/Cmd + S', description: 'Save Project' },
    { key: 'Ctrl/Cmd + N', description: 'New Project' },
    { key: 'Ctrl/Cmd + E', description: 'Export Video' }
  ];

  async function openExportDialog() {
    // Check for unsaved changes
    if (projectStore.hasUnsavedChanges && user) {
      const shouldSave = confirm(
        'You have unsaved changes. Please save your project before exporting.'
      );

      if (!shouldSave) {
        return;
      }
      await handleSaveToCloud();
    }

    showExportDialog = true;
  }

  function openProjectSettings() {
    showProjectSettings = true;
  }

  async function handleLogin() {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: resolve('/')
    });
  }

  async function doSaveToCloud() {
    const result = await saveProjectToDb({
      id: projectId || undefined,
      data: projectStore.state
    });

    if (result.success && result.data.id) {
      projectStore.markAsSaved();
      if (!projectId) {
        goto(resolve(`/p/${result.data.id}`));
      }
    }
  }

  async function handleSaveToCloud() {
    await uiStore.requireLogin('save your project', doSaveToCloud);
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

  type ToolbarButton = {
    id: string;
    label: string;
    tooltip: string;
    icon: Component;
    variant?: 'ghost' | 'outline';
    onclick?: () => void;
    href?: string;
    target?: string;
    disabled: boolean;
    visible: boolean;
    showIndicator?: boolean;
  };

  const buttons = $derived<ToolbarButton[]>([
    {
      id: 'gallery',
      label: 'Gallery',
      tooltip: 'Explore Community Gallery',
      icon: Globe,
      variant: 'ghost',
      href: '/gallery',
      target: '_blank',
      disabled: isRecording,
      visible: true
    },
    {
      id: 'settings',
      label: 'Settings',
      tooltip: 'Project Settings (Dimensions, Duration, etc.)',
      icon: Settings,
      variant: 'ghost',
      onclick: openProjectSettings,
      disabled: isRecording || !canEdit,
      visible: true
    },
    {
      id: 'save',
      label: 'Save Cloud',
      tooltip: 'Save to Cloud (Ctrl/Cmd + S)',
      icon: Save,
      variant: 'ghost',
      onclick: handleSaveToCloud,
      disabled: isRecording || !canEdit,
      visible: true,
      showIndicator: projectStore.hasUnsavedChanges
    },
    {
      id: 'visibility',
      label: isPublic ? 'Private' : 'Public',
      tooltip: isPublic ? 'Make Private' : 'Make Public',
      icon: isPublic ? Unlock : Lock,
      variant: 'ghost',
      onclick: handleToggleVisibility,
      disabled: isRecording,
      visible: !!projectId && !!isOwner && !!user
    },
    {
      id: 'fork',
      label: 'Fork',
      tooltip: 'Fork Project',
      icon: GitFork,
      variant: 'ghost',
      onclick: handleFork,
      disabled: isRecording,
      visible: !!projectId && !isOwner
    },
    {
      id: 'export',
      label: 'Export Video',
      tooltip: 'Export as MP4 or WebM (Ctrl/Cmd + E)',
      icon: Download,
      variant: 'outline',
      onclick: openExportDialog,
      disabled: isRecording,
      visible: true
    }
  ]);
</script>

<Collapsible bind:open={headerOpen} class="w-full">
  <AppHeader>
    {#snippet leftContent()}
      <div class="flex items-center gap-2">
        <!-- Project Switcher (only when logged in) -->
        <ProjectSwitcher currentProjectId={projectId} />

        {#if isMcp}
          <div
            class="flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary"
          >
            MCP
          </div>
        {/if}
      </div>

      {#if !isMobile}
        <!-- Project Actions (Desktop) -->
        <div class="flex items-center gap-1">
          {#each buttons.filter((b) => b.visible && b.id !== 'export') as button (button.id)}
            <div class="relative">
              <TooltipButton
                content={button.tooltip}
                variant={button.variant}
                onclick={button.onclick}
                href={button.href}
                target={button.target}
                disabled={button.disabled}
                icon={button.icon}
              />
              {#if button.showIndicator}
                <span
                  class="absolute top-1 right-1 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-background"
                ></span>
              {/if}
            </div>
          {/each}
        </div>
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

          <!-- Export (Desktop) -->
          {#each buttons.filter((b) => b.visible && b.id === 'export') as button (button.id)}
            <TooltipButton
              content={button.tooltip}
              variant={button.variant}
              onclick={button.onclick}
              disabled={button.disabled}
              icon={button.icon}
            >
              {button.label}
            </TooltipButton>
          {/each}
        {/if}

        <!-- User Menu (Always Visible) -->
        {#if user}
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
        {:else}
          <Button onclick={handleLogin} icon={GoogleIcon}>Login</Button>
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
    {/snippet}
  </AppHeader>

  <CollapsibleContent>
    <div class="flex flex-col gap-2 border-b bg-muted/30 p-4">
      <!-- Mobile Actions -->
      <div class="grid grid-cols-2 gap-2">
        {#each buttons.filter((b) => b.visible) as button (button.id)}
          <div class="relative">
            <Button
              variant="outline"
              onclick={button.onclick}
              href={button.href}
              disabled={button.disabled}
              icon={button.icon}
              class="w-full"
            >
              {button.label}
            </Button>
            {#if button.showIndicator}
              <span
                class="absolute top-2 right-2 h-2 w-2 rounded-full bg-orange-500 ring-2 ring-background"
              ></span>
            {/if}
          </div>
        {/each}

        <!-- GitHub Link (Mobile Only) -->
        <Button
          variant="outline"
          href="https://github.com/epavanello/devmotion"
          target="_blank"
          rel="noreferrer"
          icon={Github}
          class="w-full"
        >
          GitHub
        </Button>
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
