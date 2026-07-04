import { NextRequest, NextResponse } from 'next/server'
import { isOwner, unauthorized } from '@/lib/auth'
import { hasApiKey, complete, extractJson } from '@/lib/ai'
import { EXTRACT_PROMPT } from '@/lib/prompts'
import { mockExtract } from '@/lib/mock'
import { batchCreateMemories, getPendingQuestions, markQuestionAnswered } from '@/lib/db/queries/memories'
import type { MemoryType, Visibility } from '@/types'

interface ExtractedItem {
  type: MemoryType
  content: string
  visibility: Visibility
  answered_question_id: string | null
}

/** Owner 发言 → 判断是否含观点/方法论/事实 → 自动沉淀为人格层条目 */
export async function POST(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const { utterance, source } = await req.json()
  if (!utterance?.trim()) return NextResponse.json({ created: [] })

  const pending = getPendingQuestions(10)
  let items: ExtractedItem[]

  if (!hasApiKey()) {
    items = mockExtract(utterance)
  } else {
    const queueBlock = pending.length
      ? `\n\n【待访谈队列】\n${pending.map(q => `- id=${q.id}: ${q.content}`).join('\n')}`
      : ''
    const raw = await complete(EXTRACT_PROMPT, `Owner 说：${utterance}${queueBlock}`)
    items = (extractJson<ExtractedItem[]>(raw) ?? [])
      .filter(i => ['V', 'M', 'F', 'P'].includes(i.type) && i.content?.trim())
  }

  if (!items.length) return NextResponse.json({ created: [] })

  const created = batchCreateMemories(items.map(i => ({
    type: i.type,
    content: i.content,
    visibility: i.visibility === 'public' ? 'public' : 'private',
    source: source || '语音对话',
  })))

  // 如果这段话回答了待访谈队列里的问题，闭环标记
  const pendingIds = new Set(pending.map(q => q.id))
  for (const item of items) {
    if (item.answered_question_id && pendingIds.has(item.answered_question_id)) {
      markQuestionAnswered(item.answered_question_id)
    }
  }

  return NextResponse.json({ created })
}
