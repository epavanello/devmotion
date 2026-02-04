import { nanoid } from 'nanoid';

// Simple in-memory token store with expiration
// In production, this should be Redis or similar
const tokenStore = new Map<string, { projectId: string; expiresAt: number }>();

const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a temporary render token for a project
 */
export function generateRenderToken(projectId: string): string {
  const token = nanoid(32);
  const expiresAt = Date.now() + TOKEN_TTL_MS;

  tokenStore.set(token, { projectId, expiresAt });

  // Cleanup expired tokens periodically
  cleanupExpiredTokens();

  return token;
}

/**
 * Validate a render token
 */
export function validateRenderToken(token: string, projectId: string): boolean {
  const entry = tokenStore.get(token);

  if (!entry) {
    return false;
  }

  if (Date.now() > entry.expiresAt) {
    tokenStore.delete(token);
    return false;
  }

  if (entry.projectId !== projectId) {
    return false;
  }

  return true;
}

/**
 * Invalidate a token after use
 */
export function invalidateRenderToken(token: string): void {
  tokenStore.delete(token);
}

/**
 * Remove expired tokens
 */
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [token, entry] of tokenStore.entries()) {
    if (now > entry.expiresAt) {
      tokenStore.delete(token);
    }
  }
}
