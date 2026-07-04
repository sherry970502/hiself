'use client'
import { useEffect, useState } from 'react'
import { Loader2, Check, MessageCircleQuestion, X } from 'lucide-react'

interface BankQuestion {
  id: string
  category: string
  text: string
  status: null | 'pending' | 'answered'
}
interface Category { key: string; label: string; emoji: string }

export function QuestionBankPanel({ onAsk, onClose }: {
  onAsk: (message: { id: string; role: 'assistant'; content: string }) => void
  onClose: () => void
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [questions, setQuestions] = useState<BankQuestion[]>([])
  const [activeCat, setActiveCat] = useState<string>('viewpoint')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    const data = await (await fetch('/api/question-bank')).json()
    setCategories(data.categories)
    setQuestions(data.questions)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function ask(q: BankQuestion) {
    setBusyId(q.id)
    const res = await fetch('/api/question-bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: q.id }),
    })
    if (res.ok) {
      const { message } = await res.json()
      onAsk(message)
      setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, status: x.status ?? 'pending' } : x))
    }
    setBusyId(null)
  }

  const visible = questions.filter(q => q.category === activeCat)
  const answeredCount = questions.filter(q => q.status === 'answered').length

  return (
    <aside className="w-80 shrink-0 border-l border-zinc-200 bg-white flex flex-col h-full">
      <div className="shrink-0 px-4 py-3.5 border-b border-zinc-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 flex items-center gap-1.5">
            <MessageCircleQuestion className="w-4 h-4 text-purple-500" />问题库
          </h3>
          <p className="text-[10px] text-zinc-400 mt-0.5">点一个问题，分身来问你 · 已答 {answeredCount}/{questions.length}</p>
        </div>
        <button onClick={onClose} className="text-zinc-300 hover:text-zinc-500"><X className="w-4 h-4" /></button>
      </div>

      {/* 分类 */}
      <div className="shrink-0 flex flex-wrap gap-1.5 px-4 py-3 border-b border-zinc-50">
        {categories.map(c => (
          <button key={c.key} onClick={() => setActiveCat(c.key)}
            className={`text-[11px] px-2 py-1 rounded-lg transition-colors ${
              activeCat === c.key ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
            }`}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* 问题列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {loading ? (
          <div className="py-10 text-center"><Loader2 className="w-4 h-4 animate-spin text-zinc-300 mx-auto" /></div>
        ) : visible.map(q => (
          <button key={q.id}
            onClick={() => !q.status && ask(q)}
            disabled={!!busyId || q.status === 'answered'}
            className={`w-full text-left rounded-xl border px-3.5 py-2.5 text-[12.5px] leading-relaxed transition-all group ${
              q.status === 'answered'
                ? 'border-green-100 bg-green-50/50 text-zinc-400'
                : q.status === 'pending'
                  ? 'border-amber-200 bg-amber-50/50 text-zinc-600'
                  : 'border-zinc-150 border-zinc-200 text-zinc-700 hover:border-purple-300 hover:bg-purple-50/40 cursor-pointer'
            }`}>
            <span className="flex items-start gap-2">
              {q.status === 'answered' && <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />}
              {busyId === q.id && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 mt-0.5" />}
              <span className="flex-1">{q.text}</span>
            </span>
            {q.status === 'pending' && <span className="block text-[10px] text-amber-500 mt-1">已在队列，等你回答</span>}
            {!q.status && <span className="block text-[10px] text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1">点击让分身问我 →</span>}
          </button>
        ))}
      </div>
    </aside>
  )
}
