import { jsonResponse, loadProjectWithShots } from '../../lib/db.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  const project = await loadProjectWithShots(env.DB, params.id);
  if (!project) return jsonResponse({ error: 'not found' }, { status: 404 });
  return jsonResponse({ project });
}

export async function onRequestPatch(context) {
  const { env, params, request } = context;
  const body = await request.json().catch(() => ({}));

  const existing = await env.DB.prepare('SELECT * FROM projects WHERE id = ?').bind(params.id).first();
  if (!existing) return jsonResponse({ error: 'not found' }, { status: 404 });

  const name = body.name !== undefined ? String(body.name) : existing.name;
  const count = body.count !== undefined
    ? Math.min(999, Math.max(1, parseInt(body.count, 10) || existing.count))
    : existing.count;
  const now = new Date().toISOString();

  await env.DB.prepare('UPDATE projects SET name = ?, count = ?, updated_at = ? WHERE id = ?')
    .bind(name, count, now, params.id)
    .run();

  const project = await loadProjectWithShots(env.DB, params.id);
  return jsonResponse({ project });
}
