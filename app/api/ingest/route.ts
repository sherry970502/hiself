import { NextRequest, NextResponse } from 'next/server'
import { isOwner, unauthorized } from '@/lib/auth'
import { parseFile, chunkText } from '@/lib/file-parser'
import { hasApiKey, complete, extractJson } from '@/lib/ai'
import { CLASSIFY_PROMPT } from '@/lib/prompts'
import { mockClassify } from '@/lib/mock'
import { batchCreateMemories } from '@/lib/db/queries/memories'
import type { MemoryType, Visibility } from '@/types'

interface ClassifiedItem { type: MemoryType; content: string; visibility: Visibility }

const VALID_TYPES = new Set(['V', 'M', 'F', 'P', 'S'])

async function classifyChunk(chunk: string): Promise<ClassifiedItem[]> {
  if (!hasApiKey()) return mockClassify(chunk)
  const raw = await complete(CLASSIFY_PROMPT, chunk)
  const items = extractJson<ClassifiedItem[]>(raw) ?? []
  return items.filter(i => VALID_TYPES.has(i.type) && i.content?.trim())
    .map(i => ({ ...i, visibility: i.visibility === 'public' ? 'public' : 'private' as Visibility }))
}

export async function POST(req: NextRequest) {
  if (!isOwner(req)) return unauthorized()

  const contentType = req.headers.get('content-type') ?? ''
  const results: { source: string; count: number; error?: string }[] = []

  try {
    if (contentType.includes('multipart/form-data')) {
      // 文件批量上传
      const formData = await req.formData()
      const files = formData.getAll('files') as File[]
      for (const file of files) {
        try {
          const text = await parseFile(file)
          const count = await ingestText(text, file.name)
          results.push({ source: file.name, count })
        } catch (e) {
          results.push({ source: file.name, count: 0, error: e instanceof Error ? e.message : '解析失败' })
        }
      }
    } else {
      // 文本粘贴
      const { text, source } = await req.json()
      if (!text?.trim()) return NextResponse.json({ error: '内容为空' }, { status: 400 })
      const count = await ingestText(text, source || '文本粘贴')
      results.push({ source: source || '文本粘贴', count })
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '导入失败' }, { status: 500 })
  }

  return NextResponse.json({ results, total: results.reduce((a, r) => a + r.count, 0) })
}

async function ingestText(text: string, source: string): Promise<number> {
  const chunks = chunkText(text)
  const allItems: (ClassifiedItem & { source: string })[] = []
  for (const chunk of chunks) {
    const items = await classifyChunk(chunk)
    allItems.push(...items.map(i => ({ ...i, source })))
  }
  if (!allItems.length) return 0
  batchCreateMemories(allItems.map(i => ({
    type: i.type, content: i.content, visibility: i.visibility, source: i.source,
  })))
  return allItems.length
}
