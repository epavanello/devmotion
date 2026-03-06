import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';
import { polarClient } from '@polar-sh/better-auth/client';

import type { auth } from './server/auth';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const authClient = createAuthClient({
  baseURL: PUBLIC_BASE_URL,
  plugins: [inferAdditionalFields<typeof auth>(), polarClient()]
});

export const { signIn, signUp, useSession } = authClient;
