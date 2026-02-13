<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button';
  import GoogleIcon from '$lib/assets/svg/google-icon.svelte';
  import { authClient } from '$lib/auth-client';

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
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="w-[24rem]">
    <Dialog.Header>
      <Dialog.Title>Login required</Dialog.Title>
      <Dialog.Description>
        You need to be signed in to {action}.
      </Dialog.Description>
    </Dialog.Header>

    <div class="flex flex-col gap-3 pt-2">
      <Button class="w-full" onclick={handleGoogleLogin} icon={GoogleIcon}>
        Continue with Google
      </Button>
      <div class="text-right text-xs text-muted-foreground">free AI credits included</div>
    </div>
  </Dialog.Content>
</Dialog.Root>
