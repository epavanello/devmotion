import { command } from '$app/server';
import { z } from 'zod';

export const login = command(
  z.object({ email: z.email(), password: z.string() }),
  async ({ email, password }) => {
    console.log('login', email, password);
    return false;
  }
);
