import { getCurrentUser, publicUser } from '../../lib/auth.js';

export async function onRequestGet({ request, env }) {
  const user = await getCurrentUser(request, env);
  return Response.json({ user: user ? publicUser(user) : null });
}
