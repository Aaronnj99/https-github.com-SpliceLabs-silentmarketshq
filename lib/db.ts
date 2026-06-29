import { createClient, type Client, type InValue } from '@libsql/client'
import path from 'path'
import fs from 'fs'

let _client: Client | null = null
let _ready: Promise<void> | null = null

function resolveLocalUrl(): string {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  return `file:${path.join(dataDir, 'apex.db')}`
}

function getClient(): Client {
  if (_client) return _client

  const remoteUrl = process.env.TURSO_DATABASE_URL
  _client = remoteUrl
    ? createClient({ url: remoteUrl, authToken: process.env.TURSO_AUTH_TOKEN })
    : createClient({ url: resolveLocalUrl() })

  return _client
}

async function ensureReady(): Promise<Client> {
  const client = getClient()
  if (!_ready) _ready = initTables(client)
  await _ready
  return client
}

async function initTables(db: Client) {
  if (!process.env.TURSO_DATABASE_URL) {
    await db.execute('PRAGMA journal_mode = WAL')
  }

  await db.executeMultiple(`
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

async function run(sql: string, args: InValue[] = []) {
  const db = await ensureReady()
  return db.execute({ sql, args })
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

export async function getAlerts(activeOnly = false): Promise<Alert[]> {
  const query = activeOnly
    ? 'SELECT * FROM alerts WHERE is_active = 1 ORDER BY created_at DESC'
    : 'SELECT * FROM alerts ORDER BY created_at DESC'
  const rs = await run(query)
  return rs.rows as unknown as Alert[]
}

export async function createAlert(
  coin: string,
  condition: 'above' | 'below',
  targetPrice: number,
  note?: string
): Promise<Alert> {
  const result = await run(
    'INSERT INTO alerts (coin, condition, target_price, note) VALUES (?, ?, ?, ?)',
    [coin.toUpperCase(), condition, targetPrice, note ?? null]
  )
  const rs = await run('SELECT * FROM alerts WHERE id = ?', [Number(result.lastInsertRowid)])
  return rs.rows[0] as unknown as Alert
}

export async function updateAlert(id: number, updates: Partial<Alert>): Promise<Alert | null> {
  const fields = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(', ')
  const values = Object.values(updates) as InValue[]
  await run(`UPDATE alerts SET ${fields} WHERE id = ?`, [...values, id])
  const rs = await run('SELECT * FROM alerts WHERE id = ?', [id])
  return (rs.rows[0] as unknown as Alert) ?? null
}

export async function deleteAlert(id: number): Promise<void> {
  await run('DELETE FROM alerts WHERE id = ?', [id])
}

export async function triggerAlert(alertId: number, triggeredPrice: number): Promise<void> {
  const rs = await run('SELECT * FROM alerts WHERE id = ?', [alertId])
  const alert = rs.rows[0] as unknown as Alert | undefined
  if (!alert) return

  await run('UPDATE alerts SET is_active = 0, triggered_at = datetime("now") WHERE id = ?', [
    alertId,
  ])

  await run(
    'INSERT INTO alert_history (alert_id, coin, condition, target_price, triggered_price) VALUES (?, ?, ?, ?, ?)',
    [alertId, alert.coin, alert.condition, alert.target_price, triggeredPrice]
  )
}

export async function getAlertHistory() {
  const rs = await run('SELECT * FROM alert_history ORDER BY triggered_at DESC LIMIT 50')
  return rs.rows
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

export async function getReminders(includeCompleted = false): Promise<Reminder[]> {
  const query = includeCompleted
    ? 'SELECT * FROM reminders ORDER BY due_at ASC NULLS LAST, created_at DESC'
    : 'SELECT * FROM reminders WHERE is_done = 0 ORDER BY due_at ASC NULLS LAST, created_at DESC'
  const rs = await run(query)
  return rs.rows as unknown as Reminder[]
}

export async function createReminder(
  title: string,
  description?: string,
  dueAt?: string,
  priority: 'low' | 'normal' | 'high' = 'normal'
): Promise<Reminder> {
  const result = await run(
    'INSERT INTO reminders (title, description, due_at, priority) VALUES (?, ?, ?, ?)',
    [title, description ?? null, dueAt ?? null, priority]
  )
  const rs = await run('SELECT * FROM reminders WHERE id = ?', [Number(result.lastInsertRowid)])
  return rs.rows[0] as unknown as Reminder
}

export async function updateReminder(
  id: number,
  updates: Partial<Reminder>
): Promise<Reminder | null> {
  if (updates.is_done === 1 && !updates.completed_at) {
    updates.completed_at = new Date().toISOString()
  }
  const fields = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(', ')
  const values = Object.values(updates) as InValue[]
  await run(`UPDATE reminders SET ${fields} WHERE id = ?`, [...values, id])
  const rs = await run('SELECT * FROM reminders WHERE id = ?', [id])
  return (rs.rows[0] as unknown as Reminder) ?? null
}

export async function deleteReminder(id: number): Promise<void> {
  await run('DELETE FROM reminders WHERE id = ?', [id])
}

// Settings key/value store
export async function getSetting(key: string): Promise<string | null> {
  const rs = await run('SELECT value FROM settings WHERE key = ?', [key])
  const row = rs.rows[0] as unknown as { value: string } | undefined
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await run(
    'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now")) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    [key, value]
  )
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rs = await run('SELECT key, value FROM settings')
  const rows = rs.rows as unknown as { key: string; value: string }[]
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

export async function createJobRun(jobKey: string, jobName: string): Promise<AgentJobRun> {
  const result = await run('INSERT INTO agent_jobs (job_key, job_name, status) VALUES (?, ?, ?)', [
    jobKey,
    jobName,
    'running',
  ])
  const rs = await run('SELECT * FROM agent_jobs WHERE id = ?', [Number(result.lastInsertRowid)])
  return rs.rows[0] as unknown as AgentJobRun
}

export async function completeJobRun(id: number, output: string): Promise<void> {
  await run(
    'UPDATE agent_jobs SET status = ?, output = ?, completed_at = datetime("now") WHERE id = ?',
    ['complete', output, id]
  )
}

export async function failJobRun(id: number, error: string): Promise<void> {
  await run(
    'UPDATE agent_jobs SET status = ?, error = ?, completed_at = datetime("now") WHERE id = ?',
    ['error', error, id]
  )
}

export async function getRecentJobRuns(limit = 30): Promise<AgentJobRun[]> {
  const rs = await run('SELECT * FROM agent_jobs ORDER BY created_at DESC LIMIT ?', [limit])
  return rs.rows as unknown as AgentJobRun[]
}

export async function getLatestJobRunPerKey(): Promise<AgentJobRun[]> {
  const rs = await run(
    `SELECT * FROM agent_jobs aj
     WHERE id = (
       SELECT id FROM agent_jobs
       WHERE job_key = aj.job_key
       ORDER BY created_at DESC LIMIT 1
     )
     ORDER BY job_key`
  )
  return rs.rows as unknown as AgentJobRun[]
}
