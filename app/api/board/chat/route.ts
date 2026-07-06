import { NextRequest, NextResponse } from 'next/server'
import { hasApiKey, getClient, complete, extractJson, MODEL } from '@/lib/ai'
import { buildVisitorSystemPrompt, VISITOR_GAP_PROMPT } from '@/lib/prompts'
import { retrieveMemories, getStyleSamples, hasCoverage } from '@/lib/retrieval'
import { createMemory } from '@/lib/db/queries/memories'
import { getOrCreateSession, bumpSessionTurn, addVisitorMessage, getSessionMessages, createInboxMessage } from '@/lib/db/queries/board'
import { getBoardProfile } from '@/lib/db/queries/settings'
import { isBoardUnlocked, boardLocked } from '@/lib/auth'
import { mockVisitorReply } from '@/lib/mock'

const MAX_TURNS_PER_SESSION = 30
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 10

// 简单内存限流（单机部署够用）
const rateBuckets = new Map<string, number[]>()
function rateLimited(key: string): boolean {
  const now = Date.now()
  const hits = (rateBuckets.get(key) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS)
  if (hits.length >= RATE_LIMIT_MAX) return true
  hits.push(now)
  rateBuckets.set(key, hits)
  return false
}

export async function POST(req: NextRequest) {
  if (!isBoardUnlocked(req)) return boardLocked()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local'
  if (rateLimited(ip)) {
    return NextResponse.json({ error: '聊得有点快，休息一下再来～' }, { status: 429 })
  }

  const { message, sessionId } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: '消息为空' }, { status: 400 })

  const session = getOrCreateSession(sessionId)
  if (session.turn_count >= MAX_TURNS_PER_SESSION) {
    return NextResponse.json({ error: '本次会话轮数已达上限，欢迎改天再来。' }, { status: 429 })
  }

  bumpSessionTurn(session.id)
  addVisitorMessage(session.id, 'user', message)

  // 只检索 public 条目
  const retrieved = retrieveMemories(message, { visibility: 'public', limit: 8 })
  const covered = hasCoverage(message, retrieved)
  const styleSamples = getStyleSamples('public', 4)
  const system = buildVisitorSystemPrompt(retrieved, styleSamples, getBoardProfile().bio || undefined)
  const history = getSessionMessages(session.id, 20).map(m => ({ role: m.role, content: m.content }))

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      let full = ''
      try {
        if (!hasApiKey()) {
          const reply = mockVisitorReply(message, retrieved, covered)
          for (const ch of reply) {
            full += ch
            controller.enqueue(encoder.encode(ch))
            await new Promise(r => setTimeout(r, 8))
          }
        } else {
          const anthropicStream = getClient().messages.stream({
            model: MODEL,
            max_tokens: 1500,
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
        addVisitorMessage(session.id, 'assistant', full)
        // 增长飞轮：未覆盖的问题入待访谈队列 + 留言检测（异步，不阻塞回复）
        void processGrowthFlywheel(message, covered, session.id)
      } catch (e) {
        controller.enqueue(encoder.encode(`\n[出错了：${e instanceof Error ? e.message : '未知错误'}]`))
      }
      controller.close()
    },
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Session-Id': session.id,
    },
  })
}

async function processGrowthFlywheel(message: string, covered: boolean, sessionId: string) {
  try {
    if (!hasApiKey()) {
      // Mock：未覆盖的疑问句入队（剥离转告部分）；关键词触发留言
      const fwd = message.match(/(?:帮我)?(?:转告他?|告诉他|留言)[，,：:]?\s*(.+)/)
      const questionPart = fwd ? message.slice(0, fwd.index).trim() : message
      if (!covered && /[?？]|怎么|为什么|如何|什么/.test(questionPart)) {
        createMemory({ type: 'Q', content: `访客问：${questionPart.slice(0, 150)}`, source: '访客提问', source_detail: sessionId, visibility: 'private' })
      }
      if (fwd) createInboxMessage(fwd[1] || message, sessionId)
      return
    }
    const raw = await complete(VISITOR_GAP_PROMPT, `访客消息：${message}\n人格层是否覆盖：${covered ? '是' : '否'}`)
    const parsed = extractJson<{ interview_question: string | null; forward_message: string | null }>(raw)
    if (parsed?.interview_question && !covered) {
      createMemory({ type: 'Q', content: parsed.interview_question, source: '访客提问', source_detail: sessionId, visibility: 'private' })
    }
    if (parsed?.forward_message) {
      createInboxMessage(parsed.forward_message, sessionId)
    }
  } catch {
    // 飞轮失败不影响对话
  }
}

// 留言按钮直达
export async function PUT(req: NextRequest) {
  if (!isBoardUnlocked(req)) return boardLocked()
  const { content, sessionId } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: '留言为空' }, { status: 400 })
  const msg = createInboxMessage(content.trim(), sessionId ?? null)
  return NextResponse.json(msg)
}
