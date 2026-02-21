import type { UserRole } from './server/db/schema';

/** Canonical role constants for type-safe role comparisons. */
export const ADMIN_ROLE = 'admin' as const satisfies UserRole;
export const USER_ROLE = 'user' as const satisfies UserRole;
