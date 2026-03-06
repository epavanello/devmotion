<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import GoogleIcon from '$lib/assets/svg/google-icon.svelte';
  import { authClient } from '$lib/auth-client';
  import { page } from '$app/state';
  import { Separator } from '$lib/components/ui/separator';

  interface Props {
    /**
     * Redirect URL after successful authentication.
     * Defaults to current pathname.
     * Security: Only relative paths allowed.
     */
    callbackURL?: string;
    /** Show "OR" separator above buttons (for use with email form) */
    showSeparator?: boolean;
    /** Button variant */
    variant?: 'default' | 'outline';
    /** Button size */
    size?: 'default' | 'lg' | 'sm';
    /** Additional info text to show below button */
    helperText?: string;
    /** Custom button text */
    buttonText?: string;
  }

  let {
    callbackURL,
    showSeparator = false,
    variant = 'outline',
    size = 'default',
    helperText = 'Google sign-in includes free AI credits',
    buttonText = 'Continue with Google'
  }: Props = $props();

  async function handleGoogleLogin() {
    try {
      // Security: Validate redirect is relative path
      const finalCallbackURL = getSecureCallbackURL(callbackURL);

      await authClient.signIn.social({
        provider: 'google',
        callbackURL: finalCallbackURL
      });
    } catch (error) {
      console.error('Google login failed:', error);
    }
  }

  /**
   * Validates and returns a secure callback URL.
   * Only allows relative paths to prevent open redirect attacks.
   */
  function getSecureCallbackURL(url: string | undefined): string {
    const defaultPath = page.url.pathname === '/' ? '/editor' : page.url.pathname;
    if (!url) {
      // Use current pathname if no URL provided
      return defaultPath;
    }

    // Security: Only allow relative paths
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }

    // Fallback to root if invalid
    console.warn('Invalid callback URL provided, using root instead:', url);
    return defaultPath;
  }
</script>

<div class="space-y-4">
  {#if showSeparator}
    <div class="relative flex items-center gap-4 py-2">
      <Separator class="flex-1" />
      <span class="text-sm text-muted-foreground">OR</span>
      <Separator class="flex-1" />
    </div>
  {/if}

  <div class="space-y-3">
    <Button
      {variant}
      {size}
      class="w-full justify-center gap-3"
      onclick={handleGoogleLogin}
      icon={GoogleIcon}
    >
      {buttonText}
    </Button>

    {#if helperText}
      <p class="text-center text-xs text-muted-foreground">
        {helperText}
      </p>
    {/if}
  </div>
</div>
