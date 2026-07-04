'use client'
import { useEffect, useState, useCallback } from 'react'
import { Loader2, BrainCircuit, Undo2, X } from 'lucide-react'
import { OwnerNav } from '@/components/OwnerNav'
import { useOwnerGuard } from '@/components/useOwnerGuard'
import { VoiceComposer } from '@/components/VoiceComposer'
import { ChatThread, type ThreadMessage } from '@/components/ChatThread'
import { TYPE_META, type Memory } from '@/types'

export default function OwnerChatPage() {
  const ready = useOwnerGuard()
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [streaming, setStreaming] = useState('')
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  // 沉淀轻提示（可撤销）
  const [sediments, setSediments] = useState<Memory[]>([])

  useEffect(() => {
    if (!ready) return
    fetch('/api/chat').then(r => r.json()).then(history => {
      setMessages(history)
      setLoaded(true)
    })
  }, [ready])

  const send = useCallback(async (text: string) => {
    setBusy(true)
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }])
    setStreaming('')

    // 并行：流式回复 + 语音沉淀抽取
    const extractPromise = fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ utterance: text, source: '语音对话' }),
    }).then(r => r.json()).catch(() => ({ created: [] }))

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    })
    if (res.ok && res.body) {
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value)
        setStreaming(full)
      }
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: full }])
      setStreaming('')
    }

    const { created } = await extractPromise
    if (created?.length) setSediments(prev => [...prev, ...created])
    setBusy(false)
  }, [])

  async function undoSediment(id: string) {
    await fetch(`/api/memories/${id}`, { method: 'DELETE' })
    setSediments(prev => prev.filter(s => s.id !== id))
  }

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>
  }

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <OwnerNav />
      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
        <div className="shrink-0 px-4 py-4 border-b border-zinc-100 bg-zinc-50/80 backdrop-blur-sm">
          <h2 className="text-sm font-bold text-zinc-800">和分身对话</h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">语音或文字都可以。你说的观点会被自动记住，它也会主动问你问题。</p>
        </div>

        {!loaded ? (
          <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>
        ) : (
          <ChatThread
            messages={messages}
            streaming={streaming}
            emptyHint={
              <div className="text-center max-w-sm">
                <BrainCircuit className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
                <p className="text-sm text-zinc-500 leading-relaxed">
                  问它「我对 X 的看法是什么」做第二大脑查询；<br />
                  或者随便聊聊今天的思考，它会追问并把你的观点沉淀下来。
                </p>
              </div>
            }
          />
        )}

        {/* 沉淀轻提示 */}
        {sediments.length > 0 && (
          <div className="shrink-0 px-4 pb-2 space-y-1.5 max-h-40 overflow-y-auto">
            {sediments.map(s => (
              <div key={s.id} className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2 text-[12px]">
                <span className={`shrink-0 px-1.5 py-px rounded text-[10px] font-medium ${TYPE_META[s.type].color}`}>{TYPE_META[s.type].label}</span>
                <span className="flex-1 text-zinc-700 truncate">已记住：{s.content}</span>
                <button onClick={() => undoSediment(s.id)} className="shrink-0 flex items-center gap-0.5 text-purple-500 hover:text-purple-700" title="撤销记忆">
                  <Undo2 className="w-3 h-3" />撤销
                </button>
                <button onClick={() => setSediments(prev => prev.filter(x => x.id !== s.id))} className="shrink-0 text-zinc-300 hover:text-zinc-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="shrink-0 px-4 pb-5 pt-2">
          <VoiceComposer onSend={send} disabled={busy} />
        </div>
      </main>
    </div>
  )
}
