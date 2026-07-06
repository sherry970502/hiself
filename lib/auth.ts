import { NextRequest, NextResponse } from 'next/server'
import { getBoardAccess } from '@/lib/db/queries/settings'

export const OWNER_COOKIE = 'avatar_owner'
export const BOARD_COOKIE = 'board_pass'

export function getOwnerToken(): string {
  return process.env.OWNER_TOKEN || 'owner123'
}

export function isOwner(req: NextRequest): boolean {
  return req.cookies.get(OWNER_COOKIE)?.value === getOwnerToken()
}

/** 看板是否对当前请求开放:公开模式 / Owner / 已答对题目的访客 */
export function isBoardUnlocked(req: NextRequest): boolean {
  const access = getBoardAccess()
  if (access.mode !== 'private') return true
  if (isOwner(req)) return true
  const pass = req.cookies.get(BOARD_COOKIE)?.value
  return !!pass && !!access.token && pass === access.token
}

export function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}

export function boardLocked() {
  return NextResponse.json({ error: '需要先通过验证才能访问' }, { status: 401 })
}
