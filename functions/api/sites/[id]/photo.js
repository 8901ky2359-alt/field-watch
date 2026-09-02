import { newId, jsonResponse, loadSiteWithPhotos } from '../../../lib/db.js';

function extFromType(type) {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

export async function onRequestPost(context) {
  const { env, params, request } = context;

  const site = await env.DB.prepare('SELECT id, pair_count FROM sites WHERE id = ?').bind(params.id).first();
  if (!site) return jsonResponse({ error: 'not found' }, { status: 404 });

  const form = await request.formData();
  const file = form.get('file');
  const pairIndex = parseInt(form.get('pairIndex'), 10);
  const side = form.get('side');

  if (!file || typeof file === 'string') return jsonResponse({ error: 'file is required' }, { status: 400 });
  if (!Number.isInteger(pairIndex) || pairIndex < 1 || pairIndex > site.pair_count) {
    return jsonResponse({ error: 'invalid pairIndex' }, { status: 400 });
  }
  if (side !== 'before' && side !== 'after') return jsonResponse({ error: 'invalid side' }, { status: 400 });

  const ext = extFromType(file.type);
  const objectKey = `sites/${params.id}/${String(pairIndex).padStart(2, '0')}-${side}.${ext}`;
  const fileName = file.name || `${String(pairIndex).padStart(2, '0')}-${side}.${ext}`;

  await env.PHOTOS.put(objectKey, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || 'image/jpeg' },
  });

  const existing = await env.DB.prepare(
    'SELECT id FROM photos WHERE site_id = ? AND pair_index = ? AND side = ?'
  ).bind(params.id, pairIndex, side).first();

  const now = new Date().toISOString();
  if (existing) {
    await env.DB.prepare('UPDATE photos SET object_key = ?, file_name = ?, created_at = ? WHERE id = ?')
      .bind(objectKey, fileName, now, existing.id).run();
  } else {
    await env.DB.prepare(
      'INSERT INTO photos (id, site_id, pair_index, side, object_key, file_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(newId('photo'), params.id, pairIndex, side, objectKey, fileName, now).run();
  }

  await env.DB.prepare('UPDATE sites SET updated_at = ? WHERE id = ?').bind(now, params.id).run();

  const result = await loadSiteWithPhotos(env.DB, params.id);
  return jsonResponse({ site: result });
}

export async function onRequestDelete(context) {
  const { env, params, request } = context;
  const url = new URL(request.url);
  const pairIndex = parseInt(url.searchParams.get('pairIndex'), 10);
  const side = url.searchParams.get('side');

  const photo = await env.DB.prepare(
    'SELECT * FROM photos WHERE site_id = ? AND pair_index = ? AND side = ?'
  ).bind(params.id, pairIndex, side).first();

  if (photo) {
    await env.PHOTOS.delete(photo.object_key);
    await env.DB.prepare('DELETE FROM photos WHERE id = ?').bind(photo.id).run();
    await env.DB.prepare('UPDATE sites SET updated_at = ? WHERE id = ?')
      .bind(new Date().toISOString(), params.id).run();
  }

  const result = await loadSiteWithPhotos(env.DB, params.id);
  return jsonResponse({ site: result });
}
