import { verifyPassword, createSession, sessionCookie, publicUser } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return new Response('メールアドレスとパスワードを入力してください。', { status: 400 });
    }

    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) return new Response('メールアドレスまたはパスワードが違います。', { status: 401 });

    const ok = await verifyPassword(password, user.password_salt, user.password_hash);
    if (!ok) return new Response('メールアドレスまたはパスワードが違います。', { status: 401 });

    const { token } = await createSession(env, user.id);
    return new Response(JSON.stringify({ ok: true, user: publicUser(user) }), {
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': sessionCookie(token) },
    });
  } catch (err) {
    return new Response('ログインに失敗しました: ' + err.message, { status: 500 });
  }
}
