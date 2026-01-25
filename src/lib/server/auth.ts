import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { PUBLIC_BASE_URL } from '$env/static/public';
import {
  PRIVATE_BETTER_AUTH_SECRET,
  PRIVATE_GOOGLE_CLIENT_ID,
  PRIVATE_GOOGLE_CLIENT_SECRET
} from '$env/static/private';

export const auth = betterAuth({
  secret: PRIVATE_BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg'
  }),
  emailAndPassword: {
    enabled: true
  },
  socialProviders: {
    google: {
      clientId: PRIVATE_GOOGLE_CLIENT_ID,
      clientSecret: PRIVATE_GOOGLE_CLIENT_SECRET
    }
  },
  baseURL: PUBLIC_BASE_URL,
  plugins: [sveltekitCookies(getRequestEvent)]
});
