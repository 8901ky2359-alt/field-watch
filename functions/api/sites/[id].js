import { jsonResponse, loadSiteWithPhotos } from '../../lib/db.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  const site = await loadSiteWithPhotos(env.DB, params.id);
  if (!site) return jsonResponse({ error: 'not found' }, { status: 404 });
  return jsonResponse({ site });
}

export async function onRequestPatch(context) {
  const { env, params, request } = context;
  const body = await request.json();

  const existing = await env.DB.prepare('SELECT * FROM sites WHERE id = ?').bind(params.id).first();
  if (!existing) return jsonResponse({ error: 'not found' }, { status: 404 });

  const name = body.name !== undefined ? String(body.name).trim() : existing.name;
  if (!name) return jsonResponse({ error: 'name is required' }, { status: 400 });

  const pairCount = body.pairCount !== undefined
    ? Math.min(50, Math.max(1, parseInt(body.pairCount, 10) || existing.pair_count))
    : existing.pair_count;

  const now = new Date().toISOString();

  await env.DB.prepare(
    `UPDATE sites SET
       name = ?, map_url = ?, lat = ?, lng = ?, address = ?,
       date_mode = ?, start_date = ?, end_date = ?, work_days = ?, work_types = ?,
       notes = ?, pair_count = ?, updated_at = ?
     WHERE id = ?`
  ).bind(
    name,
    body.mapUrl !== undefined ? body.mapUrl : existing.map_url,
    body.lat !== undefined ? (typeof body.lat === 'number' ? body.lat : null) : existing.lat,
    body.lng !== undefined ? (typeof body.lng === 'number' ? body.lng : null) : existing.lng,
    body.address !== undefined ? body.address : existing.address,
    body.dateMode !== undefined ? (body.dateMode === 'days' ? 'days' : 'range') : existing.date_mode,
    body.startDate !== undefined ? body.startDate : existing.start_date,
    body.endDate !== undefined ? body.endDate : existing.end_date,
    body.workDays !== undefined ? JSON.stringify(Array.isArray(body.workDays) ? body.workDays : []) : existing.work_days,
    body.workTypes !== undefined ? JSON.stringify(Array.isArray(body.workTypes) ? body.workTypes : []) : existing.work_types,
    body.notes !== undefined ? body.notes : existing.notes,
    pairCount,
    now,
    params.id
  ).run();

  const site = await loadSiteWithPhotos(env.DB, params.id);
  return jsonResponse({ site });
}

export async function onRequestDelete(context) {
  const { env, params } = context;

  const existing = await env.DB.prepare('SELECT id FROM sites WHERE id = ?').bind(params.id).first();
  if (!existing) return jsonResponse({ error: 'not found' }, { status: 404 });

  const { results } = await env.DB.prepare('SELECT object_key FROM photos WHERE site_id = ?').bind(params.id).all();
  for (const row of results || []) {
    await env.PHOTOS.delete(row.object_key);
  }

  await env.DB.prepare('DELETE FROM photos WHERE site_id = ?').bind(params.id).run();
  await env.DB.prepare('DELETE FROM sites WHERE id = ?').bind(params.id).run();

  return jsonResponse({ ok: true });
}
