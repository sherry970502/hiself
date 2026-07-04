import { getDb } from '../index'
import { randomUUID } from 'crypto'
import type { VisitorSession, VisitorMessage, InboxMessage, ChatMessage } from '@/types'

// ─── 访客会话 ─────────────────────────────────────────────────────────────────

export function getOrCreateSession(sessionId?: string | null): VisitorSession {
  const db = getDb()
  if (sessionId) {
    const found = db.prepare('SELECT * FROM visitor_sessions WHERE id = ?').get(sessionId) as VisitorSession | undefined
    if (found) return found
  }
  const id = randomUUID()
  db.prepare('INSERT INTO visitor_sessions (id) VALUES (?)').run(id)
  return db.prepare('SELECT * FROM visitor_sessions WHERE id = ?').get(id) as VisitorSession
}

export function bumpSessionTurn(sessionId: string) {
  getDb().prepare(`
    UPDATE visitor_sessions SET turn_count = turn_count + 1, last_active_at = datetime('now','localtime') WHERE id = ?
  `).run(sessionId)
}

export function addVisitorMessage(sessionId: string, role: 'user' | 'assistant', content: string): VisitorMessage {
  const db = getDb()
  const id = randomUUID()
  db.prepare('INSERT INTO visitor_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)')
    .run(id, sessionId, role, content)
  return db.prepare('SELECT * FROM visitor_messages WHERE id = ?').get(id) as VisitorMessage
}

export function getSessionMessages(sessionId: string, limit = 40): VisitorMessage[] {
  return getDb().prepare(`
    SELECT * FROM visitor_messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ?
  `).all(sessionId, limit) as VisitorMessage[]
}

export function listSessions(limit = 50): (VisitorSession & { message_count: number; preview: string | null })[] {
  return getDb().prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM visitor_messages m WHERE m.session_id = s.id) as message_count,
      (SELECT content FROM visitor_messages m WHERE m.session_id = s.id AND m.role='user' ORDER BY created_at ASC LIMIT 1) as preview
    FROM visitor_sessions s ORDER BY last_active_at DESC LIMIT ?
  `).all(limit) as (VisitorSession & { message_count: number; preview: string | null })[]
}

// ─── 留言收件箱 ────────────────────────────────────────────────────────────────

export function createInboxMessage(content: string, sessionId?: string | null): InboxMessage {
  const db = getDb()
  const id = randomUUID()
  db.prepare('INSERT INTO inbox_messages (id, session_id, content) VALUES (?, ?, ?)')
    .run(id, sessionId ?? null, content)
  return db.prepare('SELECT * FROM inbox_messages WHERE id = ?').get(id) as InboxMessage
}

export function listInbox(limit = 100): InboxMessage[] {
  return getDb().prepare('SELECT * FROM inbox_messages ORDER BY created_at DESC LIMIT ?').all(limit) as InboxMessage[]
}

export function markInboxRead(id: string) {
  getDb().prepare('UPDATE inbox_messages SET is_read = 1 WHERE id = ?').run(id)
}

export function countUnreadInbox(): number {
  return (getDb().prepare('SELECT COUNT(*) as n FROM inbox_messages WHERE is_read = 0').get() as { n: number }).n
}

// ─── Owner 对话历史 ────────────────────────────────────────────────────────────

export function addOwnerMessage(role: 'user' | 'assistant', content: string): ChatMessage {
  const db = getDb()
  const id = randomUUID()
  db.prepare('INSERT INTO owner_messages (id, role, content) VALUES (?, ?, ?)').run(id, role, content)
  return db.prepare('SELECT * FROM owner_messages WHERE id = ?').get(id) as ChatMessage
}

export function getOwnerMessages(limit = 60): ChatMessage[] {
  const rows = getDb().prepare('SELECT * FROM owner_messages ORDER BY created_at DESC LIMIT ?').all(limit) as ChatMessage[]
  return rows.reverse()
}

export function countSessions(): number {
  return (getDb().prepare('SELECT COUNT(*) as n FROM visitor_sessions').get() as { n: number }).n
}
