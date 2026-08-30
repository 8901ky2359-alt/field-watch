import { hashPassword, createSession, sessionCookie, newId, publicUser } from '../../lib/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password || !name) {
      return new Response('メールアドレス・パスワード・お名前は必須です。', { status: 400 });
    }
    if (password.length < 8) {
      return new Response('パスワードは8文字以上にしてください。', { status: 400 });
    }

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) {
      return new Response('このメールアドレスは既に登録されています。', { status: 409 });
    }

    const { hash, salt } = await hashPassword(password);
    const id = newId('user');
    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, password_salt, name, role) VALUES (?, ?, ?, ?, ?, ?)'
    )
      .bind(id, email, hash, salt, name, 'worker')
      .run();

    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
    const { token } = await createSession(env, id);

    return new Response(JSON.stringify({ ok: true, user: publicUser(user) }), {
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': sessionCookie(token) },
    });
  } catch (err) {
    return new Response('登録に失敗しました: ' + err.message, { status: 500 });
  }
}
