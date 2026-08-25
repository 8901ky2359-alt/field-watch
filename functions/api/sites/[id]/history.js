// POST /api/sites/:id/history -> add a work-history entry, uploading any attached
// Before/After photos to R2 and storing their public URLs (as JSON) in D1.
//
// Expects multipart/form-data with fields: date, type, note,
// and zero or more files under the repeated keys "before" and "after".

export async function onRequestPost({ request, env, params }) {
  try {
    const siteId = params.id;

    const site = await env.DB.prepare('SELECT id FROM sites WHERE id = ?').bind(siteId).first();
    if (!site) {
      return new Response('指定された現場が見つかりません。', { status: 404 });
    }

    const form = await request.formData();
    const date = form.get('date');
    const type = form.get('type') || '除草作業';
    const note = form.get('note') || '';

    if (!date) {
      return new Response('実施日は必須です。', { status: 400 });
    }

    async function uploadAll(fieldName) {
      const files = form.getAll(fieldName).filter((f) => f instanceof File && f.size > 0);
      const urls = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `photos/${siteId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
        await env.PHOTOS.put(key, await file.arrayBuffer(), {
          httpMetadata: { contentType: file.type || 'application/octet-stream' },
        });
        urls.push(`${env.PHOTOS_PUBLIC_BASE}/${key}`);
      }
      return urls;
    }

    const beforeUrls = await uploadAll('before');
    const afterUrls = await uploadAll('after');

    await env.DB.prepare(
      `INSERT INTO history (site_id, date, type, note, before_keys, after_keys)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(siteId, date, type, note, JSON.stringify(beforeUrls), JSON.stringify(afterUrls))
      .run();

    return Response.json({ ok: true, beforeUrls, afterUrls });
  } catch (err) {
    return new Response('Failed to save history entry: ' + err.message, { status: 500 });
  }
}
