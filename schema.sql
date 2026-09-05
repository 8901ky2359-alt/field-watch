-- FieldWatch: 施工管理データベーススキーマ (Cloudflare D1 / SQLite)

DROP TABLE IF EXISTS photos;
DROP TABLE IF EXISTS sites;

CREATE TABLE sites (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  map_url       TEXT NOT NULL DEFAULT '',
  lat           REAL,
  lng           REAL,
  address       TEXT NOT NULL DEFAULT '',
  date_mode     TEXT NOT NULL DEFAULT 'range',   -- 'range' | 'days'
  start_date    TEXT NOT NULL DEFAULT '',
  end_date      TEXT NOT NULL DEFAULT '',
  work_days     TEXT NOT NULL DEFAULT '[]',      -- JSON array of 'YYYY-MM-DD'
  work_types    TEXT NOT NULL DEFAULT '[]',      -- JSON array of strings
  notes         TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'in_progress', -- 'in_progress' | 'completed'
  pair_count    INTEGER NOT NULL DEFAULT 1,
  completed_at  TEXT,                             -- set when status becomes 'completed', cleared otherwise
  created_at    TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at    TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE photos (
  id            TEXT PRIMARY KEY,
  site_id       TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  pair_index    INTEGER NOT NULL,
  side          TEXT NOT NULL,                   -- 'before' | 'after'
  object_key    TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  UNIQUE(site_id, pair_index, side)
);

CREATE INDEX idx_photos_site ON photos(site_id);
CREATE INDEX idx_sites_status ON sites(status);

-- ==========================================================
-- サンプルデータ（プロトタイプ確認用の3現場）
-- ==========================================================

INSERT INTO sites (id, name, map_url, lat, lng, address, date_mode, start_date, end_date, work_days, work_types, notes, status, pair_count, completed_at, created_at, updated_at) VALUES
('site-sample-1', '大崎第一太陽光発電所', 'https://maps.google.com/?q=35.0116,136.7686', 35.0116, 136.7686, '三重県津市大崎町123', 'range', '2026-08-03', '2026-08-05', '[]', '["除草作業","整線作業"]', 'パネル周辺の雑草が高め。次回は南側から着手。', 'completed', 4, '2026-08-05 17:30:00', '2026-08-01 09:00:00', '2026-08-05 17:30:00'),
('site-sample-2', '木更津メガソーラー第2区画', 'https://maps.google.com/?q=35.3706,139.9161', 35.3706, 139.9161, '千葉県木更津市畑沢456', 'days', '', '', '["2026-08-20","2026-08-21","2026-08-25"]', '["アース線設置","運搬"]', '飛び日程での作業。8/22-24は雨天のため中止。', 'in_progress', 6, NULL, '2026-08-19 08:15:00', '2026-08-25 16:00:00'),
('site-sample-3', '佐倉発電所 増設エリア', 'https://maps.google.com/?q=35.7211,140.2246', 35.7211, 140.2246, '千葉県佐倉市寺崎789', 'range', '2026-08-27', '2026-08-29', '[]', '["パネル設置","整線作業","運搬"]', '増設分のパネル設置。搬入路の確保済み。', 'in_progress', 8, NULL, '2026-08-26 07:45:00', '2026-08-29 13:20:00');

-- 施工完了現場(site-sample-1)は撮影済みのビフォーアフター写真4組が揃っている想定
INSERT INTO photos (id, site_id, pair_index, side, object_key, file_name, created_at) VALUES
('photo-1-1-before', 'site-sample-1', 1, 'before', 'sites/site-sample-1/1-before.jpg', '1-before.jpg', '2026-08-03 09:10:00'),
('photo-1-1-after',  'site-sample-1', 1, 'after',  'sites/site-sample-1/1-after.jpg',  '1-after.jpg',  '2026-08-05 15:40:00'),
('photo-1-2-before', 'site-sample-1', 2, 'before', 'sites/site-sample-1/2-before.jpg', '2-before.jpg', '2026-08-03 09:20:00'),
('photo-1-2-after',  'site-sample-1', 2, 'after',  'sites/site-sample-1/2-after.jpg',  '2-after.jpg',  '2026-08-05 15:50:00'),
('photo-1-3-before', 'site-sample-1', 3, 'before', 'sites/site-sample-1/3-before.jpg', '3-before.jpg', '2026-08-03 09:30:00'),
('photo-1-3-after',  'site-sample-1', 3, 'after',  'sites/site-sample-1/3-after.jpg',  '3-after.jpg',  '2026-08-05 16:00:00'),
('photo-1-4-before', 'site-sample-1', 4, 'before', 'sites/site-sample-1/4-before.jpg', '4-before.jpg', '2026-08-03 09:40:00'),
('photo-1-4-after',  'site-sample-1', 4, 'after',  'sites/site-sample-1/4-after.jpg',  '4-after.jpg',  '2026-08-05 16:10:00');

-- 施工中現場(site-sample-2)は6箇所中3箇所のみ撮影済み(残りは未撮影のまま保存)
INSERT INTO photos (id, site_id, pair_index, side, object_key, file_name, created_at) VALUES
('photo-2-1-before', 'site-sample-2', 1, 'before', 'sites/site-sample-2/1-before.jpg', '1-before.jpg', '2026-08-20 08:30:00'),
('photo-2-1-after',  'site-sample-2', 1, 'after',  'sites/site-sample-2/1-after.jpg',  '1-after.jpg',  '2026-08-21 10:00:00'),
('photo-2-2-before', 'site-sample-2', 2, 'before', 'sites/site-sample-2/2-before.jpg', '2-before.jpg', '2026-08-20 08:45:00'),
('photo-2-3-before', 'site-sample-2', 3, 'before', 'sites/site-sample-2/3-before.jpg', '3-before.jpg', '2026-08-25 09:00:00');

-- 施工中現場(site-sample-3)は8箇所中2箇所のみ撮影済み
INSERT INTO photos (id, site_id, pair_index, side, object_key, file_name, created_at) VALUES
('photo-3-1-before', 'site-sample-3', 1, 'before', 'sites/site-sample-3/1-before.jpg', '1-before.jpg', '2026-08-27 08:00:00'),
('photo-3-2-before', 'site-sample-3', 2, 'before', 'sites/site-sample-3/2-before.jpg', '2-before.jpg', '2026-08-27 08:20:00');
