import { NextRequest, NextResponse } from 'next/server'
import { OWNER_COOKIE, getOwnerToken, isOwner } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { token } = await req.json()
  if (token !== getOwnerToken()) {
    return NextResponse.json({ error: '口令错误' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(OWNER_COOKIE, token, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30 })
  return res
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ isOwner: isOwner(req) })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(OWNER_COOKIE)
  return res
}
