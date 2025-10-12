import { form } from '$app/server';
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
