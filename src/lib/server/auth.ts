import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
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
import { aiUserUnlock, userRoles } from './db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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
  plugins: [sveltekitCookies(getRequestEvent)],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Intercept social sign-up to grant welcome bonus
      if (ctx.path.startsWith('/callback/:id')) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          const user = newSession.user;

          // Grant 20 cents to new Google sign-ups
          if (ctx.context.socialProviders.find((p) => p.id === 'google')) {
            // Check if user already has an AI unlock record
            const existingUnlock = await db
              .select()
              .from(aiUserUnlock)
              .where(eq(aiUserUnlock.userId, user.id))
              .limit(1);

            // Only create if doesn't exist (new user)
            if (existingUnlock.length === 0) {
              await db.insert(aiUserUnlock).values({
                id: nanoid(),
                userId: user.id,
                enabled: true,
                maxCostPerMonth: 0.2, // 20 cents
                notes: 'Welcome bonus for new Google sign-up'
              });
            }
          }
        }
      }
    })
  },
  user: {
    additionalFields: {
      role: {
        type: [...userRoles],
        required: true,
        defaultValue: 'user',
        input: false
      },
      emailConsent: {
        type: 'boolean',
        required: true,
        defaultValue: true,
        input: true
      }
    },
    deleteUser: {
      enabled: true
    }
  }
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
