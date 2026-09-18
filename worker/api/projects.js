import { newId, jsonResponse, loadProjectWithShots } from '../lib/db.js';

export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json().catch(() => ({}));

  const count = Math.min(999, Math.max(1, parseInt(body.count, 10) || 1));
  const name = typeof body.name === 'string' ? body.name : '';
  const id = newId('proj');
  const now = new Date().toISOString();

  await env.DB.prepare(
    'INSERT INTO projects (id, name, count, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, name, count, now, now).run();

  const project = await loadProjectWithShots(env.DB, id);
  return jsonResponse({ project }, { status: 201 });
}
