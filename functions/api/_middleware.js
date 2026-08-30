// Auth gate for everything under /api/ except /api/auth/* (login/register must
// be reachable without a session). Attaches the logged-in user to context.data
// so downstream route handlers can read it without re-checking the cookie.
import { getCurrentUser } from '../lib/auth.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/api/auth/')) {
    return context.next();
  }

  const user = await getCurrentUser(context.request, context.env);
  if (!user) {
    return new Response('ログインが必要です。', { status: 401 });
  }
  context.data.user = user;
  return context.next();
}
