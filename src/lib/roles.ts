export const userRoles = ['user', 'admin'] as const;
export type UserRole = (typeof userRoles)[number];

/** Canonical role constants for type-safe role comparisons. */
export const ADMIN_ROLE = 'admin' as const satisfies UserRole;
export const USER_ROLE = 'user' as const satisfies UserRole;
