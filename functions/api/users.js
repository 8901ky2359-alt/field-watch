// GET /api/users -> list all workers (admin only), for the admin picker
export async function onRequestGet({ env, data }) {
  const user = data.user;
  if (user.role !== 'admin') return new Response('権限がありません。', { status: 403 });

  const { results } = await env.DB.prepare(
    'SELECT id, email, name, role FROM users ORDER BY created_at ASC'
  ).all();
  return Response.json(results);
}
