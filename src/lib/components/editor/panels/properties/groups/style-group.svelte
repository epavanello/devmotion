<script lang="ts">
  import type { PropertyGroupProps } from './types';
  import { extractPropertyMetadata } from '$lib/layers/base';
  import { LayerStyleSchema, stylePropertyGroups } from '$lib/schemas/base';
  import PropertyGroupRenderer from './property-group-renderer.svelte';

  const { currentValues, updateProperty, addKeyframe, layer }: PropertyGroupProps = $props();

  const stylePropertyMetadata = $derived.by(() => {
    return extractPropertyMetadata(LayerStyleSchema);
  });
</script>

<PropertyGroupRenderer
  {layer}
  {currentValues}
  {updateProperty}
  {addKeyframe}
  propertyMetadata={stylePropertyMetadata}
  propertyGroups={stylePropertyGroups}
  targetPath="style"
/>
