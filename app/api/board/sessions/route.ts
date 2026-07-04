import { NextRequest, NextResponse } from 'next/server'
import { isOwner, unauthorized } from '@/lib/auth'
import { listSessions, getSessionMessages } from '@/lib/db/queries/board'

export async function GET(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const sessionId = req.nextUrl.searchParams.get('session_id')
  if (sessionId) return NextResponse.json(getSessionMessages(sessionId, 200))
  return NextResponse.json(listSessions())
}
