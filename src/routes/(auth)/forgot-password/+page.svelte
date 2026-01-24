<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import * as Field from '$lib/components/ui/field/index.js';
  import { forgotPassword } from '$lib/functions/auth.remote';
  import { resolve } from '$app/paths';

  const id = $props.id();
</script>

<Card.Root class="mx-auto w-full max-w-sm">
  <Card.Header>
    <Card.Title class="text-2xl">Forgot Password</Card.Title>
    <Card.Description>Enter your email address and we'll send you a reset link</Card.Description>
  </Card.Header>
  <Card.Content>
    <form {...forgotPassword}>
      <Field.Group>
        <Field.Field>
          <Field.Label for="email-{id}">Email</Field.Label>
          <Input
            id="email-{id}"
            placeholder="m@example.com"
            required
            {...forgotPassword.fields.email.as('email')}
          />
          {#each forgotPassword.fields.email.issues() as issue, index (index)}
            <Field.Error>{issue.message}</Field.Error>
          {/each}
        </Field.Field>
        {#if forgotPassword.result && 'error' in forgotPassword.result && forgotPassword.result.error}
          <Field.Error>{forgotPassword.result.error}</Field.Error>
        {/if}
        {#if forgotPassword.result && !('error' in forgotPassword.result)}
          <Field.Field>
            <div class="rounded-md bg-green-50 p-4 text-green-800">
              <p class="text-sm">
                Password reset email sent! Check your inbox for further instructions.
              </p>
            </div>
          </Field.Field>
        {/if}
        <Field.Field>
          <Button type="submit" class="w-full" disabled={!!forgotPassword.pending}>
            Send Reset Link
          </Button>
          <Field.Description class="text-center">
            Remember your password? <a href={resolve('/login')}>Sign in</a>
          </Field.Description>
        </Field.Field>
      </Field.Group>
    </form>
  </Card.Content>
</Card.Root>
