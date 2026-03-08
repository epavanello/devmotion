import { betterAuth } from 'better-auth';
import { createAuthMiddleware } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import {
  PUBLIC_BASE_URL,
  PUBLIC_POLAR_CREATOR_PRODUCT_ID,
  PUBLIC_POLAR_PRO_PRODUCT_ID,
  PUBLIC_POLAR_LIFETIME_PRODUCT_ID
} from '$env/static/public';
import {
  PRIVATE_BETTER_AUTH_SECRET,
  PRIVATE_GOOGLE_CLIENT_ID,
  PRIVATE_GOOGLE_CLIENT_SECRET,
  POLAR_ACCESS_TOKEN,
  POLAR_SERVER,
  POLAR_WEBHOOK_SECRET
} from '$env/static/private';
import { userRoles } from './db/schema';
import { scheduleOnboardingEmail, scheduleFollowUpEmail } from './workers/onboarding-email';
import { Polar } from '@polar-sh/sdk';
import { polar, checkout, portal, webhooks } from '@polar-sh/better-auth';
import { subscriptionService } from './services/subscription';
import type { Subscription } from '@polar-sh/sdk/models/components/subscription.js';

// Initialize Polar SDK client
const polarClient = new Polar({
  accessToken: POLAR_ACCESS_TOKEN,
  server: POLAR_SERVER as 'production' | 'sandbox'
});

/**
 * Helper function to update user subscription from Polar subscription data
 */
async function updateUserSubscriptionFromPolar(userId: string, subscription: Subscription) {
  const tierMapping: Record<string, 'creator' | 'pro' | 'lifetime'> = {
    [PUBLIC_POLAR_CREATOR_PRODUCT_ID]: 'creator' as const,
    [PUBLIC_POLAR_PRO_PRODUCT_ID]: 'pro' as const,
    [PUBLIC_POLAR_LIFETIME_PRODUCT_ID]: 'lifetime' as const
  };

  await subscriptionService.updateFromPolar(
    userId,
    {
      id: subscription.id as string,
      productId: subscription.productId as string,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
    },
    tierMapping
  );
}
export const auth = betterAuth({
  baseURL: PUBLIC_BASE_URL,
  basePath: '/api/auth',
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
  // Allow better-auth to work behind proxies like ngrok
  trustedOrigins: [
    PUBLIC_BASE_URL,
    // Allow ngrok domains in development
    ...(PUBLIC_BASE_URL.includes('ngrok') ? ['https://*.ngrok-free.dev', 'https://*.ngrok.io'] : [])
  ],
  advanced: {
    useSecureCookies: PUBLIC_BASE_URL.startsWith('https'),
    // Critical: Disable origin check when behind proxy in development
    disableCSRFCheck: PUBLIC_BASE_URL.includes('ngrok')
  },
  plugins: [
    sveltekitCookies(getRequestEvent),
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      getCustomerCreateParams: async ({ user }) => {
        console.log({ user });
        return {
          metadata: {
            ...(user.id && { userId: user.id }),
            ...(user.email && { email: user.email })
          }
        };
      },
      use: [
        checkout({
          products: [
            PUBLIC_POLAR_CREATOR_PRODUCT_ID && {
              productId: PUBLIC_POLAR_CREATOR_PRODUCT_ID,
              slug: 'creator'
            },
            PUBLIC_POLAR_PRO_PRODUCT_ID && {
              productId: PUBLIC_POLAR_PRO_PRODUCT_ID,
              slug: 'pro'
            },
            PUBLIC_POLAR_LIFETIME_PRODUCT_ID && {
              productId: PUBLIC_POLAR_LIFETIME_PRODUCT_ID,
              slug: 'lifetime'
            }
          ].filter(Boolean) as Array<{ productId: string; slug: string }>,
          successUrl: '/editor?checkout=success&checkout_id={CHECKOUT_ID}',
          authenticatedUsersOnly: true
        }),
        portal(),
        webhooks({
          secret: POLAR_WEBHOOK_SECRET,

          // Handle one-time purchases (lifetime plan) - triggered when payment is completed
          onOrderPaid: async (payload) => {
            const customerId = payload.data.customerId;
            const productId = payload.data.productId;

            // Check if this is a lifetime plan purchase
            if (productId === PUBLIC_POLAR_LIFETIME_PRODUCT_ID) {
              const customer = await polarClient.customers.get({ id: customerId });
              if (customer.externalId) {
                // Create lifetime subscription (credit balance auto-initialized by upsert)
                await subscriptionService.upsert(customer.externalId, {
                  tier: 'lifetime',
                  enabled: true,
                  currentPeriodStart: new Date(),
                  currentPeriodEnd: new Date('2099-12-31'), // Far future date for lifetime
                  cancelAtPeriodEnd: false
                });
              }
            }
          },

          // Handle subscription lifecycle events (recurring plans)
          onSubscriptionActive: async (payload) => {
            // Update user subscription in database
            const customerId = payload.data.customerId;
            // Find user by Polar customer ID (externalId)
            const customer = await polarClient.customers.get({ id: customerId });
            if (customer.externalId) {
              await updateUserSubscriptionFromPolar(customer.externalId, payload.data);
            }
          },
          onSubscriptionCanceled: async (payload) => {
            const customerId = payload.data.customerId;
            const customer = await polarClient.customers.get({ id: customerId });
            if (customer.externalId) {
              await subscriptionService.markCanceled(customer.externalId);
            }
          },
          onSubscriptionRevoked: async (payload) => {
            const customerId = payload.data.customerId;
            const customer = await polarClient.customers.get({ id: customerId });
            if (customer.externalId) {
              // Downgrade to free tier
              await subscriptionService.revokeAndDowngrade(customer.externalId);
            }
          },
          onSubscriptionUpdated: async (payload) => {
            const customerId = payload.data.customerId;
            const customer = await polarClient.customers.get({ id: customerId });
            if (customer.externalId) {
              await updateUserSubscriptionFromPolar(customer.externalId, payload.data);
            }
          }
        })
      ]
    })
  ],
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Intercept social sign-up to grant welcome bonus
      if (ctx.path.startsWith('/callback/:id')) {
        const newSession = ctx.context.newSession;
        if (newSession) {
          const user = newSession.user;

          // Create free tier subscription for new sign-ups
          if (ctx.context.socialProviders.find((p) => p.id === 'google')) {
            // Check if user already has a subscription
            const isNewUser = !(await subscriptionService.exists(user.id));

            // Only create if doesn't exist (new user)
            if (isNewUser) {
              await subscriptionService.createFreeTier(user.id, 'Welcome bonus for new sign-up');

              // Schedule onboarding email for new Google sign-ups (if consent given)
              if (user.emailConsent !== false) {
                await scheduleOnboardingEmail({
                  userId: user.id,
                  email: user.email,
                  name: user.name
                });
                await scheduleFollowUpEmail({
                  userId: user.id,
                  email: user.email,
                  name: user.name
                });
              }
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
