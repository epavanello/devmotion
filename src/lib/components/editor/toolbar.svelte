<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Separator } from '$lib/components/ui/separator';
  import {
    Play,
    Pause,
    SkipBack,
    Type,
    Square,
    Circle,
    Triangle,
    Download,
    Upload,
    Save,
    FileText,
    Layers,
    Fullscreen,
    Terminal,
    Image,
    MousePointer,
    Zap,
    Smartphone,
    Globe,
    Github,
    Settings,
    User,
    LogOut,
    LogIn,
    UserPlus,
    Keyboard
  } from 'lucide-svelte';
  import { projectStore } from '$lib/stores/project.svelte';
  import { createTextLayer, createShapeLayer, createLayer } from '$lib/engine/layer-factory';
  import ExportDialog from './export-dialog.svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import ProjectSettingsDialog from './project-settings-dialog.svelte';
  import { authClient } from '$lib/auth-client';
  import { signOut } from '$lib/functions/auth.remote';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  interface Props {
    getCanvasElement: () => HTMLDivElement | undefined;
    isRecording?: boolean;
  }

  let { getCanvasElement, isRecording = $bindable(false) }: Props = $props();

  let showExportDialog = $state(false);
  let showProjectSettings = $state(false);
  let showShortcuts = $state(false);

  const session = authClient.useSession();
  const readonlyItems = [{ label: 'Image', icon: Image }];

  const shortcuts = [
    { key: 'Space', description: 'Play/Pause' },
    { key: 'Ctrl/Cmd + S', description: 'Save Project' },
    { key: 'Ctrl/Cmd + O', description: 'Open Project' },
    { key: 'Ctrl/Cmd + N', description: 'New Project' },
    { key: 'Ctrl/Cmd + E', description: 'Export Video' },
    { key: 'T', description: 'Add Text Layer' },
    { key: 'R', description: 'Add Rectangle' },
    { key: '0', description: 'Reset Playhead' }
  ];

  function togglePlayback() {
    if (projectStore.isPlaying) {
      projectStore.pause();
    } else {
      projectStore.play();
    }
  }

  function resetPlayhead() {
    projectStore.setCurrentTime(0);
    projectStore.pause();
  }

  function addTextLayer() {
    const centerX = projectStore.project.width / 2;
    const centerY = projectStore.project.height / 2;
    const layer = createTextLayer(centerX, centerY);
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  function addShapeLayer(shapeType: 'rectangle' | 'circle' | 'triangle') {
    const centerX = projectStore.project.width / 2;
    const centerY = projectStore.project.height / 2;
    const layer = createShapeLayer(shapeType, centerX, centerY);
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  function addTerminalLayer() {
    const centerX = projectStore.project.width / 2;
    const centerY = projectStore.project.height / 2;
    const layer = createLayer('terminal', {}, { x: centerX, y: centerY });
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  function addMouseLayer() {
    const centerX = projectStore.project.width / 2;
    const centerY = projectStore.project.height / 2;
    const layer = createLayer('mouse', {}, { x: centerX, y: centerY });
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  function addButtonLayer() {
    const centerX = projectStore.project.width / 2;
    const centerY = projectStore.project.height / 2;
    const layer = createLayer('button', {}, { x: centerX, y: centerY });
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  function addPhoneLayer() {
    const centerX = projectStore.project.width / 2;
    const centerY = projectStore.project.height / 2;
    const layer = createLayer('phone', {}, { x: centerX, y: centerY });
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  function addBrowserLayer() {
    const centerX = projectStore.project.width / 2;
    const centerY = projectStore.project.height / 2;
    const layer = createLayer('browser', {}, { x: centerX, y: centerY });
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  function saveProject() {
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
</script>

<div class="flex items-center gap-2 bg-muted/50 p-2">
  <!-- DevMotion Branding -->
  <div class="flex items-center gap-2 pl-2">
    <div
      class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600"
    >
      <Fullscreen class="h-5 w-5 text-white" />
    </div>
    <span class="hidden font-bold text-foreground sm:inline">DevMotion</span>
  </div>

  <Separator orientation="vertical" class="h-6" />

  <!-- Project Actions -->
  <div class="flex items-center gap-1">
    <Button variant="ghost" size="sm" onclick={() => openProjectSettings()} disabled={isRecording}>
      <Settings class="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" onclick={newProject} disabled={isRecording}>
      <FileText class="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" onclick={saveProject} disabled={isRecording}>
      <Save class="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" onclick={loadProject} disabled={isRecording}>
      <Upload class="h-4 w-4" />
    </Button>
  </div>

  <Separator orientation="vertical" class="h-6" />

  <!-- Playback Controls -->
  <div class="flex items-center gap-1">
    <Button variant="ghost" size="sm" onclick={resetPlayhead} disabled={isRecording}>
      <SkipBack class="h-4 w-4" />
    </Button>
    <Button variant="ghost" size="sm" onclick={togglePlayback} disabled={isRecording}>
      {#if projectStore.isPlaying}
        <Pause class="h-4 w-4" />
      {:else}
        <Play class="h-4 w-4" />
      {/if}
    </Button>
  </div>

  <Separator orientation="vertical" class="h-6" />

  <!-- Creation Tools -->
  <div class="flex items-center gap-1">
    <Button variant="ghost" size="sm" onclick={addTextLayer} disabled={isRecording}>
      <Type class="h-4 w-4" />
    </Button>

    <DropdownMenu.Root>
      <DropdownMenu.Trigger disabled={isRecording}>
        <Button variant="ghost" size="sm" disabled={isRecording}>
          <Layers class="h-4 w-4" />
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item onclick={() => addShapeLayer('rectangle')}>
          <Square class="mr-2 h-4 w-4" />
          Rectangle
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => addShapeLayer('circle')}>
          <Circle class="mr-2 h-4 w-4" />
          Circle
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => addShapeLayer('triangle')}>
          <Triangle class="mr-2 h-4 w-4" />
          Triangle
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={addTerminalLayer}>
          <Terminal class="mr-2 h-4 w-4" />
          Terminal GUI
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={addMouseLayer}>
          <MousePointer class="mr-2 h-4 w-4" />
          Mouse Pointer
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={addButtonLayer}>
          <Zap class="mr-2 h-4 w-4" />
          Button
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={addPhoneLayer}>
          <Smartphone class="mr-2 h-4 w-4" />
          Phone
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={addBrowserLayer}>
          <Globe class="mr-2 h-4 w-4" />
          Browser
        </DropdownMenu.Item>
        {#each readonlyItems as item (item.label)}
          <DropdownMenu.Item disabled>
            {@const Icon = item.icon}
            <Icon class="mr-2 h-4 w-4" />
            {item.label}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </div>

  <Separator orientation="vertical" class="h-6" />

  <div class="flex-1"></div>

  <!-- Export -->
  <Button variant="default" size="sm" onclick={openExportDialog} disabled={isRecording}>
    <Download class="mr-2 h-4 w-4" />
    Export Video
  </Button>

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
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      <Button variant="ghost" size="sm" title="Keyboard Shortcuts">
        <Keyboard class="h-4 w-4" />
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

  <!-- User Menu -->
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      <Button variant="ghost" size="sm" title="Account">
        <User class="h-4 w-4" />
      </Button>
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-56">
      {#if $session.data}
        <DropdownMenu.Label>
          <div class="flex flex-col space-y-1">
            <p class="text-sm leading-none font-medium">{$session.data.user.name}</p>
            <p class="text-xs leading-none text-muted-foreground">{$session.data.user.email}</p>
          </div>
        </DropdownMenu.Label>
        <DropdownMenu.Separator />
        <DropdownMenu.Item>
          {#snippet child({ props })}
            <form {...signOut}>
              <button type="submit" class="flex w-full items-center" {...props}> Logout </button>
            </form>
          {/snippet}
          <LogOut class="mr-2 h-4 w-4" />
          Logout
        </DropdownMenu.Item>
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

  <a href="https://github.com/epavanello/devmotion" target="_blank" rel="noreferrer">
    <Github class="mx-2 h-5 w-5" />
  </a>
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
