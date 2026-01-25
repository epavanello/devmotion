<script lang="ts">
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
  } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import { Select } from '$lib/components/ui/select';
  import { projectStore } from '$lib/stores/project.svelte';
  import { Settings } from 'lucide-svelte';

  interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
  }

  let { open, onOpenChange }: Props = $props();

  let formData = $state({
    name: projectStore.project.name,
    width: projectStore.project.width,
    height: projectStore.project.height,
    duration: projectStore.project.duration,
    backgroundColor: projectStore.project.backgroundColor
  });

  const commonResolutions = [
    { label: 'Full HD (1920x1080)', width: 1920, height: 1080 },
    { label: 'HD (1280x720)', width: 1280, height: 720 },
    { label: '4K (3840x2160)', width: 3840, height: 2160 },
    { label: 'Square (1080x1080)', width: 1080, height: 1080 },
    { label: 'Mobile (720x1280)', width: 720, height: 1280 },
    { label: 'Custom', width: 0, height: 0 }
  ];

  let selectedResolution = $derived.by(() => {
    const res = commonResolutions.find(
      (r) => r.width === projectStore.project.width && r.height === projectStore.project.height
    );
    return res ? `${res.width}x${res.height}` : 'custom';
  });

  function handleResolutionChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    selectedResolution = target.value;

    if (target.value !== 'custom') {
      const res = commonResolutions.find((r) => `${r.width}x${r.height}` === target.value);
      if (res) {
        formData.width = res.width;
        formData.height = res.height;
      }
    }
  }

  function handleSave() {
    projectStore.project.name = formData.name;
    projectStore.project.width = formData.width;
    projectStore.project.height = formData.height;
    projectStore.project.duration = formData.duration;
    projectStore.project.backgroundColor = formData.backgroundColor;

    onOpenChange(false);
  }

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      // Reset form to current project state when opening
      formData = {
        name: projectStore.project.name,
        width: projectStore.project.width,
        height: projectStore.project.height,
        duration: projectStore.project.duration,
        backgroundColor: projectStore.project.backgroundColor
      };

      const res = commonResolutions.find(
        (r) => r.width === projectStore.project.width && r.height === projectStore.project.height
      );
      selectedResolution = res ? `${res.width}x${res.height}` : 'custom';
    }

    onOpenChange(newOpen);
  }
</script>

<Dialog {open} onOpenChange={handleOpenChange}>
  <DialogContent class="sm:max-w-106.25">
    <DialogHeader>
      <DialogTitle class="flex items-center gap-2">
        <Settings class="h-5 w-5" />
        Project Settings
      </DialogTitle>
      <DialogDescription>Edit your project configuration</DialogDescription>
    </DialogHeader>

    <div class="space-y-4 py-4">
      <!-- Project Name -->
      <div class="space-y-2">
        <Label for="project-name">Project Name</Label>
        <Input id="project-name" placeholder="Enter project name" bind:value={formData.name} />
      </div>

      <!-- Resolution -->
      <div class="space-y-2">
        <Label for="resolution">Resolution</Label>
        <Select id="resolution" value={selectedResolution} onchange={handleResolutionChange}>
          {#each commonResolutions as res (res.label)}
            <option value={res.label === 'Custom' ? 'custom' : `${res.width}x${res.height}`}>
              {res.label}
            </option>
          {/each}
        </Select>
      </div>

      <!-- Custom Width/Height -->
      {#if selectedResolution === 'custom'}
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <Label for="width">Width</Label>
            <Input id="width" type="number" min="100" max="8192" bind:value={formData.width} />
          </div>
          <div class="space-y-2">
            <Label for="height">Height</Label>
            <Input id="height" type="number" min="100" max="8192" bind:value={formData.height} />
          </div>
        </div>
      {/if}

      <!-- Duration -->
      <div class="space-y-2">
        <Label for="duration">Duration (seconds)</Label>
        <Input
          id="duration"
          type="number"
          min="1"
          max="600"
          step="0.1"
          bind:value={formData.duration}
        />
      </div>

      <!-- Background Color -->
      <div class="space-y-2">
        <Label for="bgcolor">Background Color</Label>
        <div class="flex gap-2">
          <Input id="bgcolor" type="color" bind:value={formData.backgroundColor} class="h-9 w-20" />
          <Input
            type="text"
            placeholder="#000000"
            bind:value={formData.backgroundColor}
            class="flex-1"
          />
        </div>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onclick={() => onOpenChange(false)}>Cancel</Button>
      <Button onclick={handleSave}>Save Changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
