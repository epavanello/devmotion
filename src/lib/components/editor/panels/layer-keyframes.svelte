<script lang="ts">
  import KeyframeCard from '../keyframe-card.svelte';
  import { Select } from '$lib/components/ui/select';
  import { SvelteSet } from 'svelte/reactivity';
  import type { TypedLayer } from '$lib/layers/typed-registry';

  let { layer }: { layer: TypedLayer } = $props();

  let selectedProperty = $state<string>('all');

  // Extract unique properties from keyframes
  const availableProperties = $derived.by(() => {
    const properties = new SvelteSet<string>();
    for (const keyframe of layer.keyframes) {
      properties.add(keyframe.property);
    }
    return ['all', ...Array.from(properties).sort()];
  });

  // Filter and sort keyframes based on selected property
  const filteredKeyframes = $derived.by(() => {
    const keyframes =
      selectedProperty === 'all'
        ? layer.keyframes
        : layer.keyframes.filter((kf) => kf.property === selectedProperty);

    return [...keyframes].sort((a, b) => a.time - b.time);
  });

  // Format property label for display
  function formatPropertyLabel(property: string): string {
    if (property === 'all') return 'All Properties';

    // Handle props.* properties
    if (property.startsWith('props.')) {
      const propName = property.slice(6); // Remove 'props.' prefix
      return propName.charAt(0).toUpperCase() + propName.slice(1);
    }

    // Handle built-in properties like position.x, scale.y, etc.
    const parts = property.split('.');
    if (parts.length === 2) {
      const [category, axis] = parts;
      return `${category.charAt(0).toUpperCase() + category.slice(1)} ${axis.toUpperCase()}`;
    }

    // Fallback: capitalize first letter
    return property.charAt(0).toUpperCase() + property.slice(1);
  }
</script>

<div class="space-y-3">
  {#if availableProperties.length > 1}
    <div class="flex items-center gap-2">
      <label for="property-filter" class="text-sm font-medium text-muted-foreground">
        Filter:
      </label>
      <Select
        trigger={{
          id: 'property-filter'
        }}
        bind:value={selectedProperty}
        options={availableProperties.map((property) => ({
          value: property,
          label: formatPropertyLabel(property)
        }))}
      />
    </div>
  {/if}

  <div class="space-y-2">
    {#if filteredKeyframes.length === 0}
      <p class="py-4 text-center text-sm text-muted-foreground">No keyframes found</p>
    {:else}
      {#each filteredKeyframes as keyframe (keyframe.id)}
        <KeyframeCard {keyframe} layerId={layer.id} />
      {/each}
    {/if}
  </div>
</div>
