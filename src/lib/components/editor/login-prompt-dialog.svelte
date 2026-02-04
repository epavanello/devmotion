<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button';
  import GoogleIcon from '$lib/assets/svg/google-icon.svelte';
  import { authClient } from '$lib/auth-client';
  import { resolve } from '$app/paths';
  import { goto } from '$app/navigation';

  interface Props {
    open: boolean;
    /** What the user was trying to do — shown in the dialog body */
    action?: string;
  }

  let { open = $bindable(), action = 'this action' }: Props = $props();

  async function handleGoogleLogin() {
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.pathname
      });
    } catch (error) {
      console.error('Google login failed:', error);
    }
  }

  function handleEmailLogin() {
    open = false;
    goto(resolve('/login'));
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="max-w-sm">
    <Dialog.Header>
      <Dialog.Title>Login required</Dialog.Title>
      <Dialog.Description>
        You need to be signed in to {action}.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col gap-3 pt-2">
      <Button class="w-full" onclick={handleGoogleLogin} icon={GoogleIcon}>
        Continue with Google — free AI credits included
      </Button>
      <Button variant="outline" class="w-full" onclick={handleEmailLogin}>
        Sign in with email
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
