import { NextRequest, NextResponse } from 'next/server'

export const OWNER_COOKIE = 'avatar_owner'

export function getOwnerToken(): string {
  return process.env.OWNER_TOKEN || 'owner123'
}

export function isOwner(req: NextRequest): boolean {
  return req.cookies.get(OWNER_COOKIE)?.value === getOwnerToken()
}

export function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}
