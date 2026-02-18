export const userRoles = ['user', 'admin'] as const;
export type UserRole = (typeof userRoles)[number];
