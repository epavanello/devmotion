import { command, form, getRequestEvent, query } from '$app/server';
import { auth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { withErrorHandling } from '.';

export const login = form(
  z.object({ email: z.email(), password: z.string() }),
  withErrorHandling(async ({ email, password }) => {
    const { request } = getRequestEvent();
    await auth.api.signInEmail({
      body: { email, password },
      headers: request.headers
    });
    redirect(303, '/');
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
    await auth.api.signUpEmail({
      body: { name, email, password }
    });
    redirect(303, '/');
  })
);
export const forgotPassword = form(
  z.object({ email: z.email('Invalid email address') }),
  withErrorHandling(async ({ email }) => {
    await auth.api.forgetPassword({
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
    await getUser().refresh();
    redirect(303, '/');
  })
);

export const getUser = query(async () => {
  const { locals } = getRequestEvent();
  return locals.user;
});

export const checkRole = query(z.enum(['admin', 'user']), async (role) => {
  const { locals } = getRequestEvent();
  if (locals.user?.role !== role) {
    throw redirect(303, '/');
  }
});
