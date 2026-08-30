// DELETE /api/expenses/:id -> remove one expense (owner or admin)
export async function onRequestDelete({ env, data, params }) {
  const user = data.user;
  const row = await env.DB.prepare('SELECT user_id FROM expenses WHERE id = ?').bind(params.id).first();
  if (!row) return new Response('見つかりません。', { status: 404 });
  if (row.user_id !== user.id && user.role !== 'admin') {
    return new Response('権限がありません。', { status: 403 });
  }
  await env.DB.prepare('DELETE FROM expenses WHERE id = ?').bind(params.id).run();
  return Response.json({ ok: true });
}
