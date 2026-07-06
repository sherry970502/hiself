import { NextRequest, NextResponse } from 'next/server'
import { isOwner, unauthorized } from '@/lib/auth'
import { getBoardAccess, setBoardAccess } from '@/lib/db/queries/settings'
import type { BoardAccessConfig } from '@/types'

/** 工作台读取访问设置(含答案,仅 Owner) */
export async function GET(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const a = getBoardAccess()
  const config: BoardAccessConfig = { mode: a.mode, challenges: a.challenges }
  return NextResponse.json(config)
}

/** 工作台保存访问设置(仅 Owner) */
export async function PUT(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const body = await req.json().catch(() => ({}))

  if (body.mode === 'private') {
    const valid = Array.isArray(body.challenges)
      ? body.challenges.filter(
          (c: { question?: string; answer?: string }) =>
            String(c?.question ?? '').trim() && String(c?.answer ?? '').trim(),
        )
      : []
    if (!valid.length) {
      return NextResponse.json({ error: '私密模式至少需要设置一组问题和答案' }, { status: 400 })
    }
  }

  const saved = setBoardAccess(body)
  const config: BoardAccessConfig = { mode: saved.mode, challenges: saved.challenges }
  return NextResponse.json(config)
}
