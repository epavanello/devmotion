<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription
	} from '$lib/components/ui/field/index.js';
	import GoogleIcon from '$lib/assets/svg/google-icon.svelte';

	const id = $props.id();
</script>

<Card.Root class="mx-auto w-full max-w-sm">
	<Card.Header>
		<Card.Title class="text-2xl">Login</Card.Title>
		<Card.Description>Enter your email below to login to your account</Card.Description>
	</Card.Header>
	<Card.Content>
		<form>
			<FieldGroup>
				<Field>
					<FieldLabel for="email-{id}">Email</FieldLabel>
					<Input id="email-{id}" type="email" placeholder="m@example.com" required />
				</Field>
				<Field>
					<div class="flex items-center">
						<FieldLabel for="password-{id}">Password</FieldLabel>
						<a href="##" class="ml-auto inline-block text-sm underline"> Forgot your password? </a>
					</div>
					<Input id="password-{id}" type="password" required />
				</Field>
				<Field>
					<Button type="submit" class="w-full">Login</Button>
					<Button variant="outline" class="w-full">
						<GoogleIcon />
						Login with Google
					</Button>
					<FieldDescription class="text-center">
						Don't have an account? <a href="##">Sign up</a>
					</FieldDescription>
				</Field>
			</FieldGroup>
		</form>
	</Card.Content>
</Card.Root>
