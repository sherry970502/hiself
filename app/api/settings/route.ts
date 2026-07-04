import { NextRequest, NextResponse } from 'next/server'
import { isOwner, unauthorized } from '@/lib/auth'
import { getApiKey, setApiKey, getClient, MODEL } from '@/lib/ai'

export async function GET(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const key = getApiKey()
  return NextResponse.json({
    hasKey: !!key,
    keyMasked: key ? `${key.slice(0, 10)}…${key.slice(-4)}` : null,
  })
}

export async function POST(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const { anthropic_api_key } = await req.json()
  if (typeof anthropic_api_key !== 'string' || !anthropic_api_key.trim()) {
    return NextResponse.json({ error: 'key 为空' }, { status: 400 })
  }
  setApiKey(anthropic_api_key)

  // 立即验证 key 是否可用
  try {
    await getClient().messages.create({
      model: MODEL,
      max_tokens: 8,
      messages: [{ role: 'user', content: 'hi' }],
    })
    return NextResponse.json({ ok: true, verified: true })
  } catch (e) {
    return NextResponse.json({
      ok: true,
      verified: false,
      warning: `key 已保存但验证失败：${e instanceof Error ? e.message.slice(0, 120) : '未知错误'}`,
    })
  }
}

export async function DELETE(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  setApiKey('')
  return NextResponse.json({ ok: true })
}
