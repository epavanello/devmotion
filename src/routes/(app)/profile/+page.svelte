<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import * as Field from '$lib/components/ui/field/index.js';
  import * as Avatar from '$lib/components/ui/avatar';
  import { getUser, signOut, updateUser } from '$lib/functions/auth.remote';
  import { User, Mail, LogOut } from '@lucide/svelte';

  const id = $props.id();
  const user = getUser();

  let showSuccess = $state(false);

  const handleUpdate = updateUser.enhance(async ({ submit }) => {
    await submit();
    if (updateUser.result?.success) {
      showSuccess = true;
      setTimeout(() => {
        showSuccess = false;
      }, 3000);
      await user.refresh();
    }
  });
</script>

<div class="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
  <Card.Root class="mx-auto w-full max-w-md">
    <Card.Header>
      <Card.Title class="text-2xl">Profile Settings</Card.Title>
      <Card.Description>Manage your account information and preferences</Card.Description>
    </Card.Header>
    <Card.Content>
      <div class="mb-6 flex items-center gap-4">
        <Avatar.Root class="size-16">
          <Avatar.Image src={user.current?.image} alt={user.current?.name ?? 'User'} />
          <Avatar.Fallback>
            {#if user.current?.name}
              {user.current.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            {:else}
              <User class="size-6" />
            {/if}
          </Avatar.Fallback>
        </Avatar.Root>
        <div class="flex-1">
          <p class="font-medium">{user.current?.name ?? 'User'}</p>
          <p class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Mail class="size-3.5" />
            {user.current?.email ?? ''}
          </p>
        </div>
      </div>

      <form {...handleUpdate}>
        <Field.Group>
          <Field.Field>
            <Field.Label for="name-{id}">Name</Field.Label>
            <Input
              id="name-{id}"
              placeholder="Your name"
              required
              {...updateUser.fields.name.as('text')}
              value={user.current?.name ?? ''}
            />
            {#each updateUser.fields.name.issues() as issue, index (index)}
              <Field.Error>{issue.message}</Field.Error>
            {/each}
          </Field.Field>

          <Field.Field>
            <Field.Label for="email-consent-{id}">
              <input
                id="email-consent-{id}"
                {...updateUser.fields.emailConsent.as('checkbox')}
                checked={user.current?.emailConsent ?? false}
                class="size-4 rounded border-input bg-background accent-primary"
              />
              <div>
                <div class="font-medium">Email notifications</div>
                <Field.Description class="mt-1">
                  Receive updates about new features and product improvements
                </Field.Description>
              </div>
            </Field.Label>
            {#each updateUser.fields.emailConsent.issues() as issue, index (index)}
              <Field.Error>{issue.message}</Field.Error>
            {/each}
          </Field.Field>

          {#if showSuccess}
            <div
              class="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
            >
              Profile updated successfully!
            </div>
          {/if}

          {#if !updateUser.result?.success && updateUser.result?.error}
            <Field.Error>{updateUser.result.error}</Field.Error>
          {/if}

          <Field.Field>
            <Button type="submit" class="w-full" disabled={!!updateUser.pending}>
              {updateUser.pending ? 'Updating...' : 'Update Profile'}
            </Button>
          </Field.Field>
        </Field.Group>
      </form>

      <div class="mt-6 border-t pt-6">
        <form {...signOut}>
          <Button type="submit" variant="outline" class="w-full" icon={LogOut}>Sign Out</Button>
        </form>
      </div>
    </Card.Content>
  </Card.Root>
</div>
