import { NextRequest, NextResponse } from 'next/server'
import { isOwner, unauthorized } from '@/lib/auth'
import { getMemory, updateMemory, deleteMemory } from '@/lib/db/queries/memories'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isOwner(req)) return unauthorized()
  const { id } = await params
  if (!getMemory(id)) return NextResponse.json({ error: 'not found' }, { status: 404 })
  const body = await req.json()
  updateMemory(id, body)
  return NextResponse.json(getMemory(id))
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isOwner(req)) return unauthorized()
  const { id } = await params
  deleteMemory(id)
  return NextResponse.json({ ok: true })
}
