<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Input } from '$lib/components/ui/input';
  import * as Field from '$lib/components/ui/field/index.js';
  import GoogleIcon from '$lib/assets/svg/google-icon.svelte';
  import { signup } from '$lib/functions/auth.remote';

  const id = $props.id();
</script>

<Card.Root class="mx-auto w-full max-w-sm">
  <Card.Header>
    <Card.Title class="text-2xl">Sign Up</Card.Title>
    <Card.Description>Enter your information below to create your account</Card.Description>
  </Card.Header>
  <Card.Content>
    <form {...signup}>
      <Field.Group>
        <Field.Field>
          <Field.Label for="name-{id}">Name</Field.Label>
          <Input
            id="name-{id}"
            placeholder="John Doe"
            required
            {...signup.fields.name.as('text')}
          />
          {#each signup.fields.name.issues() as issue}
            <Field.Error>{issue.message}</Field.Error>
          {/each}
        </Field.Field>
        <Field.Field>
          <Field.Label for="email-{id}">Email</Field.Label>
          <Input
            id="email-{id}"
            placeholder="m@example.com"
            required
            {...signup.fields.email.as('email')}
          />
          {#each signup.fields.email.issues() as issue}
            <Field.Error>{issue.message}</Field.Error>
          {/each}
        </Field.Field>
        <Field.Field>
          <Field.Label for="password-{id}">Password</Field.Label>
          <Input id="password-{id}" required {...signup.fields.password.as('password')} />
          {#each signup.fields.password.issues() as issue}
            <Field.Error>{issue.message}</Field.Error>
          {/each}
        </Field.Field>
        <Field.Field>
          <Field.Label for="confirm-password-{id}">Confirm Password</Field.Label>
          <Input
            id="confirm-password-{id}"
            required
            {...signup.fields.confirmPassword.as('password')}
          />
          {#each signup.fields.confirmPassword.issues() as issue}
            <Field.Error>{issue.message}</Field.Error>
          {/each}
        </Field.Field>
        {#if !signup.result?.success}
          <Field.Error>{signup.result?.error}</Field.Error>
        {/if}
        <Field.Field>
          <Button type="submit" class="w-full" disabled={!!signup.pending}>Sign Up</Button>
          <Button variant="outline" class="w-full">
            <GoogleIcon />
            Sign up with Google
          </Button>
          <Field.Description class="text-center">
            Already have an account? <a href="/login">Sign in</a>
          </Field.Description>
        </Field.Field>
      </Field.Group>
    </form>
  </Card.Content>
</Card.Root>
