// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Session, User } from 'better-auth';

// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session: Session | null;
      user: User | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

declare module 'svelte/elements' {
  export interface HTMLAttributes {
    tw?: string;
  }
}

export {};
