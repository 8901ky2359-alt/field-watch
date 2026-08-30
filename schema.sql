-- WORKLOG schema for Cloudflare D1

DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS expenses;
DROP TABLE IF EXISTS entries;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker',           -- 'worker' | 'admin'
  bank_name TEXT,
  bank_branch TEXT,
  bank_account_type TEXT,                        -- 普通 / 当座
  bank_account_number TEXT,
  bank_account_holder TEXT,
  invoice_reg_number TEXT,                        -- インボイス登録番号（任意, 例: T1234567890123）
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE entries (                           -- 日当（収入）
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  pref TEXT,                                     -- 都道府県・現場所在地
  site_name TEXT,                                -- 現場名
  work_type TEXT,                                -- 作業内容
  wage INTEGER NOT NULL,                         -- 日当（円）
  note TEXT,
  confirmed INTEGER NOT NULL DEFAULT 0,          -- 会社側の確認フラグ
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE expenses (                          -- 経費（支出）
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  category TEXT,                                 -- 交通費 / 道具代 / その他
  amount INTEGER NOT NULL,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_entries_user ON entries(user_id);
CREATE INDEX idx_expenses_user ON expenses(user_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- After your own account registers through the site, promote it to admin with:
-- UPDATE users SET role='admin' WHERE email='you@example.com';
