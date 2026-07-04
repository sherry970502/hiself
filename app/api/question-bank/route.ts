import { NextRequest, NextResponse } from 'next/server'
import { isOwner, unauthorized } from '@/lib/auth'
import { QUESTION_BANK, QUESTION_CATEGORIES } from '@/lib/question-bank'
import { listMemories, createMemory } from '@/lib/db/queries/memories'
import { addOwnerMessage } from '@/lib/db/queries/board'

/** 问题库 + 每题的提问/回答状态（与 Q 条目按内容匹配） */
export async function GET(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const asked = listMemories({ type: 'Q', source: '问题库', limit: 1000 })
  const statusByContent = new Map(asked.map(q => [q.content, q.question_status]))
  return NextResponse.json({
    categories: QUESTION_CATEGORIES,
    questions: QUESTION_BANK.map(q => ({
      ...q,
      status: statusByContent.get(q.text) ?? null, // null | pending | answered
    })),
  })
}

/** 选中一个问题：入待访谈队列 + 分身在对话里立刻问出来 */
export async function POST(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const { questionId } = await req.json()
  const q = QUESTION_BANK.find(x => x.id === questionId)
  if (!q) return NextResponse.json({ error: '问题不存在' }, { status: 404 })

  const existing = listMemories({ type: 'Q', source: '问题库', limit: 1000 })
    .find(m => m.content === q.text)
  if (!existing) {
    createMemory({ type: 'Q', content: q.text, source: '问题库', visibility: 'private' })
  }

  const ask = `换我问你一个问题：${q.text}`
  const message = addOwnerMessage('assistant', ask)
  return NextResponse.json({ message })
}
