import { NextRequest, NextResponse } from 'next/server'
import { isOwner, unauthorized } from '@/lib/auth'
import { countByType, getPendingQuestions } from '@/lib/db/queries/memories'
import { countSessions, countUnreadInbox, listInbox } from '@/lib/db/queries/board'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const byType = countByType()
  const pending = getPendingQuestions(10)

  // 被问最多的话题：取访客提问 Q 条目的高频词（极简实现）
  const visitorQs = getDb().prepare(`
    SELECT content FROM memories WHERE type='Q' AND source='访客提问' ORDER BY created_at DESC LIMIT 100
  `).all() as { content: string }[]
  const freq = new Map<string, number>()
  for (const q of visitorQs) {
    for (const w of q.content.replace(/访客问：/g, '').split(/[^\p{L}\p{N}]+/u)) {
      if (w.length >= 2) freq.set(w, (freq.get(w) ?? 0) + 1)
    }
  }
  const topTopics = [...freq.entries()]
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([topic, count]) => ({ topic, count }))

  return NextResponse.json({
    memoryCount: Object.values(byType).reduce((a, n) => a + n, 0),
    memoryByType: byType,
    visitorSessionCount: countSessions(),
    pendingQuestionCount: (byType['Q'] ?? 0) === 0 ? 0 : pending.length,
    pendingQuestions: pending,
    unreadInboxCount: countUnreadInbox(),
    recentInbox: listInbox(5),
    topTopics,
  })
}
