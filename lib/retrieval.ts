import { getDb } from './db'
import type { Memory, Visibility } from '@/types'

/**
 * 人格层检索：中文关键词（CJK 二元组 + ASCII 词）打分 + 类型加权。
 * MVP 规模（数千条以内）在内存打分足够快，且比 FTS trigram 对中文短词更可靠。
 * - 观点类问题优先召回 V/M，事实类问题优先 F（加权，不做硬过滤）
 * - visitor 模式只检索 public 条目
 */

const STOPWORDS = new Set([
  '我们', '你们', '他们', '什么', '怎么', '怎样', '如何', '为什', '么看', '看法',
  '觉得', '知道', '一个', '这个', '那个', '应该', '可以', '是不', '不是', '有没',
  '没有', '的话', '问题', '请问', '你对', '我对', '他对', '对于', '关于',
])

/** 查询 → 关键词集合：ASCII 词 + CJK 连续段的二元组 */
export function extractKeywords(query: string): string[] {
  const keywords = new Set<string>()
  // ASCII 词（AI、OKR 等）
  for (const m of query.matchAll(/[A-Za-z0-9]{2,}/g)) keywords.add(m[0].toLowerCase())
  // CJK 段 → 二元组
  for (const run of query.matchAll(/[一-鿿]{2,}/g)) {
    const s = run[0]
    for (let i = 0; i < s.length - 1; i++) {
      const bi = s.slice(i, i + 2)
      if (!STOPWORDS.has(bi)) keywords.add(bi)
    }
  }
  return [...keywords].slice(0, 30)
}

function scoreContent(content: string, keywords: string[]): number {
  const lower = content.toLowerCase()
  let score = 0
  for (const k of keywords) {
    if (lower.includes(k)) score += 1
  }
  return score
}

export type ScoredMemory = Memory & { score: number }

export function retrieveMemories(query: string, opts: {
  visibility?: Visibility
  limit?: number
} = {}): ScoredMemory[] {
  const db = getDb()
  const limit = opts.limit ?? 10
  const visCond = opts.visibility ? `AND visibility = '${opts.visibility}'` : ''
  const keywords = extractKeywords(query)

  // 候选池：最近 2000 条非 Q 条目（MVP 规模全量）
  const candidates = db.prepare(`
    SELECT * FROM memories WHERE type != 'Q' ${visCond}
    ORDER BY created_at DESC LIMIT 2000
  `).all() as Memory[]

  const isOpinionQ = /怎么看|怎么想|观点|看法|认为|态度|立场|为什么|该不该|值不值|如何/.test(query)
  const isFactQ = /什么时候|谁|哪里|经历|做过|去过|时间|哪一年|多少/.test(query)

  const scored: ScoredMemory[] = candidates.map(m => {
    let score = scoreContent(m.content, keywords)
    if (score > 0) {
      if (isOpinionQ && (m.type === 'V' || m.type === 'M')) score *= 1.6
      if (isFactQ && m.type === 'F') score *= 1.6
    }
    return { ...m, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const hits = scored.filter(m => m.score > 0).slice(0, limit)

  // 兜底：命中不足时补充最近条目（score=0），保证分身对新库也有材料
  if (hits.length < 3) {
    const seen = new Set(hits.map(h => h.id))
    for (const m of scored) {
      if (hits.length >= limit) break
      if (!seen.has(m.id) && ['V', 'M', 'F', 'P'].includes(m.type)) hits.push(m)
    }
  }
  return hits
}

/** 表达风格样本：随机取几条 S 类（visitor 模式只取 public） */
export function getStyleSamples(visibility?: Visibility, limit = 5): Memory[] {
  const db = getDb()
  const visCond = visibility ? `AND visibility = '${visibility}'` : ''
  return db.prepare(`
    SELECT * FROM memories WHERE type = 'S' ${visCond} ORDER BY RANDOM() LIMIT ?
  `).all(limit) as Memory[]
}

/** 判断人格层是否真正覆盖了问题：至少 2 个关键词命中同一条目 */
export function hasCoverage(query: string, retrieved: ScoredMemory[]): boolean {
  return retrieved.some(m => m.score >= 2 && ['V', 'M', 'F', 'P'].includes(m.type))
}
