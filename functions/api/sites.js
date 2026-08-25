// GET  /api/sites  -> list all sites with their history, for the map/list/detail screens
// POST /api/sites  -> register a new site (JSON body)

export async function onRequestGet({ env }) {
  try {
    const { results: siteRows } = await env.DB.prepare(
      'SELECT * FROM sites ORDER BY created_at ASC'
    ).all();
    const { results: historyRows } = await env.DB.prepare(
      'SELECT * FROM history ORDER BY date DESC, id DESC'
    ).all();

    const sites = siteRows.map((s) => ({
      id: s.id,
      name: s.name,
      pref: s.pref,
      capacity: s.capacity,
      lat: s.lat,
      lng: s.lng,
      grass: {
        type: s.grass_type,
        baseTemp: s.base_temp,
        target: s.target_gdd,
        note: s.grass_note,
      },
      history: historyRows
        .filter((h) => h.site_id === s.id)
        .map((h) => ({
          date: h.date,
          type: h.type,
          note: h.note,
          beforeImages: JSON.parse(h.before_keys || '[]'),
          afterImages: JSON.parse(h.after_keys || '[]'),
        })),
    }));

    return Response.json(sites);
  } catch (err) {
    return new Response('Failed to load sites: ' + err.message, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { name, pref, capacity, lat, lng, grass } = body;

    if (!name || !pref || typeof lat !== 'number' || typeof lng !== 'number') {
      return new Response('現場名・所在地・緯度・経度は必須です。', { status: 400 });
    }

    const id = 'site-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);

    await env.DB.prepare(
      `INSERT INTO sites (id, name, pref, capacity, lat, lng, grass_type, base_temp, target_gdd, grass_note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        name,
        pref,
        capacity || '—',
        lat,
        lng,
        grass?.type || '未設定',
        grass?.baseTemp ?? 10,
        grass?.target ?? 300,
        grass?.note || ''
      )
      .run();

    return Response.json({ ok: true, id });
  } catch (err) {
    return new Response('Failed to create site: ' + err.message, { status: 500 });
  }
}
