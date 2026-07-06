import { NextRequest, NextResponse } from 'next/server'
import { BOARD_COOKIE, isBoardUnlocked, isOwner } from '@/lib/auth'
import { getBoardAccess, verifyChallenge } from '@/lib/db/queries/settings'
import type { BoardAccess, BoardAccessStatus } from '@/types'

function randomChallenge(access: BoardAccess): { id: string; question: string } | null {
  if (!access.challenges.length) return null
  const c = access.challenges[Math.floor(Math.random() * access.challenges.length)]
  return { id: c.id, question: c.question }
}

/** 访客侧:查询当前访问状态(私密且未解锁时附带一道随机题) */
export async function GET(req: NextRequest) {
  const access = getBoardAccess()
  // preview=1 且是 Owner 且私密模式:强制展示访客闸门,方便 Owner 预览访客视角
  const forceGate = req.nextUrl.searchParams.get('preview') === '1' && isOwner(req) && access.mode === 'private'
  const unlocked = forceGate ? false : isBoardUnlocked(req)
  const status: BoardAccessStatus = {
    mode: access.mode,
    unlocked,
    challenge: access.mode === 'private' && !unlocked ? randomChallenge(access) : null,
  }
  return NextResponse.json(status)
}

// 防暴力破解:同一 IP 5 分钟内最多 20 次尝试
const attempts = new Map<string, number[]>()
const ATTEMPT_WINDOW_MS = 5 * 60_000
const ATTEMPT_MAX = 20
function tooManyAttempts(ip: string): boolean {
  const now = Date.now()
  const hits = (attempts.get(ip) ?? []).filter(t => now - t < ATTEMPT_WINDOW_MS)
  if (hits.length >= ATTEMPT_MAX) return true
  hits.push(now)
  attempts.set(ip, hits)
  return false
}

/** 访客侧:提交答案,答对则种下解锁凭据 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'
  if (tooManyAttempts(ip)) {
    return NextResponse.json({ error: '尝试次数过多，请稍后再试' }, { status: 429 })
  }

  const { id, answer } = await req.json().catch(() => ({}))
  if (!id || typeof answer !== 'string' || !answer.trim()) {
    return NextResponse.json({ error: '请填写答案' }, { status: 400 })
  }
  if (!verifyChallenge(String(id), answer)) {
    return NextResponse.json({ error: '答案不对，再试试' }, { status: 401 })
  }

  const access = getBoardAccess()
  const res = NextResponse.json({ ok: true })
  res.cookies.set(BOARD_COOKIE, access.token, {
    httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30,
  })
  return res
}
