<script lang="ts">
  import { getLayerDefinition, getLayerSchema } from '$lib/layers/registry';
  import { extractPropertyMetadata } from '$lib/layers/base';
  import { isProjectLayer } from '$lib/layers/project-layer';
  import type { PropertyGroupProps } from './types';
  import PropertyGroupRenderer from './property-group-renderer.svelte';

  const {
    layer,
    currentValues,
    updateProperty,
    addKeyframe
  }: PropertyGroupProps & { isProjectSettings?: boolean } = $props();

  const isProjectSettings = $derived(isProjectLayer(layer.id));

  // Extract property metadata from the layer's Zod schema
  const layerPropertyMetadata = $derived.by(() => {
    const schema = getLayerSchema(layer.type);
    return extractPropertyMetadata(schema);
  });

  const layerDefinition = $derived.by(() => {
    return getLayerDefinition(layer.type);
  });
</script>

<PropertyGroupRenderer
  {layer}
  {currentValues}
  {updateProperty}
  {addKeyframe}
  propertyMetadata={layerPropertyMetadata}
  propertyGroups={layerDefinition?.propertyGroups}
  targetPath="props"
  showKeyframes={!isProjectSettings}
  customPropertyComponents={layerDefinition.customPropertyComponents}
/>
