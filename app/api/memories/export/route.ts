import { NextRequest, NextResponse } from 'next/server'
import { isOwner, unauthorized } from '@/lib/auth'
import { listMemories } from '@/lib/db/queries/memories'
import { TYPE_META } from '@/types'

export async function GET(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()
  const format = req.nextUrl.searchParams.get('format') ?? 'json'
  const memories = listMemories({ limit: 100000 })
  const date = new Date().toISOString().slice(0, 10)

  if (format === 'md') {
    const groups = new Map<string, typeof memories>()
    for (const m of memories) {
      if (!groups.has(m.type)) groups.set(m.type, [])
      groups.get(m.type)!.push(m)
    }
    let md = `# AI 分身 · 人格层全量导出\n\n> 导出时间：${new Date().toLocaleString('zh-CN')} · 共 ${memories.length} 条\n`
    for (const [type, items] of groups) {
      md += `\n## ${type} · ${TYPE_META[type as keyof typeof TYPE_META]?.label ?? type}（${items.length} 条）\n\n`
      for (const m of items) {
        md += `- ${m.content}\n  - 来源：${m.source} · ${m.visibility} · ${m.created_at}\n`
      }
    }
    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="ai-avatar-export-${date}.md"`,
      },
    })
  }

  return new NextResponse(JSON.stringify(memories, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="ai-avatar-export-${date}.json"`,
    },
  })
}
