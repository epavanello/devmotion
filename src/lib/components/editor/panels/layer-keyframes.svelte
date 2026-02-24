<script lang="ts">
  import KeyframeSegment from '../keyframe-segment.svelte';
  import { Select } from '$lib/components/ui/select';
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import InputWrapper from './input-wrapper.svelte';
  import { groupKeyframesIntoSegments, getUniqueProperties } from '$lib/utils/keyframe-segments';
  import type { AnimatableProperty } from '$lib/types/animation';

  let { layer }: { layer: TypedLayer } = $props();

  let selectedProperty = $state<string>('all');

  // Extract unique properties from keyframes
  const availableProperties = $derived.by(() => {
    const properties = getUniqueProperties(layer.keyframes);
    return ['all', ...properties];
  });

  // Generate segments for each property (exclude final keyframes and holds from panel view)
  const segments = $derived.by(() => {
    if (selectedProperty === 'all') {
      // Group by property, then create segments for each property
      const properties = getUniqueProperties(layer.keyframes);
      return properties
        .flatMap((prop) => groupKeyframesIntoSegments(layer.keyframes, prop))
        .filter((seg) => !seg.isFinal && !seg.isHold); // Hide final keyframes and holds in panel
    } else {
      // Single property segments
      return groupKeyframesIntoSegments(
        layer.keyframes,
        selectedProperty as AnimatableProperty
      ).filter((seg) => !seg.isFinal && !seg.isHold); // Hide final keyframes and holds in panel
    }
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

{#if availableProperties.length > 2}
  <InputWrapper label="Filter" for="property-filter">
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
  </InputWrapper>
{/if}

<div class="space-y-2">
  {#if segments.length === 0}
    <p class="py-4 text-center text-sm text-muted-foreground">No keyframes found</p>
  {:else}
    {#each segments as segment (segment.startKeyframe.id)}
      <KeyframeSegment {segment} layerId={layer.id} layerType={layer.type} />
    {/each}
  {/if}
</div>
