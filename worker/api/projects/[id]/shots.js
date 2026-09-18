import { newId, jsonResponse, loadProjectWithShots } from '../../../lib/db.js';

export async function onRequestPost(context) {
  const { env, params, request } = context;

  const project = await env.DB.prepare('SELECT id, count FROM projects WHERE id = ?').bind(params.id).first();
  if (!project) return jsonResponse({ error: 'not found' }, { status: 404 });

  const form = await request.formData();
  const file = form.get('file');
  const idx = parseInt(form.get('idx'), 10);
  const side = form.get('side');

  if (!file || typeof file === 'string') return jsonResponse({ error: 'file is required' }, { status: 400 });
  if (!Number.isInteger(idx) || idx < 1 || idx > project.count) {
    return jsonResponse({ error: 'invalid idx' }, { status: 400 });
  }
  if (side !== 'before' && side !== 'after') return jsonResponse({ error: 'invalid side' }, { status: 400 });

  const objectKey = `projects/${params.id}/${String(idx).padStart(3, '0')}-${side}.jpg`;
  await env.PHOTOS.put(objectKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || 'image/jpeg' },
  });

  const existing = await env.DB.prepare(
    'SELECT id FROM shots WHERE project_id = ? AND idx = ? AND side = ?'
  ).bind(params.id, idx, side).first();

  const now = new Date().toISOString();
  if (existing) {
    await env.DB.prepare('UPDATE shots SET object_key = ?, created_at = ? WHERE id = ?')
      .bind(objectKey, now, existing.id).run();
  } else {
    await env.DB.prepare(
      'INSERT INTO shots (id, project_id, idx, side, object_key, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(newId('shot'), params.id, idx, side, objectKey, now).run();
  }
  await env.DB.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').bind(now, params.id).run();

  const result = await loadProjectWithShots(env.DB, params.id);
  return jsonResponse({ project: result });
}

export async function onRequestDelete(context) {
  const { env, params, request } = context;
  const url = new URL(request.url);
  const idx = parseInt(url.searchParams.get('idx'), 10);
  const side = url.searchParams.get('side');

  const shot = await env.DB.prepare(
    'SELECT * FROM shots WHERE project_id = ? AND idx = ? AND side = ?'
  ).bind(params.id, idx, side).first();

  if (shot) {
    await env.PHOTOS.delete(shot.object_key);
    await env.DB.prepare('DELETE FROM shots WHERE id = ?').bind(shot.id).run();
    await env.DB.prepare('UPDATE projects SET updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), params.id).run();
  }

  const result = await loadProjectWithShots(env.DB, params.id);
  return jsonResponse({ project: result });
}
