-- 現場ビフォーアフター: クラウド共有用スキーマ (Cloudflare D1 / SQLite)

DROP TABLE IF EXISTS shots;
DROP TABLE IF EXISTS projects;

CREATE TABLE projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT '',
  count       INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE shots (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  idx         INTEGER NOT NULL,
  side        TEXT NOT NULL,              -- 'before' | 'after'
  object_key  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  UNIQUE(project_id, idx, side)
);

CREATE INDEX idx_shots_project ON shots(project_id);
