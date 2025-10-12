import { auth } from '$lib/server/auth';

export async function load({ request }) {
  const session = await auth.api.getSession({
    headers: request.headers
  });

  return {
    serverSession: session ?? null
  };
}
