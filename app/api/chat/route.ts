import { NextRequest, NextResponse } from 'next/server'
import { isOwner, unauthorized } from '@/lib/auth'
import { hasApiKey, getClient, MODEL } from '@/lib/ai'
import { buildOwnerSystemPrompt } from '@/lib/prompts'
import { retrieveMemories, getStyleSamples } from '@/lib/retrieval'
import { getPendingQuestions } from '@/lib/db/queries/memories'
import { addOwnerMessage, getOwnerMessages } from '@/lib/db/queries/board'
import { mockOwnerReply } from '@/lib/mock'

export async function GET(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  return NextResponse.json(getOwnerMessages())
}

export async function POST(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: '消息为空' }, { status: 400 })

  addOwnerMessage('user', message)

  const retrieved = retrieveMemories(message, { limit: 10 })
  const styleSamples = getStyleSamples(undefined, 5)
  const pendingQuestions = getPendingQuestions(3)
  const system = buildOwnerSystemPrompt(retrieved, styleSamples, pendingQuestions)

  // 带上近期对话历史，让访谈有上下文
  const history = getOwnerMessages(20).map(m => ({ role: m.role, content: m.content }))

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let full = ''
      try {
        if (!hasApiKey()) {
          const reply = mockOwnerReply(message, retrieved, pendingQuestions)
          for (const ch of reply) {
            full += ch
            controller.enqueue(encoder.encode(ch))
            await new Promise(r => setTimeout(r, 8))
          }
        } else {
          const anthropicStream = getClient().messages.stream({
            model: MODEL,
            max_tokens: 2000,
            system,
            messages: history.length ? history : [{ role: 'user' as const, content: message }],
          })
          for await (const event of anthropicStream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              full += event.delta.text
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        }
        addOwnerMessage('assistant', full)
      } catch (e) {
        controller.enqueue(encoder.encode(`\n[生成出错：${e instanceof Error ? e.message : '未知错误'}]`))
      }
      controller.close()
    },
  })

  return new NextResponse(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  })
}
