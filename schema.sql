-- FIELDWATCH schema + seed data for Cloudflare D1

DROP TABLE IF EXISTS history;
DROP TABLE IF EXISTS sites;

CREATE TABLE sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  pref TEXT NOT NULL,
  capacity TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  grass_type TEXT,
  base_temp REAL,
  target_gdd REAL,
  grass_note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  site_id TEXT NOT NULL REFERENCES sites(id),
  date TEXT NOT NULL,
  type TEXT,
  note TEXT,
  before_keys TEXT NOT NULL DEFAULT '[]',
  after_keys TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_history_site ON history(site_id);

INSERT INTO sites (id,name,pref,capacity,lat,lng,grass_type,base_temp,target_gdd,grass_note) VALUES ('sakura','WEST-L 佐倉発電所','千葉県佐倉市','2.4MW',35.7211,140.2222,'セイタカアワダチソウ・イネ科混生',8,280,'高温期に成長が早い種。積算気温の影響を受けやすい。');
INSERT INTO sites (id,name,pref,capacity,lat,lng,grass_type,base_temp,target_gdd,grass_note) VALUES ('ishioka','WEST-L 石岡発電所','茨城県石岡市','1.8MW',36.1889,140.2914,'チガヤ主体',10,320,'比較的成長は緩やか。西側はパネル影で生育やや遅め。');
INSERT INTO sites (id,name,pref,capacity,lat,lng,grass_type,base_temp,target_gdd,grass_note) VALUES ('nasu','WEST-L 那須発電所','栃木県那須町','3.1MW',37.0333,140.0167,'シバ類主体',12,360,'冷涼地のため生育は緩やか。標高があり気温が上がりにくい。');
INSERT INTO sites (id,name,pref,capacity,lat,lng,grass_type,base_temp,target_gdd,grass_note) VALUES ('sendai','WEST-L 仙台発電所','宮城県仙台市','2.0MW',38.2682,140.8694,'イネ科雑草（メヒシバ等）',9,300,'降雨が多いと成長が加速しやすい種。');
INSERT INTO sites (id,name,pref,capacity,lat,lng,grass_type,base_temp,target_gdd,grass_note) VALUES ('osaki','WEST-L 大崎発電所','宮城県大崎市','2.7MW',38.5754,140.9629,'イネ科雑草（メヒシバ等）',9,300,'仙台発電所と同系統の雑草構成。');
INSERT INTO sites (id,name,pref,capacity,lat,lng,grass_type,base_temp,target_gdd,grass_note) VALUES ('kitami','WEST-L 北見発電所','北海道北見市','4.0MW',43.8036,143.8933,'エゾヨモギ・イネ科混生',11,340,'冷涼だが夏場の日照で一気に伸びる。広範囲のため要注意。');
INSERT INTO sites (id,name,pref,capacity,lat,lng,grass_type,base_temp,target_gdd,grass_note) VALUES ('narita','WEST-L 成田発電所','千葉県成田市','1.5MW',35.7767,140.3189,'セイタカアワダチソウ主体',8,280,'越境個体あり。高温期の成長が速い種。');

INSERT INTO history (site_id,date,type,note,before_keys,after_keys) VALUES ('sakura','2026-06-20','除草作業','南面のり面の伸びが早い。次回は8月中旬〜下旬目安と現地判断。','["https://placehold.co/400x300/fbeee0/a3690a?text=Before%201&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%202&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%203&font=roboto"]','["https://placehold.co/400x300/e8f5ec/1d7a43?text=After%201&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%202&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%203&font=roboto"]');
INSERT INTO history (site_id,date,type,note,before_keys,after_keys) VALUES ('sakura','2026-04-10','除草作業','冬期分の刈り残しを含め全面対応。','["https://placehold.co/400x300/fbeee0/a3690a?text=Before%201&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%202&font=roboto"]','["https://placehold.co/400x300/e8f5ec/1d7a43?text=After%201&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%202&font=roboto"]');
INSERT INTO history (site_id,date,type,note,before_keys,after_keys) VALUES ('ishioka','2026-07-15','除草作業','パネル影になる西側は生育やや遅め。','["https://placehold.co/400x300/fbeee0/a3690a?text=Before%201&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%202&font=roboto"]','["https://placehold.co/400x300/e8f5ec/1d7a43?text=After%201&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%202&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%203&font=roboto"]');
INSERT INTO history (site_id,date,type,note,before_keys,after_keys) VALUES ('nasu','2026-08-10','除草作業','定期メンテのみ。特記事項なし。','["https://placehold.co/400x300/fbeee0/a3690a?text=Before%201&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%202&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%203&font=roboto"]','["https://placehold.co/400x300/e8f5ec/1d7a43?text=After%201&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%202&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%203&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%204&font=roboto"]');
INSERT INTO history (site_id,date,type,note,before_keys,after_keys) VALUES ('nasu','2026-06-05','除草作業','','["https://placehold.co/400x300/fbeee0/a3690a?text=Before%201&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%202&font=roboto"]','["https://placehold.co/400x300/e8f5ec/1d7a43?text=After%201&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%202&font=roboto"]');
INSERT INTO history (site_id,date,type,note,before_keys,after_keys) VALUES ('sendai','2026-07-20','除草作業','降雨が多く生育やや早い。次回9月上旬前に確認推奨。','["https://placehold.co/400x300/fbeee0/a3690a?text=Before%201&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%202&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%203&font=roboto"]','["https://placehold.co/400x300/e8f5ec/1d7a43?text=After%201&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%202&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%203&font=roboto"]');
INSERT INTO history (site_id,date,type,note,before_keys,after_keys) VALUES ('osaki','2026-08-15','除草作業','実施直後。良好な状態を維持。','["https://placehold.co/400x300/fbeee0/a3690a?text=Before%201&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%202&font=roboto"]','["https://placehold.co/400x300/e8f5ec/1d7a43?text=After%201&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%202&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%203&font=roboto"]');
INSERT INTO history (site_id,date,type,note,before_keys,after_keys) VALUES ('kitami','2026-06-15','除草作業','広範囲のため要員2名体制で実施。次回対応が遅れ気味。','["https://placehold.co/400x300/fbeee0/a3690a?text=Before%201&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%202&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%203&font=roboto"]','["https://placehold.co/400x300/e8f5ec/1d7a43?text=After%201&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%202&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%203&font=roboto"]');
INSERT INTO history (site_id,date,type,note,before_keys,after_keys) VALUES ('kitami','2026-04-25','除草作業','','["https://placehold.co/400x300/fbeee0/a3690a?text=Before%201&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%202&font=roboto"]','["https://placehold.co/400x300/e8f5ec/1d7a43?text=After%201&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%202&font=roboto"]');
INSERT INTO history (site_id,date,type,note,before_keys,after_keys) VALUES ('narita','2026-05-30','除草作業','長期未対応。周辺からの越境も見られるため優先度高。','["https://placehold.co/400x300/fbeee0/a3690a?text=Before%201&font=roboto","https://placehold.co/400x300/fbeee0/a3690a?text=Before%202&font=roboto"]','["https://placehold.co/400x300/e8f5ec/1d7a43?text=After%201&font=roboto","https://placehold.co/400x300/e8f5ec/1d7a43?text=After%202&font=roboto"]');
