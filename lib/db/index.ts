import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { initSchema } from './schema'

// 部署时通过 DB_PATH 指向持久化磁盘（如 /data/ai-avatar.db）
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'ai-avatar.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!_db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    _db = new Database(DB_PATH)
    _db.pragma('journal_mode = WAL')
    _db.pragma('foreign_keys = ON')
    initSchema(_db)
  }
  return _db
}
