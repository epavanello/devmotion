export async function load({ locals }) {
  return {
    session: locals.session ?? null,
    user: locals.user ?? null
  };
}
