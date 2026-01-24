import { isRedirect } from '@sveltejs/kit';

export const withErrorHandling =
  <T extends unknown[], R>(fn: (...args: T) => Promise<R>) =>
  async (...args: T): Promise<{ success: true; data: R } | { success: false; error: string }> => {
    try {
      const data = await fn(...args);
      return { success: true, data };
    } catch (error) {
      if (isRedirect(error)) {
        throw error;
      }
      console.error(error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  };
