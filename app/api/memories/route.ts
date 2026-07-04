import { NextRequest, NextResponse } from 'next/server'
import { isOwner, unauthorized } from '@/lib/auth'
import { listMemories, createMemory } from '@/lib/db/queries/memories'
import type { MemoryType, Visibility } from '@/types'

export async function GET(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const sp = req.nextUrl.searchParams
  const memories = listMemories({
    type: (sp.get('type') as MemoryType) || undefined,
    visibility: (sp.get('visibility') as Visibility) || undefined,
    source: sp.get('source') || undefined,
    search: sp.get('search') || undefined,
    questionStatus: (sp.get('question_status') as 'pending' | 'answered') || undefined,
  })
  return NextResponse.json(memories)
}

export async function POST(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const body = await req.json()
  if (!body.content?.trim() || !body.type) {
    return NextResponse.json({ error: 'type 和 content 必填' }, { status: 400 })
  }
  const memory = createMemory({
    type: body.type,
    content: body.content.trim(),
    source: body.source || '手动',
    visibility: body.visibility || 'private',
    question_status: body.type === 'Q' ? 'pending' : null,
  })
  return NextResponse.json(memory)
}
