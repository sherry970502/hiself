'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Search, Trash2, Lock, Globe, Check, X, Download, Plus, Inbox as InboxIcon, MessageSquare, HelpCircle, Brain, Pencil } from 'lucide-react'
import { OwnerNav } from '@/components/OwnerNav'
import { useOwnerGuard } from '@/components/useOwnerGuard'
import { TYPE_META, type Memory, type MemoryType, type InboxMessage, type VisitorSession, type VisitorMessage } from '@/types'

type Tab = 'memories' | 'interview' | 'inbox' | 'sessions'

const TABS: { key: Tab; label: string; icon: typeof Brain }[] = [
  { key: 'memories', label: '人格层条目', icon: Brain },
  { key: 'interview', label: '待访谈', icon: HelpCircle },
  { key: 'inbox', label: '留言收件箱', icon: InboxIcon },
  { key: 'sessions', label: '访客会话', icon: MessageSquare },
]

export default function MemoryPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>}>
      <MemoryPage />
    </Suspense>
  )
}

function MemoryPage() {
  const ready = useOwnerGuard()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'memories')

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <OwnerNav />
      <main className="flex-1 px-8 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-zinc-900">记忆管理</h2>
          <div className="flex items-center gap-2">
            <a href="/api/memories/export?format=json" className="flex items-center gap-1 text-xs text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-white transition-colors">
              <Download className="w-3 h-3" />JSON
            </a>
            <a href="/api/memories/export?format=md" className="flex items-center gap-1 text-xs text-zinc-500 border border-zinc-200 rounded-lg px-3 py-1.5 hover:bg-white transition-colors">
              <Download className="w-3 h-3" />Markdown
            </a>
          </div>
        </div>

        <div className="flex items-center gap-1 mb-6 bg-zinc-100 rounded-xl p-1 w-fit">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors ${
                tab === key ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
              }`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {tab === 'memories' && <MemoriesTab />}
        {tab === 'interview' && <InterviewTab />}
        {tab === 'inbox' && <InboxTab />}
        {tab === 'sessions' && <SessionsTab />}
      </main>
    </div>
  )
}

// ─── 人格层条目 ────────────────────────────────────────────────────────────────

function MemoriesTab() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [typeFilter, setTypeFilter] = useState<MemoryType | ''>('')
  const [visFilter, setVisFilter] = useState<'' | 'public' | 'private'>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (typeFilter) params.set('type', typeFilter)
    if (visFilter) params.set('visibility', visFilter)
    if (search.trim()) params.set('search', search.trim())
    const res = await fetch(`/api/memories?${params}`)
    setMemories(await res.json())
    setLoading(false)
  }, [typeFilter, visFilter, search])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-300" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索内容…"
            className="w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200" />
        </div>
        <div className="flex gap-1">
          <FilterChip active={typeFilter === ''} onClick={() => setTypeFilter('')}>全部</FilterChip>
          {(['V', 'M', 'F', 'P', 'S'] as MemoryType[]).map(t => (
            <FilterChip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>{TYPE_META[t].label}</FilterChip>
          ))}
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          className="ml-auto shrink-0 flex items-center gap-1 text-xs bg-zinc-900 text-white rounded-lg px-3 py-2 hover:bg-zinc-700 transition-colors">
          <Plus className="w-3.5 h-3.5" />手动添加
        </button>
      </div>

      {/* 可见性审计：一眼看清哪些内容对外可见 */}
      <div className="flex items-center gap-1.5 mb-4">
        <span className="text-[11px] text-zinc-400 mr-1">可见性</span>
        <FilterChip active={visFilter === ''} onClick={() => setVisFilter('')}>全部</FilterChip>
        <FilterChip active={visFilter === 'public'} onClick={() => setVisFilter('public')}>
          <span className="inline-flex items-center gap-1"><Globe className="w-3 h-3 text-green-500" />对外可见</span>
        </FilterChip>
        <FilterChip active={visFilter === 'private'} onClick={() => setVisFilter('private')}>
          <span className="inline-flex items-center gap-1"><Lock className="w-3 h-3" />仅自己</span>
        </FilterChip>
        {visFilter === 'public' && (
          <span className="text-[11px] text-amber-600 ml-2">↓ 以下内容访客都能问到，逐条确认一遍</span>
        )}
      </div>

      {showAdd && <AddMemoryForm onAdded={() => { setShowAdd(false); load() }} />}

      {loading ? (
        <div className="py-16 text-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-300 mx-auto" /></div>
      ) : memories.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-400">没有条目。去「喂养」页导入资料吧。</p>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-zinc-400 mb-2">{memories.length} 条</p>
          {memories.map(m => <MemoryCard key={m.id} memory={m} onChange={load} />)}
        </div>
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`text-[11.5px] px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
        active ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200 text-zinc-500 hover:border-zinc-300'
      }`}>
      {children}
    </button>
  )
}

function MemoryCard({ memory, onChange }: { memory: Memory; onChange: () => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(memory.content)

  async function patch(body: Record<string, string>) {
    await fetch(`/api/memories/${memory.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    onChange()
  }

  async function remove() {
    await fetch(`/api/memories/${memory.id}`, { method: 'DELETE' })
    onChange()
  }

  const meta = TYPE_META[memory.type]
  return (
    <div className="bg-white border border-zinc-200 rounded-xl px-4 py-3 group">
      <div className="flex items-start gap-3">
        <span className={`shrink-0 mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded ${meta.color}`}>{meta.label}</span>
        {editing ? (
          <div className="flex-1">
            <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={3} autoFocus
              className="w-full text-[13px] border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-y" />
            <div className="flex gap-2 mt-1.5">
              <button onClick={async () => { await patch({ content: draft }); setEditing(false) }}
                className="flex items-center gap-1 text-[11px] bg-green-600 text-white rounded px-2 py-1"><Check className="w-3 h-3" />保存</button>
              <button onClick={() => { setDraft(memory.content); setEditing(false) }}
                className="flex items-center gap-1 text-[11px] border border-zinc-200 text-zinc-500 rounded px-2 py-1"><X className="w-3 h-3" />取消</button>
            </div>
          </div>
        ) : (
          <p className="flex-1 text-[13px] text-zinc-700 leading-relaxed">{memory.content}</p>
        )}
        <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => patch({ visibility: memory.visibility === 'public' ? 'private' : 'public' })}
            className="p-1.5 rounded hover:bg-zinc-100" title={memory.visibility === 'public' ? '公开（点击设为私密）' : '私密（点击设为公开）'}>
            {memory.visibility === 'public'
              ? <Globe className="w-3.5 h-3.5 text-green-500" />
              : <Lock className="w-3.5 h-3.5 text-zinc-400" />}
          </button>
          <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-zinc-100" title="编辑">
            <Pencil className="w-3.5 h-3.5 text-zinc-400" />
          </button>
          <button onClick={remove} className="p-1.5 rounded hover:bg-red-50" title="删除">
            <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-1.5 pl-[52px]">
        <span className="text-[10px] text-zinc-400">{memory.source}{memory.source_detail ? ` · ${memory.source_detail}` : ''} · {memory.created_at.slice(0, 16)}</span>
        <span className={`text-[10px] ${memory.visibility === 'public' ? 'text-green-500' : 'text-zinc-400'}`}>
          {memory.visibility === 'public' ? '公开' : '私密'}
        </span>
      </div>
    </div>
  )
}

function AddMemoryForm({ onAdded }: { onAdded: () => void }) {
  const [type, setType] = useState<MemoryType>('V')
  const [content, setContent] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')

  async function submit() {
    if (!content.trim()) return
    await fetch('/api/memories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content, visibility, source: '手动' }),
    })
    setContent('')
    onAdded()
  }

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 mb-4 space-y-3">
      <div className="flex gap-1.5">
        {(['V', 'M', 'F', 'P', 'S', 'Q'] as MemoryType[]).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`text-[11px] px-2 py-1 rounded transition-colors ${type === t ? TYPE_META[t].color + ' font-semibold' : 'bg-zinc-50 text-zinc-400'}`}>
            {TYPE_META[t].label}
          </button>
        ))}
        <button onClick={() => setVisibility(v => v === 'public' ? 'private' : 'public')}
          className="ml-auto flex items-center gap-1 text-[11px] text-zinc-500 border border-zinc-200 rounded px-2 py-1">
          {visibility === 'public' ? <Globe className="w-3 h-3 text-green-500" /> : <Lock className="w-3 h-3" />}
          {visibility === 'public' ? '公开' : '私密'}
        </button>
      </div>
      <textarea value={content} onChange={e => setContent(e.target.value)} rows={2}
        placeholder={type === 'Q' ? '要问自己的问题…' : '条目内容…'}
        className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-zinc-200" />
      <button onClick={submit} disabled={!content.trim()}
        className="bg-zinc-900 text-white text-xs rounded-lg px-4 py-2 hover:bg-zinc-700 disabled:opacity-40">添加</button>
    </div>
  )
}

// ─── 待访谈队列 ────────────────────────────────────────────────────────────────

function InterviewTab() {
  const [questions, setQuestions] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [newQ, setNewQ] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/memories?type=Q')
    setQuestions(await res.json())
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  async function addQuestion() {
    if (!newQ.trim()) return
    await fetch('/api/memories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'Q', content: newQ.trim(), source: '手动', visibility: 'private' }),
    })
    setNewQ('')
    load()
  }

  const pending = questions.filter(q => q.question_status === 'pending')
  const answered = questions.filter(q => q.question_status === 'answered')

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input value={newQ} onChange={e => setNewQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && addQuestion()}
          placeholder="手动添加一个想让分身问你的问题…"
          className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200" />
        <button onClick={addQuestion} disabled={!newQ.trim()}
          className="shrink-0 bg-zinc-900 text-white text-sm rounded-xl px-4 hover:bg-zinc-700 disabled:opacity-40">入队</button>
      </div>

      {loading ? (
        <div className="py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-300 mx-auto" /></div>
      ) : (
        <>
          <section>
            <h3 className="text-xs font-semibold text-amber-600 mb-2">待回答（{pending.length}）——下次对话时分身会自然地问出来</h3>
            {pending.length === 0
              ? <p className="text-sm text-zinc-400 py-3">队列为空</p>
              : <div className="space-y-2">{pending.map(q => <QuestionRow key={q.id} q={q} onChange={load} />)}</div>}
          </section>
          {answered.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-zinc-400 mb-2">已回答（{answered.length}）</h3>
              <div className="space-y-2 opacity-60">{answered.map(q => <QuestionRow key={q.id} q={q} onChange={load} />)}</div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function QuestionRow({ q, onChange }: { q: Memory; onChange: () => void }) {
  return (
    <div className="flex items-start gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-3 group">
      <HelpCircle className={`shrink-0 w-4 h-4 mt-0.5 ${q.question_status === 'pending' ? 'text-amber-400' : 'text-green-400'}`} />
      <div className="flex-1">
        <p className="text-[13px] text-zinc-700 leading-relaxed">{q.content}</p>
        <p className="text-[10px] text-zinc-400 mt-1">{q.source} · {q.created_at.slice(0, 16)}</p>
      </div>
      <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {q.question_status === 'pending' && (
          <button onClick={async () => {
            await fetch(`/api/memories/${q.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_status: 'answered' }) })
            onChange()
          }} className="p-1.5 rounded hover:bg-green-50" title="标记已回答">
            <Check className="w-3.5 h-3.5 text-green-500" />
          </button>
        )}
        <button onClick={async () => {
          await fetch(`/api/memories/${q.id}`, { method: 'DELETE' })
          onChange()
        }} className="p-1.5 rounded hover:bg-red-50" title="删除">
          <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
        </button>
      </div>
    </div>
  )
}

// ─── 留言收件箱 ────────────────────────────────────────────────────────────────

function InboxTab() {
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setMessages(await (await fetch('/api/inbox')).json())
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  async function markRead(id: string) {
    await fetch('/api/inbox', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    load()
  }

  if (loading) return <div className="py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-300 mx-auto" /></div>
  if (!messages.length) return <p className="py-12 text-center text-sm text-zinc-400">还没有访客留言</p>

  return (
    <div className="space-y-2">
      {messages.map(m => (
        <div key={m.id} className={`flex items-start gap-3 rounded-xl px-4 py-3 border ${m.is_read ? 'bg-zinc-50 border-zinc-100' : 'bg-white border-green-200'}`}>
          {!m.is_read && <span className="shrink-0 w-2 h-2 rounded-full bg-green-500 mt-1.5" />}
          <div className="flex-1">
            <p className={`text-[13px] leading-relaxed ${m.is_read ? 'text-zinc-500' : 'text-zinc-800'}`}>{m.content}</p>
            <p className="text-[10px] text-zinc-400 mt-1">{m.created_at.slice(0, 16)}</p>
          </div>
          {!m.is_read && (
            <button onClick={() => markRead(m.id)} className="shrink-0 text-[11px] text-green-600 hover:underline">标记已读</button>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── 访客会话日志 ──────────────────────────────────────────────────────────────

function SessionsTab() {
  const [sessions, setSessions] = useState<(VisitorSession & { message_count: number; preview: string | null })[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [messages, setMessages] = useState<VisitorMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/board/sessions').then(r => r.json()).then(s => { setSessions(s); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!selected) return
    fetch(`/api/board/sessions?session_id=${selected}`).then(r => r.json()).then(setMessages)
  }, [selected])

  if (loading) return <div className="py-12 text-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-300 mx-auto" /></div>
  if (!sessions.length) return <p className="py-12 text-center text-sm text-zinc-400">还没有访客来聊过。把 /board 链接发给朋友试试。</p>

  return (
    <div className="grid grid-cols-[280px_1fr] gap-4">
      <div className="space-y-2">
        {sessions.map(s => (
          <button key={s.id} onClick={() => setSelected(s.id)}
            className={`w-full text-left rounded-xl border px-3.5 py-3 transition-colors ${
              selected === s.id ? 'border-zinc-800 bg-white' : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}>
            <p className="text-[12.5px] text-zinc-700 truncate">{s.preview ?? '（空会话）'}</p>
            <p className="text-[10px] text-zinc-400 mt-1">{s.message_count} 条消息 · {s.last_active_at.slice(0, 16)}</p>
          </button>
        ))}
      </div>
      <div className="bg-white border border-zinc-200 rounded-xl p-4 min-h-[300px]">
        {!selected ? (
          <p className="text-sm text-zinc-400 text-center py-12">选择左侧会话查看记录</p>
        ) : (
          <div className="space-y-3">
            {messages.map(m => (
              <div key={m.id} className={`text-[13px] leading-relaxed ${m.role === 'user' ? 'text-zinc-800' : 'text-zinc-500 pl-4 border-l-2 border-zinc-100'}`}>
                <span className="text-[10px] font-semibold text-zinc-400 block mb-0.5">{m.role === 'user' ? '访客' : '分身'}</span>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
