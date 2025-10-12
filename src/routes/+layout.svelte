<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { getSession, setSessionContext } from '$lib/context.svelte';
  import { watch } from 'runed';
  import { authClient } from '$lib/auth-client';
  import { onMount } from 'svelte';

  let { children, data } = $props();

  const clientSession = authClient.useSession();

  setSessionContext({
    session: data.serverSession?.session ?? $clientSession.data?.session ?? null,
    user: data.serverSession?.user ?? $clientSession.data?.user ?? null
  });

  const context = getSession();

  onMount(() => {
    clientSession.listen((session) => {
      context.session = session?.data?.session ?? null;
      context.user = session?.data?.user ?? null;
    });
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
