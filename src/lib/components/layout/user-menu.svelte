<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { User, LogOut, UserCircle, MessageSquare } from '@lucide/svelte';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
  import { getUser, signOut } from '$lib/functions/auth.remote';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { authClient } from '$lib/auth-client';
  import GoogleIcon from '$lib/assets/svg/google-icon.svelte';
  import { page } from '$app/state';

  const user = $derived(await getUser());

  async function handleLogin() {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: page.url.pathname === '/' ? '/editor' : page.url.pathname
    });
  }
</script>

{#if user}
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button variant="ghost" icon={User} {...props} />
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      <DropdownMenu.Label>
        <div class="flex flex-col space-y-1">
          <p class="text-sm leading-none font-medium">{user.name}</p>
          <p class="text-xs leading-none text-muted-foreground">
            {user.email}
          </p>
        </div>
      </DropdownMenu.Label>
      <DropdownMenu.Separator />
      <DropdownMenu.Item onclick={() => goto(resolve('/profile'))}>
        <UserCircle />
        Profile
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <DropdownMenu.Item
        onclick={() => {
          window.open('https://devmotion.canny.io/feature-requests', '_blank');
        }}
      >
        <MessageSquare />
        Request a feature
      </DropdownMenu.Item>
      <DropdownMenu.Separator />
      <form
        {...signOut.enhance(async ({ submit }) => {
          await submit();
          if (page.url.pathname.startsWith('/editor/p/')) {
            goto(resolve('/editor'));
          }
          getUser().refresh();
        })}
      >
        <DropdownMenu.Item>
          {#snippet child({ props })}
            <Button {...props} variant="ghost" type="submit" class="w-full">Logout</Button>
          {/snippet}
          <LogOut />
          Logout
        </DropdownMenu.Item>
      </form>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
{:else}
  <Button onclick={handleLogin} icon={GoogleIcon} variant="outline">Login</Button>
{/if}
