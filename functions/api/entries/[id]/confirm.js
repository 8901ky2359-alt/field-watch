// POST /api/entries/:id/confirm -> toggle the "confirmed by office" flag (admin only)
export async function onRequestPost({ env, data, params }) {
  const user = data.user;
  if (user.role !== 'admin') return new Response('権限がありません。', { status: 403 });

  const row = await env.DB.prepare('SELECT confirmed FROM entries WHERE id = ?').bind(params.id).first();
  if (!row) return new Response('見つかりません。', { status: 404 });

  const next = row.confirmed ? 0 : 1;
  await env.DB.prepare('UPDATE entries SET confirmed = ? WHERE id = ?').bind(next, params.id).run();
  return Response.json({ ok: true, confirmed: !!next });
}
