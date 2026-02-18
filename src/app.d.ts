// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Session, User } from 'better-auth';
import type { UserRole } from '$lib/roles';

// for information about these interfaces
interface DevMotionAPI {
  ready: Promise<void>;
  seek: (time: number) => void;
  seekAndWait: (time: number) => Promise<void>;
  getConfig: () => {
    width: number;
    height: number;
    duration: number;
    fps: number;
  };
}

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session: Session | null;
      user: (Omit<User, 'role'> & { role: UserRole }) | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  interface Window {
    __DEVMOTION__?: DevMotionAPI;
  }
}

declare module 'svelte/elements' {
  export interface HTMLAttributes {
    tw?: string;
  }
}

export {};
