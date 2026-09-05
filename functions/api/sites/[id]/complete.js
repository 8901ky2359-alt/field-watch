import { jsonResponse, loadSiteWithPhotos } from '../../../lib/db.js';

export async function onRequestPost(context) {
  const { env, params } = context;
  const existing = await env.DB.prepare('SELECT id, status FROM sites WHERE id = ?').bind(params.id).first();
  if (!existing) return jsonResponse({ error: 'not found' }, { status: 404 });

  const now = new Date().toISOString();
  const nextStatus = existing.status === 'completed' ? 'in_progress' : 'completed';
  const completedAt = nextStatus === 'completed' ? now : null;

  await env.DB.prepare('UPDATE sites SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?')
    .bind(nextStatus, completedAt, now, params.id)
    .run();

  const site = await loadSiteWithPhotos(env.DB, params.id);
  return jsonResponse({ site });
}
