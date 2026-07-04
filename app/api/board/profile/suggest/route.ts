import { NextRequest, NextResponse } from 'next/server'
import { isOwner, unauthorized } from '@/lib/auth'
import { hasApiKey, complete, extractJson } from '@/lib/ai'
import { PROFILE_SUGGEST_PROMPT } from '@/lib/prompts'
import { mockProfileSuggest } from '@/lib/mock'
import { listMemories } from '@/lib/db/queries/memories'

interface Suggestion { greeting: string; bio: string; questions: string[] }

/** AI 根据人格层起草门面文案（只用 public 条目——门面是对外的） */
export async function POST(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()

  const publicMemories = listMemories({ visibility: 'public', limit: 60 })
    .filter(m => m.type !== 'Q')
  if (!publicMemories.length) {
    return NextResponse.json({ error: '公开的人格层还是空的——先去喂养一些资料，或把已有条目设为公开' }, { status: 400 })
  }

  if (!hasApiKey()) {
    return NextResponse.json(mockProfileSuggest(publicMemories))
  }

  const corpus = publicMemories
    .map(m => `[${m.type}] ${m.content}`)
    .join('\n')
  const raw = await complete(PROFILE_SUGGEST_PROMPT, `Owner 的公开人格层条目：\n${corpus}`)
  const parsed = extractJson<Suggestion>(raw)
  if (!parsed?.greeting) {
    return NextResponse.json({ error: 'AI 起草失败，请重试' }, { status: 500 })
  }
  return NextResponse.json({
    greeting: parsed.greeting,
    bio: parsed.bio ?? '',
    questions: (parsed.questions ?? []).slice(0, 4),
  })
}
