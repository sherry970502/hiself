// ─── 人格层条目 ────────────────────────────────────────────────────────────────
// V 观点/立场 · M 方法论/框架 · F 事实/经历 · P 偏好/品味 · S 表达风格样本 · Q 待访谈问题

export type MemoryType = 'V' | 'M' | 'F' | 'P' | 'S' | 'Q'
export type Visibility = 'public' | 'private'
export type QuestionStatus = 'pending' | 'answered'

export interface Memory {
  id: string
  type: MemoryType
  content: string
  source: string          // 来源：文件名 / 语音对话 / 访谈 / 访客提问 / 手动
  source_detail: string | null
  visibility: Visibility
  question_status: QuestionStatus | null  // 仅 Q 类使用
  created_at: string
}

export const TYPE_META: Record<MemoryType, { label: string; color: string }> = {
  V: { label: '观点/立场', color: 'bg-blue-100 text-blue-700' },
  M: { label: '方法论', color: 'bg-purple-100 text-purple-700' },
  F: { label: '事实/经历', color: 'bg-green-100 text-green-700' },
  P: { label: '偏好/品味', color: 'bg-pink-100 text-pink-700' },
  S: { label: '表达风格', color: 'bg-amber-100 text-amber-700' },
  Q: { label: '待访谈', color: 'bg-zinc-200 text-zinc-700' },
}

// ─── 对话 ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface VisitorSession {
  id: string
  turn_count: number
  created_at: string
  last_active_at: string
}

export interface VisitorMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

// ─── 留言收件箱 ────────────────────────────────────────────────────────────────

export interface InboxMessage {
  id: string
  session_id: string | null
  content: string
  is_read: number
  created_at: string
}

// ─── 仪表盘 ───────────────────────────────────────────────────────────────────

export interface DashboardStats {
  memoryCount: number
  memoryByType: Record<MemoryType, number>
  visitorSessionCount: number
  pendingQuestionCount: number
  unreadInboxCount: number
  topTopics: { topic: string; count: number }[]
}
