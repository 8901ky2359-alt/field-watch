export function newId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function parseJsonArray(text) {
  try {
    const v = JSON.parse(text || '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function serializeSite(row, photos) {
  const list = photos || [];
  const pairCount = row.pair_count;
  const pairs = [];
  for (let i = 1; i <= pairCount; i++) {
    const before = list.find(p => p.pair_index === i && p.side === 'before') || null;
    const after = list.find(p => p.pair_index === i && p.side === 'after') || null;
    pairs.push({
      index: i,
      before: before ? { objectKey: before.object_key, fileName: before.file_name, createdAt: before.created_at } : null,
      after: after ? { objectKey: after.object_key, fileName: after.file_name, createdAt: after.created_at } : null,
    });
  }
  const completedPairs = pairs.filter(p => p.before && p.after).length;
  const capturedShots = pairs.filter(p => p.before || p.after).length;

  return {
    id: row.id,
    name: row.name,
    mapUrl: row.map_url,
    lat: row.lat,
    lng: row.lng,
    address: row.address,
    dateMode: row.date_mode,
    startDate: row.start_date,
    endDate: row.end_date,
    workDays: parseJsonArray(row.work_days),
    workTypes: parseJsonArray(row.work_types),
    notes: row.notes,
    status: row.status,
    pairCount,
    completedPairs,
    capturedShots,
    pairs,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadSiteWithPhotos(db, id) {
  const site = await db.prepare('SELECT * FROM sites WHERE id = ?').bind(id).first();
  if (!site) return null;
  const { results } = await db.prepare('SELECT * FROM photos WHERE site_id = ? ORDER BY pair_index, side').bind(id).all();
  return serializeSite(site, results || []);
}

export function jsonResponse(data, init) {
  return new Response(JSON.stringify(data), {
    status: (init && init.status) || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', ...((init && init.headers) || {}) },
  });
}
