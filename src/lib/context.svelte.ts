import type { Session, User } from 'better-auth';
import { getContext, setContext } from 'svelte';

export interface SessionContext {
  user: User | null;
  session: Session | null;
}

const SESSION_CONTEXT = Symbol('session-context');

export function setSessionContext(initialSession: SessionContext) {
  const state = $state(initialSession);
  setContext(SESSION_CONTEXT, state);
  return state;
}

export function getSession() {
  return getContext<ReturnType<typeof setSessionContext>>(SESSION_CONTEXT);
}
