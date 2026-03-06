import { auth } from '$lib/server/auth';
import { redirect, error, isRedirect } from '@sveltejs/kit';

export const GET = async ({ params: { slug }, request }) => {
  try {
    if (!slug || (slug !== 'creator' && slug !== 'pro')) {
      return error(400, 'Invalid tier. Must be "creator" or "pro"');
    }

    // Use the server-side auth.api to initiate checkout
    const checkoutResponse = await auth.api.checkout({
      body: { slug },
      headers: request.headers
    });

    if (!checkoutResponse) {
      return error(500, 'Failed to create checkout session');
    }

    // Redirect to Polar checkout URL
    if (checkoutResponse.url) {
      redirect(303, checkoutResponse.url);
    }

    return error(500, 'No checkout URL returned');
  } catch (err) {
    if (isRedirect(err)) {
      throw err;
    }

    console.error('Checkout error:', err);
    return error(500, err instanceof Error ? err.message : 'Failed to initiate checkout');
  }
};
