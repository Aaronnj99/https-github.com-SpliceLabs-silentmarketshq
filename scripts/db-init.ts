import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'apex.db')

function initDb() {
  // Ensure data dir exists
  const dataDir = path.dirname(DB_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
    console.log(`Created data directory: ${dataDir}`)
  }

  const db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coin TEXT NOT NULL,
      condition TEXT NOT NULL CHECK(condition IN ('above', 'below')),
      target_price REAL NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      triggered_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      due_at TEXT,
      priority TEXT NOT NULL DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high')),
      is_done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS alert_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER,
      coin TEXT NOT NULL,
      condition TEXT NOT NULL,
      target_price REAL NOT NULL,
      triggered_price REAL NOT NULL,
      triggered_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  console.log('✅ Database initialized at:', DB_PATH)
  console.log('📊 Tables created: alerts, reminders, settings, alert_history')

  db.close()
}

initDb()
