<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button';
  import { Mail } from '@lucide/svelte';
  import SocialAuthButtons from '$lib/components/auth/social-auth-buttons.svelte';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import type { ResolvedPathname } from '$app/types';

  interface Props {
    open: boolean;
    /** What the user was trying to do — shown in the dialog body */
    action?: string;
    /** Optional custom callback URL after login. Defaults to current page. */
    callbackURL?: string;
  }

  let { open = $bindable(), action = 'this action', callbackURL }: Props = $props();

  function handleEmailLogin() {
    // Redirect to full login page with redirect param
    const redirectPath = callbackURL ?? page.url.pathname;
    const loginUrl =
      `${resolve('/login')}?redirect=${encodeURIComponent(redirectPath)}` as ResolvedPathname;
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(loginUrl);
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="w-full max-w-md gap-6 p-8">
    <Dialog.Header class="space-y-3 text-center">
      <div class="mx-auto mb-2 flex items-center gap-2 text-2xl font-bold">
        <span
          class="bg-linear-to-r from-(--brand-blue) to-(--brand-purple) bg-clip-text text-transparent"
        >
          DevMotion
        </span>
      </div>
      <Dialog.Title class="text-2xl font-bold tracking-tight">Start Animating.</Dialog.Title>
      <Dialog.Description class="text-base text-muted-foreground">
        Sign in to {action}
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4">
      <SocialAuthButtons
        variant="outline"
        size="lg"
        buttonText="Continue with Google"
        showSeparator={true}
        {callbackURL}
      />

      <Button
        size="lg"
        class="w-full justify-center gap-3 text-base"
        onclick={handleEmailLogin}
        icon={Mail}
      >
        Continue with email
      </Button>
    </div>

    <div class="space-y-3 text-center">
      <p class="text-sm text-muted-foreground">
        Already have an account?
        <button class="font-medium text-foreground hover:underline" onclick={handleEmailLogin}>
          Log in
        </button>
      </p>
      <p class="text-xs text-muted-foreground">
        By continuing, you agree to the
        <a href={resolve('/terms')} class="underline hover:text-foreground">Terms of Service</a>
        and
        <a href={resolve('/privacy')} class="underline hover:text-foreground">Privacy Policy</a>
      </p>
    </div>
  </Dialog.Content>
</Dialog.Root>
