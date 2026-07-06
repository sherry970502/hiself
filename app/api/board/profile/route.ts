import { NextRequest, NextResponse } from 'next/server'
import { isOwner, isBoardUnlocked, unauthorized } from '@/lib/auth'
import { getBoardProfile, setBoardProfile } from '@/lib/db/queries/settings'
import { EMPTY_PROFILE, type BoardProfile } from '@/types'

/** 门面是对外内容；私密模式下未解锁的访客不返回真实内容,避免泄露 */
export async function GET(req: NextRequest) {
  if (!isBoardUnlocked(req)) return NextResponse.json(EMPTY_PROFILE)
  return NextResponse.json(getBoardProfile())
}

export async function PUT(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const body = await req.json()
  const profile: BoardProfile = {
    name: String(body.name ?? '').slice(0, 30),
    avatar: typeof body.avatar === 'string' && body.avatar.startsWith('data:image/') ? body.avatar : null,
    greeting: String(body.greeting ?? '').slice(0, 300),
    bio: String(body.bio ?? '').slice(0, 500),
    questions: Array.isArray(body.questions)
      ? body.questions.map((q: unknown) => String(q).trim()).filter(Boolean).slice(0, 4)
      : [],
  }
  // 头像限制 ~400KB（dataURL 长度近似）
  if (profile.avatar && profile.avatar.length > 550_000) {
    return NextResponse.json({ error: '头像图片太大，请换一张小于 400KB 的' }, { status: 400 })
  }
  setBoardProfile({ ...EMPTY_PROFILE, ...profile })
  return NextResponse.json(getBoardProfile())
}
