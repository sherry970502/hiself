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
    // 容器环境下不用 WAL：容器被强杀/交接时 WAL 未落盘的事务会丢。
    // TRUNCATE + FULL 让每次提交直接固化进主文件，单用户规模性能足够。
    _db.pragma('journal_mode = TRUNCATE')
    _db.pragma('synchronous = FULL')
    _db.pragma('foreign_keys = ON')
    initSchema(_db)
    process.once('SIGTERM', () => { try { _db?.close() } catch { /* noop */ } })
    process.once('SIGINT', () => { try { _db?.close() } catch { /* noop */ } })
  }
  return _db
}
