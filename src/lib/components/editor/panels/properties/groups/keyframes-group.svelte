<script lang="ts">
  import type { TypedLayer } from '$lib/layers/typed-registry';
  import LayerKeyframes from '../../layer-keyframes.svelte';

  const { layer }: { layer: TypedLayer } = $props();
</script>

<LayerKeyframes {layer} />
