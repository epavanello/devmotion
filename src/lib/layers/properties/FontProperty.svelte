<script lang="ts">
  import type { CustomPropertyComponentProps } from '../base';
  import FontSelector from '$lib/components/font/font-selector.svelte';
  import type { GoogleFont } from '$lib/utils/fonts';

  const { value, onChange }: CustomPropertyComponentProps = $props();

  const font = $derived(value as GoogleFont);
</script>

<FontSelector value={font} {onChange} />
