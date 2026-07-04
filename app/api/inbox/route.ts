import { NextRequest, NextResponse } from 'next/server'
import { isOwner, unauthorized } from '@/lib/auth'
import { listInbox, markInboxRead } from '@/lib/db/queries/board'

export async function GET(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  return NextResponse.json(listInbox())
}

export async function PATCH(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const { id } = await req.json()
  markInboxRead(id)
  return NextResponse.json({ ok: true })
}
