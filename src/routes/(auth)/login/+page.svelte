<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import * as Field from '$lib/components/ui/field/index.js';
  import GoogleIcon from '$lib/assets/svg/google-icon.svelte';
  import { login } from '$lib/functions/auth.remote';
  import { authClient } from '$lib/auth-client';
  import { resolve } from '$app/paths';

  const id = $props.id();

  async function handleGoogleLogin() {
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/'
      });
    } catch (error) {
      console.error('Google login failed:', error);
    }
  }
</script>

<Card.Root class="mx-auto w-full max-w-sm">
  <Card.Header>
    <Card.Title class="text-2xl">Login</Card.Title>
    <Card.Description>Enter your email below to login to your account</Card.Description>
  </Card.Header>
  <Card.Content>
    <form
      {...login.enhance(async ({ submit }) => {
        submit();
      })}
    >
      <Field.Group>
        <Field.Field>
          <Field.Label for="email-{id}">Email</Field.Label>
          <Input
            id="email-{id}"
            placeholder="m@example.com"
            required
            {...login.fields.email.as('email')}
          />
          {#each login.fields.email.issues() as issue, index (index)}
            <Field.Error>{issue.message}</Field.Error>
          {/each}
        </Field.Field>
        <Field.Field>
          <div class="flex items-center">
            <Field.Label for="password-{id}">Password</Field.Label>
            <a href={resolve('/forgot-password')} class="ml-auto inline-block text-sm underline">
              Forgot your password?
            </a>
          </div>
          <Input id="password-{id}" required {...login.fields.password.as('password')} />
          {#each login.fields.password.issues() as issue, index (index)}
            <Field.Error>{issue.message}</Field.Error>
          {/each}
        </Field.Field>
        {#if !login.result?.success}
          <Field.Error>{login.result?.error}</Field.Error>
        {/if}
        <Field.Field>
          <Button type="submit" class="w-full" disabled={!!login.pending}>Login</Button>
          <Button
            type="button"
            variant="outline"
            class="w-full"
            onclick={handleGoogleLogin}
            icon={GoogleIcon}
          >
            Login with Google
          </Button>
          <Field.Description class="text-center">
            Don't have an account? <a href={resolve('/signup')}>Sign up</a>
          </Field.Description>
        </Field.Field>
      </Field.Group>
    </form>
  </Card.Content>
</Card.Root>
