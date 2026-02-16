<script lang="ts">
  import FontSelector from '$lib/components/font/font-selector.svelte';
  import type { GoogleFont } from '$lib/utils/fonts';
  import type { CustomPropertyComponentProps } from './field-registry';

  const { value, onChange }: CustomPropertyComponentProps = $props();

  const font = $derived(value as GoogleFont);
</script>

<FontSelector value={font} {onChange} />
