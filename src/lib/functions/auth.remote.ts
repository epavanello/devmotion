import { form, getRequestEvent, query } from '$app/server';
import { auth } from '$lib/server/auth';
import { invalid, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { withErrorHandling } from '.';
import { db } from '$lib/server/db';
import { userSubscription } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import {
  scheduleOnboardingEmail,
  scheduleFollowUpEmail
} from '$lib/server/workers/onboarding-email';
import { resolve } from '$app/paths';

export const login = form(
  z.object({ email: z.email(), password: z.string() }),
  withErrorHandling(async ({ email, password }) => {
    const { request, url } = getRequestEvent();
    await auth.api.signInEmail({
      body: { email, password },
      headers: request.headers
    });

    // Get redirect param and validate it's a relative path
    const redirectTo = url.searchParams.get('redirect');
    const destination =
      redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
        ? redirectTo
        : resolve('/editor');

    redirect(303, destination);
  })
);

export const signup = form(
  z
    .object({
      name: z.string().min(1, 'Name is required'),
      email: z.email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string()
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword']
    }),
  withErrorHandling(async ({ name, email, password }) => {
    const result = await auth.api.signUpEmail({
      body: { name, email, password }
    });

    await scheduleOnboardingEmail({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name
    });
    await scheduleFollowUpEmail({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name
    });

    redirect(303, resolve('/editor'));
  })
);
export const forgotPassword = form(
  z.object({ email: z.email('Invalid email address') }),
  withErrorHandling(async ({ email }) => {
    await auth.api.requestPasswordReset({
      body: { email }
    });
  })
);

export const signOut = form(
  withErrorHandling(async () => {
    const { request, locals } = getRequestEvent();
    await auth.api.signOut({
      headers: request.headers
    });
    locals.session = null;
    locals.user = null;
  })
);

export const getUser = query(async () => {
  const { locals } = getRequestEvent();
  const user = locals.user;
  if (!user?.id) {
    return null;
  }
  const subscription = await db
    .select({ tier: userSubscription.tier })
    .from(userSubscription)
    .where(eq(userSubscription.userId, user.id));
  return { ...locals.user, tier: subscription[0]?.tier || 'free' };
});

export const getUserOrRedirect = query(async () => {
  const { url } = getRequestEvent();
  const user = await getUser();
  if (!user) {
    redirect(303, `${resolve('/login')}?redirect=${url.pathname}`);
  }
  return user;
});

export const checkRole = query(z.enum(['admin', 'user']), async (role) => {
  const { locals } = getRequestEvent();
  if (locals.user?.role !== role) {
    redirect(303, '/');
  }
});

export const updateUser = form(
  z.object({
    name: z.string().min(1, 'Name is required'),
    emailConsent: z.boolean().optional().default(false)
  }),
  withErrorHandling(async ({ name, emailConsent }, issues) => {
    const { request, locals } = getRequestEvent();

    // Check authentication
    if (!locals.user?.id) {
      invalid(issues('Not authenticated'));
    }

    await auth.api.updateUser({ body: { name, emailConsent }, headers: request.headers });
  })
);
