<script lang="ts">
  import { getEditorState } from '$lib/contexts/editor.svelte';
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Code, Film, Folder, LayoutGrid, Plus, Shapes, Type } from '@lucide/svelte';
  import { layerRegistry, type LayerMeta } from '$lib/layers/registry';
  import { createLayer } from '$lib/engine/layer-factory';
  import type { LayerTypeString } from '$lib/layers/layer-types';
  import type { LiteralUnion } from 'type-fest';
  import type { LayerCategory } from '$lib/layers/base';
  import { SvelteMap } from 'svelte/reactivity';
  import type { Component } from 'svelte';

  const editorState = $derived(getEditorState());
  const projectStore = $derived(editorState.project);

  function addLayer(type: LiteralUnion<LayerTypeString, string>) {
    const layer = createLayer(type, {
      trasform: { x: 0, y: 0 },
      projectDimensions: {
        width: projectStore.state.width,
        height: projectStore.state.height
      }
    });
    projectStore.addLayer(layer);
    projectStore.selectedLayerId = layer.id;
  }

  const hiddenTypes = new Set<LiteralUnion<LayerTypeString, string>>(['captions', 'group']);

  const categoryOrder: LayerCategory[] = ['media', 'text', 'shape', 'code', 'ui'];

  const categoryConfig: Record<string, { icon: Component; label: string }> = {
    media: { icon: Film, label: 'Media' },
    text: { icon: Type, label: 'Text' },
    shape: { icon: Shapes, label: 'Shapes' },
    code: { icon: Code, label: 'Code' },
    ui: { icon: LayoutGrid, label: 'UI Elements' }
  };

  const groupedLayers = $derived.by(() => {
    const groups = new SvelteMap<LayerCategory, LayerMeta[]>();
    for (const layer of Object.values(layerRegistry)) {
      if (hiddenTypes.has(layer.type)) continue;
      const cat = layer.category;
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(layer);
    }
    return categoryOrder
      .filter((c) => groups.has(c))
      .map((c) => ({
        category: c,
        ...categoryConfig[c],
        layers: groups.get(c)!
      }));
  });
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger disabled={projectStore.isRecording}>
    {#snippet child({ props })}
      <Button variant="outline" size="icon" {...props}>
        <Plus />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="start" class="max-h-80 overflow-y-auto">
    <!-- Folder/Group option at the top -->
    <DropdownMenu.Item onclick={() => addLayer('group')}>
      <Folder class="mr-2 h-4 w-4" />
      Folder
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    {#each groupedLayers as group, i (group.category)}
      <DropdownMenu.Group>
        <DropdownMenu.GroupHeading class="flex items-center">
          {@const CatIcon = group.icon}
          <CatIcon class="mr-2 h-3.5 w-3.5" />
          {group.label}
        </DropdownMenu.GroupHeading>
        {#each group.layers as layer (layer.type)}
          <DropdownMenu.Item onclick={() => addLayer(layer.type)}>
            {#if layer.icon}
              {@const Icon = layer.icon}
              <Icon class="mr-2 h-4 w-4" />
            {/if}
            {layer.label}
          </DropdownMenu.Item>
        {/each}
      </DropdownMenu.Group>
      {#if i < groupedLayers.length - 1}
        <DropdownMenu.Separator />
      {/if}
    {/each}
  </DropdownMenu.Content>
</DropdownMenu.Root>
