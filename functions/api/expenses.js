// GET  /api/expenses?month=YYYY-MM[&user_id=...]  -> list expense entries
// POST /api/expenses                              -> add a new expense for the logged-in worker
export async function onRequestGet({ request, env, data }) {
  const user = data.user;
  const url = new URL(request.url);
  const month = url.searchParams.get('month');
  const requestedUserId = url.searchParams.get('user_id');

  let targetUserId = user.id;
  if (requestedUserId && requestedUserId !== user.id) {
    if (user.role !== 'admin') return new Response('権限がありません。', { status: 403 });
    targetUserId = requestedUserId;
  }

  let query = 'SELECT * FROM expenses WHERE user_id = ?';
  const binds = [targetUserId];
  if (month) {
    query += ' AND date LIKE ?';
    binds.push(month + '%');
  }
  query += ' ORDER BY date DESC, id DESC';

  const { results } = await env.DB.prepare(query).bind(...binds).all();
  return Response.json(results);
}

export async function onRequestPost({ request, env, data }) {
  const user = data.user;
  const body = await request.json();
  const { date, category, amount, note } = body;

  if (!date || typeof amount !== 'number' || amount <= 0) {
    return new Response('日付と金額（1円以上）は必須です。', { status: 400 });
  }

  await env.DB.prepare('INSERT INTO expenses (user_id, date, category, amount, note) VALUES (?, ?, ?, ?, ?)')
    .bind(user.id, date, category || 'その他', amount, note || '')
    .run();

  return Response.json({ ok: true });
}
