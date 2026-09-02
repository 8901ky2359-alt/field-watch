import { newId, jsonResponse, loadSiteWithPhotos } from '../lib/db.js';

export async function onRequestGet(context) {
  const { env } = context;
  const { results } = await env.DB.prepare('SELECT id FROM sites ORDER BY updated_at DESC').all();
  const sites = [];
  for (const row of results || []) {
    const site = await loadSiteWithPhotos(env.DB, row.id);
    if (site) sites.push(site);
  }
  return jsonResponse({ sites });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const body = await request.json();

  const name = (body.name || '').trim();
  if (!name) return jsonResponse({ error: 'name is required' }, { status: 400 });

  const pairCount = Math.min(50, Math.max(1, parseInt(body.pairCount, 10) || 1));
  const id = newId('site');
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO sites (id, name, map_url, lat, lng, address, date_mode, start_date, end_date, work_days, work_types, notes, status, pair_count, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    name,
    body.mapUrl || '',
    typeof body.lat === 'number' ? body.lat : null,
    typeof body.lng === 'number' ? body.lng : null,
    body.address || '',
    body.dateMode === 'days' ? 'days' : 'range',
    body.startDate || '',
    body.endDate || '',
    JSON.stringify(Array.isArray(body.workDays) ? body.workDays : []),
    JSON.stringify(Array.isArray(body.workTypes) ? body.workTypes : []),
    body.notes || '',
    'in_progress',
    pairCount,
    now,
    now
  ).run();

  const site = await loadSiteWithPhotos(env.DB, id);
  return jsonResponse({ site }, { status: 201 });
}
