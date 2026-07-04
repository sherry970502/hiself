import Anthropic from '@anthropic-ai/sdk'
import { setGlobalDispatcher, ProxyAgent } from 'undici'
import { getDb } from './db'

export const MODEL = 'claude-sonnet-4-6'

/** API key 优先级：数据库 settings（控制台可配）> 环境变量。都没有则走 Mock 模式 */
export function getApiKey(): string | null {
  try {
    const row = getDb().prepare(`SELECT value FROM settings WHERE key = 'anthropic_api_key'`).get() as { value: string } | undefined
    if (row?.value?.trim()) return row.value.trim()
  } catch { /* db 未就绪时兜底到环境变量 */ }
  return process.env.ANTHROPIC_API_KEY || null
}

export function setApiKey(key: string) {
  getDb().prepare(`
    INSERT INTO settings (key, value) VALUES ('anthropic_api_key', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `).run(key.trim())
}

export function hasApiKey(): boolean {
  return !!getApiKey()
}

let _client: Anthropic | null = null
let _clientKey: string | null = null

export function getClient(): Anthropic {
  const key = getApiKey()
  if (!_client || _clientKey !== key) {
    const proxy = process.env.HTTPS_PROXY || process.env.https_proxy
    if (proxy) setGlobalDispatcher(new ProxyAgent(proxy))
    _client = new Anthropic({ apiKey: key ?? undefined })
    _clientKey = key
  }
  return _client
}

/** 非流式调用，返回纯文本 */
export async function complete(system: string, user: string, maxTokens = 4000): Promise<string> {
  const res = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  })
  const block = res.content[0]
  return block.type === 'text' ? block.text : ''
}

/** 提取 LLM 回复中的 JSON（容忍 markdown 代码块包裹） */
export function extractJson<T>(text: string): T | null {
  const cleaned = text.replace(/```json?\s*/g, '').replace(/```/g, '').trim()
  const start = cleaned.search(/[[{]/)
  if (start === -1) return null
  try {
    return JSON.parse(cleaned.slice(start)) as T
  } catch {
    return null
  }
}
