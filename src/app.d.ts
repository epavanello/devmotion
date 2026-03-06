/// <reference types="mdsvex/globals" />

import type { Session, User } from '$lib/server/auth';
import type { PlanTier } from '$lib/config/plans';

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
      user:
        | (User & {
            subscriptionTier: PlanTier;
          })
        | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  interface Window {
    __DEVMOTION__?: DevMotionAPI;

    plausible:
      | {
          (eventName: string, options?: Record<string, unknown>): void;
          q: Array<[string, Record<string, unknown>?]>;
        }
      | undefined;
  }
}

declare module 'svelte/elements' {
  export interface HTMLAttributes {
    tw?: string;
  }
}

export {};
