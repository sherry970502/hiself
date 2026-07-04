import { getDb } from '../index'
import { randomUUID } from 'crypto'
import type { Memory, MemoryType, Visibility } from '@/types'

export interface MemoryFilter {
  type?: MemoryType
  visibility?: Visibility
  source?: string
  search?: string
  questionStatus?: 'pending' | 'answered'
  limit?: number
}

export function listMemories(filter: MemoryFilter = {}): Memory[] {
  const db = getDb()
  const conds: string[] = []
  const params: (string | number)[] = []

  if (filter.search) {
    // trigram 需要至少 3 字符；不足时退化为 LIKE
    if (filter.search.length >= 3) {
      conds.push(`rowid IN (SELECT rowid FROM memories_fts WHERE memories_fts MATCH ?)`)
      params.push(`"${filter.search.replace(/"/g, '""')}"`)
    } else {
      conds.push(`content LIKE ?`)
      params.push(`%${filter.search}%`)
    }
  }
  if (filter.type) { conds.push('type = ?'); params.push(filter.type) }
  if (filter.visibility) { conds.push('visibility = ?'); params.push(filter.visibility) }
  if (filter.source) { conds.push('source = ?'); params.push(filter.source) }
  if (filter.questionStatus) { conds.push('question_status = ?'); params.push(filter.questionStatus) }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''
  const limit = filter.limit ?? 500
  return db.prepare(`SELECT * FROM memories ${where} ORDER BY created_at DESC LIMIT ?`)
    .all(...params, limit) as Memory[]
}

export function getMemory(id: string): Memory | undefined {
  return getDb().prepare('SELECT * FROM memories WHERE id = ?').get(id) as Memory | undefined
}

export function createMemory(data: {
  type: MemoryType
  content: string
  source: string
  source_detail?: string | null
  visibility?: Visibility
  question_status?: 'pending' | 'answered' | null
}): Memory {
  const db = getDb()
  const id = randomUUID()
  db.prepare(`
    INSERT INTO memories (id, type, content, source, source_detail, visibility, question_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.type, data.content, data.source,
    data.source_detail ?? null,
    data.visibility ?? 'private',
    data.type === 'Q' ? (data.question_status ?? 'pending') : null,
  )
  return getMemory(id)!
}

export function batchCreateMemories(items: Parameters<typeof createMemory>[0][]): Memory[] {
  const db = getDb()
  const results: Memory[] = []
  const run = db.transaction(() => {
    for (const item of items) results.push(createMemory(item))
  })
  run()
  return results
}

export function updateMemory(id: string, patch: Partial<Pick<Memory, 'content' | 'type' | 'visibility' | 'question_status'>>) {
  const db = getDb()
  const fields: string[] = []
  const params: (string | null)[] = []
  if (patch.content !== undefined) { fields.push('content = ?'); params.push(patch.content) }
  if (patch.type !== undefined) { fields.push('type = ?'); params.push(patch.type) }
  if (patch.visibility !== undefined) { fields.push('visibility = ?'); params.push(patch.visibility) }
  if (patch.question_status !== undefined) { fields.push('question_status = ?'); params.push(patch.question_status) }
  if (!fields.length) return
  db.prepare(`UPDATE memories SET ${fields.join(', ')} WHERE id = ?`).run(...params, id)
}

export function deleteMemory(id: string) {
  getDb().prepare('DELETE FROM memories WHERE id = ?').run(id)
}

export function countByType(): Record<string, number> {
  const rows = getDb().prepare('SELECT type, COUNT(*) as n FROM memories GROUP BY type').all() as { type: string; n: number }[]
  return Object.fromEntries(rows.map(r => [r.type, r.n]))
}

// ─── 待访谈队列 ────────────────────────────────────────────────────────────────

export function getPendingQuestions(limit = 20): Memory[] {
  return getDb().prepare(`
    SELECT * FROM memories WHERE type = 'Q' AND question_status = 'pending'
    ORDER BY created_at ASC LIMIT ?
  `).all(limit) as Memory[]
}

export function markQuestionAnswered(id: string) {
  getDb().prepare(`UPDATE memories SET question_status = 'answered' WHERE id = ? AND type = 'Q'`).run(id)
}
