export function newId(prefix) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function jsonResponse(data, init) {
  return new Response(JSON.stringify(data), {
    status: (init && init.status) || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', ...((init && init.headers) || {}) },
  });
}

export function serializeProject(row, shots) {
  const list = shots || [];
  const count = row.count;
  const items = [];
  for (let i = 1; i <= count; i++) {
    const before = list.find((s) => s.idx === i && s.side === 'before') || null;
    const after = list.find((s) => s.idx === i && s.side === 'after') || null;
    items.push({
      before: before ? { objectKey: before.object_key } : null,
      after: after ? { objectKey: after.object_key } : null,
    });
  }
  return {
    id: row.id,
    name: row.name,
    count,
    items,
    updatedAt: row.updated_at,
  };
}

export async function loadProjectWithShots(db, id) {
  const project = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
  if (!project) return null;
  const { results } = await db.prepare('SELECT * FROM shots WHERE project_id = ? ORDER BY idx, side').bind(id).all();
  return serializeProject(project, results || []);
}
