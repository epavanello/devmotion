<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';

  let { children, data } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if data.session}
  <p>Logged in</p>
{:else}
  <p>Logged out</p>
{/if}

{@render children?.()}
