<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
  } from '$lib/components/ui/card';
  import { Type, Square, Circle, Sparkles, Keyboard } from 'lucide-svelte';
  import { projectStore } from '$lib/stores/project.svelte';
  import { createTextLayer, createShapeLayer } from '$lib/engine/layer-factory';

  const hasLayers = $derived(projectStore.project.layers.length > 0);

  function addTextLayer() {
    const layer = createTextLayer(projectStore.project.width / 2, projectStore.project.height / 2);
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  function addRectangle() {
    const layer = createShapeLayer(
      'rectangle',
      projectStore.project.width / 2,
      projectStore.project.height / 2
    );
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  function addCircle() {
    const layer = createShapeLayer(
      'circle',
      projectStore.project.width / 2,
      projectStore.project.height / 2
    );
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }
</script>

{#if !hasLayers}
  <div
    class="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
  >
    <Card class="pointer-events-auto max-w-2xl shadow-2xl">
      <CardHeader class="text-center">
        <CardTitle class="text-3xl">Welcome to Animation Editor</CardTitle>
        <CardDescription class="mt-2 text-base">
          Create stunning 2D/3D animations inspired by After Effects
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Quick Start -->
        <div class="space-y-3">
          <h3 class="flex items-center gap-2 text-sm font-semibold">
            <Sparkles class="h-4 w-4" />
            Quick Start
          </h3>
          <div class="grid grid-cols-3 gap-3">
            <Button variant="outline" class="h-20 flex-col gap-2" onclick={addTextLayer}>
              <Type class="h-6 w-6" />
              <span class="text-xs">Add Text</span>
              <span class="text-xs text-muted-foreground">Press T</span>
            </Button>
            <Button variant="outline" class="h-20 flex-col gap-2" onclick={addRectangle}>
              <Square class="h-6 w-6" />
              <span class="text-xs">Rectangle</span>
              <span class="text-xs text-muted-foreground">Press R</span>
            </Button>
            <Button variant="outline" class="h-20 flex-col gap-2" onclick={addCircle}>
              <Circle class="h-6 w-6" />
              <span class="text-xs">Circle</span>
              <span class="text-xs text-muted-foreground">Press C</span>
            </Button>
          </div>
        </div>

        <!-- Keyboard Shortcuts -->
        <div class="space-y-3">
          <h3 class="flex items-center gap-2 text-sm font-semibold">
            <Keyboard class="h-4 w-4" />
            Essential Shortcuts
          </h3>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex justify-between rounded bg-muted/50 p-2">
              <span>Play/Pause</span>
              <kbd class="rounded border bg-background px-2 py-1">Space</kbd>
            </div>
            <div class="flex justify-between rounded bg-muted/50 p-2">
              <span>Save Project</span>
              <kbd class="rounded border bg-background px-2 py-1">⌘S</kbd>
            </div>
            <div class="flex justify-between rounded bg-muted/50 p-2">
              <span>Zoom In/Out</span>
              <kbd class="rounded border bg-background px-2 py-1">+/-</kbd>
            </div>
            <div class="flex justify-between rounded bg-muted/50 p-2">
              <span>Toggle Grid</span>
              <kbd class="rounded border bg-background px-2 py-1">⌘G</kbd>
            </div>
          </div>
        </div>

        <!-- Tips -->
        <div class="space-y-1 border-t pt-4 text-xs text-muted-foreground">
          <p>💡 Tip: Add keyframes to create animations</p>
          <p>💡 Tip: Use animation presets for quick effects</p>
          <p>💡 Tip: Click objects to select and drag to move</p>
        </div>
      </CardContent>
    </Card>
  </div>
{/if}
