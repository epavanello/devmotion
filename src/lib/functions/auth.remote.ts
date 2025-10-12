import { command, form } from '$app/server';
import { auth } from '$lib/server/auth';
import { z } from 'zod';

export const login = form(
  z.object({ email: z.email(), password: z.string() }),
  async ({ email, password }) => {
    try {
      const response = await auth.api.signInEmail({
        body: { email, password }
      });
      return response;
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return { error: error.message };
      }

      return { error: 'An unknown error occurred' };
    }
  }
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
  async ({ name, email, password }) => {
    try {
      const response = await auth.api.signUpEmail({
        body: { name, email, password }
      });
      return response;
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return { error: error.message };
      }

      return { error: 'An unknown error occurred' };
    }
  }
);
export const forgotPassword = form(
  z.object({ email: z.email('Invalid email address') }),
  async ({ email }) => {
    try {
      const response = await auth.api.forgetPassword({
        body: { email }
      });
      return response;
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        return { error: error.message };
      }

      return { error: 'An unknown error occurred' };
    }
  }
);
