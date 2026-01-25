<script lang="ts" generics="T extends Thing">
  import type { Thing, WithContext } from 'schema-dts';

  const { item }: { item: WithContext<T> } = $props();
  const jsonLd = $derived(JSON.stringify(item, null, 2));
</script>

<svelte:head>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html `${'<'}script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>
