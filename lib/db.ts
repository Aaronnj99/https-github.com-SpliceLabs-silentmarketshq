import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'apex.db')

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')
  initTables(_db)
  return _db
}

function initTables(db: Database.Database) {
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

    CREATE TABLE IF NOT EXISTS agent_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_key TEXT NOT NULL,
      job_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'running' CHECK(status IN ('running', 'complete', 'error')),
      output TEXT,
      error TEXT,
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_agent_jobs_key ON agent_jobs(job_key, created_at DESC);
  `)
}

// Alert CRUD
export interface Alert {
  id: number
  coin: string
  condition: 'above' | 'below'
  target_price: number
  is_active: number
  triggered_at: string | null
  created_at: string
  note: string | null
}

export function getAlerts(activeOnly = false): Alert[] {
  const db = getDb()
  const query = activeOnly
    ? 'SELECT * FROM alerts WHERE is_active = 1 ORDER BY created_at DESC'
    : 'SELECT * FROM alerts ORDER BY created_at DESC'
  return db.prepare(query).all() as Alert[]
}

export function createAlert(
  coin: string,
  condition: 'above' | 'below',
  targetPrice: number,
  note?: string
): Alert {
  const db = getDb()
  const stmt = db.prepare(
    'INSERT INTO alerts (coin, condition, target_price, note) VALUES (?, ?, ?, ?)'
  )
  const result = stmt.run(coin.toUpperCase(), condition, targetPrice, note ?? null)
  return db.prepare('SELECT * FROM alerts WHERE id = ?').get(result.lastInsertRowid) as Alert
}

export function updateAlert(id: number, updates: Partial<Alert>): Alert | null {
  const db = getDb()
  const fields = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(', ')
  const values = Object.values(updates)
  db.prepare(`UPDATE alerts SET ${fields} WHERE id = ?`).run(...values, id)
  return db.prepare('SELECT * FROM alerts WHERE id = ?').get(id) as Alert | null
}

export function deleteAlert(id: number): void {
  const db = getDb()
  db.prepare('DELETE FROM alerts WHERE id = ?').run(id)
}

export function triggerAlert(alertId: number, triggeredPrice: number): void {
  const db = getDb()
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId) as Alert | null
  if (!alert) return

  db.prepare(
    'UPDATE alerts SET is_active = 0, triggered_at = datetime("now") WHERE id = ?'
  ).run(alertId)

  db.prepare(
    'INSERT INTO alert_history (alert_id, coin, condition, target_price, triggered_price) VALUES (?, ?, ?, ?, ?)'
  ).run(alertId, alert.coin, alert.condition, alert.target_price, triggeredPrice)
}

export function getAlertHistory() {
  const db = getDb()
  return db
    .prepare('SELECT * FROM alert_history ORDER BY triggered_at DESC LIMIT 50')
    .all()
}

// Reminder CRUD
export interface Reminder {
  id: number
  title: string
  description: string | null
  due_at: string | null
  priority: 'low' | 'normal' | 'high'
  is_done: number
  created_at: string
  completed_at: string | null
}

export function getReminders(includeCompleted = false): Reminder[] {
  const db = getDb()
  const query = includeCompleted
    ? 'SELECT * FROM reminders ORDER BY due_at ASC NULLS LAST, created_at DESC'
    : 'SELECT * FROM reminders WHERE is_done = 0 ORDER BY due_at ASC NULLS LAST, created_at DESC'
  return db.prepare(query).all() as Reminder[]
}

export function createReminder(
  title: string,
  description?: string,
  dueAt?: string,
  priority: 'low' | 'normal' | 'high' = 'normal'
): Reminder {
  const db = getDb()
  const stmt = db.prepare(
    'INSERT INTO reminders (title, description, due_at, priority) VALUES (?, ?, ?, ?)'
  )
  const result = stmt.run(title, description ?? null, dueAt ?? null, priority)
  return db.prepare('SELECT * FROM reminders WHERE id = ?').get(result.lastInsertRowid) as Reminder
}

export function updateReminder(id: number, updates: Partial<Reminder>): Reminder | null {
  const db = getDb()
  if (updates.is_done === 1 && !updates.completed_at) {
    updates.completed_at = new Date().toISOString()
  }
  const fields = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(', ')
  const values = Object.values(updates)
  db.prepare(`UPDATE reminders SET ${fields} WHERE id = ?`).run(...values, id)
  return db.prepare('SELECT * FROM reminders WHERE id = ?').get(id) as Reminder | null
}

export function deleteReminder(id: number): void {
  const db = getDb()
  db.prepare('DELETE FROM reminders WHERE id = ?').run(id)
}

// Settings key/value store
export function getSetting(key: string): string | null {
  const db = getDb()
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  return row?.value ?? null
}

export function setSetting(key: string, value: string): void {
  const db = getDb()
  db.prepare(
    'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now")) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
  ).run(key, value)
}

export function getAllSettings(): Record<string, string> {
  const db = getDb()
  const rows = db.prepare('SELECT key, value FROM settings').all() as {
    key: string
    value: string
  }[]
  return Object.fromEntries(rows.map((r) => [r.key, r.value]))
}

// Agent job runs (Agent Ops / autonomous AI jobs)
export interface AgentJobRun {
  id: number
  job_key: string
  job_name: string
  status: 'running' | 'complete' | 'error'
  output: string | null
  error: string | null
  started_at: string
  completed_at: string | null
  created_at: string
}

export function createJobRun(jobKey: string, jobName: string): AgentJobRun {
  const db = getDb()
  const stmt = db.prepare(
    'INSERT INTO agent_jobs (job_key, job_name, status) VALUES (?, ?, ?)'
  )
  const result = stmt.run(jobKey, jobName, 'running')
  return db.prepare('SELECT * FROM agent_jobs WHERE id = ?').get(result.lastInsertRowid) as AgentJobRun
}

export function completeJobRun(id: number, output: string): void {
  const db = getDb()
  db.prepare(
    'UPDATE agent_jobs SET status = ?, output = ?, completed_at = datetime("now") WHERE id = ?'
  ).run('complete', output, id)
}

export function failJobRun(id: number, error: string): void {
  const db = getDb()
  db.prepare(
    'UPDATE agent_jobs SET status = ?, error = ?, completed_at = datetime("now") WHERE id = ?'
  ).run('error', error, id)
}

export function getRecentJobRuns(limit = 30): AgentJobRun[] {
  const db = getDb()
  return db
    .prepare('SELECT * FROM agent_jobs ORDER BY created_at DESC LIMIT ?')
    .all(limit) as AgentJobRun[]
}

export function getLatestJobRunPerKey(): AgentJobRun[] {
  const db = getDb()
  return db
    .prepare(
      `SELECT * FROM agent_jobs aj
       WHERE id = (
         SELECT id FROM agent_jobs
         WHERE job_key = aj.job_key
         ORDER BY created_at DESC LIMIT 1
       )
       ORDER BY job_key`
    )
    .all() as AgentJobRun[]
}
