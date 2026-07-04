'use client'
import { useState, useCallback, useEffect } from 'react'
import { Sparkles, MailPlus, X, Check } from 'lucide-react'
import { VoiceComposer } from '@/components/VoiceComposer'
import { ChatThread, type ThreadMessage } from '@/components/ChatThread'
import { EMPTY_PROFILE, type BoardProfile } from '@/types'

export default function BoardPage() {
  const [messages, setMessages] = useState<ThreadMessage[]>([])
  const [streaming, setStreaming] = useState('')
  const [busy, setBusy] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [showLeaveNote, setShowLeaveNote] = useState(false)
  const [note, setNote] = useState('')
  const [noteSent, setNoteSent] = useState(false)
  const [profile, setProfile] = useState<BoardProfile>(EMPTY_PROFILE)

  useEffect(() => {
    setSessionId(sessionStorage.getItem('board_session'))
    fetch('/api/board/profile').then(r => r.json()).then(setProfile).catch(() => {})
  }, [])

  const send = useCallback(async (text: string) => {
    setBusy(true)
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: text }])
    setStreaming('')
    try {
      const res = await fetch('/api/board/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: '出错了，稍后再试' }))
        setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: error }])
        setBusy(false)
        return
      }
      const sid = res.headers.get('X-Session-Id')
      if (sid) { setSessionId(sid); sessionStorage.setItem('board_session', sid) }
      const reader = res.body!.getReader()
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
    } finally {
      setBusy(false)
    }
  }, [sessionId])

  async function sendNote() {
    if (!note.trim()) return
    await fetch('/api/board/chat', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: note.trim(), sessionId }),
    })
    setNote('')
    setNoteSent(true)
    setTimeout(() => { setShowLeaveNote(false); setNoteSent(false) }, 1600)
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-zinc-50 to-zinc-100">
      {/* 头部 */}
      <header className="shrink-0 px-5 py-4 flex items-center gap-3 max-w-2xl mx-auto w-full">
        <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-purple-200/50 shrink-0">
          {profile.avatar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"><Sparkles className="w-5 h-5 text-white" /></div>}
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-zinc-900 text-[15px]">
            {profile.name || 'HiSelf'}
            <span className="ml-2 text-[11px] font-normal text-zinc-400">{profile.name ? 'AI 分身' : '他的 AI 分身'}</span>
          </h1>
          <p className="text-[11px] text-zinc-400">有什么想问的，直接聊 · 对话对本人可见</p>
        </div>
        <button onClick={() => setShowLeaveNote(true)}
          className="shrink-0 flex items-center gap-1.5 text-xs text-zinc-600 bg-white border border-zinc-200 rounded-full px-3.5 py-2 hover:border-zinc-300 transition-colors">
          <MailPlus className="w-3.5 h-3.5" />给他留言
        </button>
      </header>

      {/* 对话区 */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full overflow-hidden bg-white rounded-t-3xl border border-zinc-200 border-b-0 shadow-sm">
        <ChatThread
          messages={messages}
          streaming={streaming}
          emptyHint={
            <div className="text-center max-w-sm">
              <p className="text-[15px] font-medium text-zinc-700 mb-2">
                {profile.greeting || '你好，我是他的 AI 分身。'}
              </p>
              <p className="text-[13px] text-zinc-400 leading-relaxed mb-5">
                {profile.bio || <>我知道他的观点、方法论和经历。问我任何事——他讲过的我如实转述并展开，他没讲过的我不会瞎编。</>}
              </p>
              {profile.questions.length > 0 && (
                <div className="flex flex-col gap-2 items-stretch">
                  {profile.questions.map((q, i) => (
                    <button key={i} onClick={() => send(q)} disabled={busy}
                      className="text-[13px] text-left text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 hover:border-purple-300 hover:bg-purple-50/50 hover:text-purple-700 transition-all disabled:opacity-40">
                      💬 {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          }
        />
        <div className="shrink-0 px-4 pb-3 pt-2 border-t border-zinc-50">
          <VoiceComposer onSend={send} disabled={busy} placeholder="问点什么…" />
          <p className="text-center text-[10px] text-zinc-300 mt-2.5">
            Powered by <span className="font-semibold text-zinc-400">HiSelf</span> · 遇见更好的自己 ·{' '}
            <a href="https://github.com/sherry970502/hiself" target="_blank" rel="noopener"
              className="text-zinc-400 underline underline-offset-2 hover:text-purple-500 transition-colors">
              想要一个自己的分身？
            </a>
          </p>
        </div>
      </div>

      {/* 留言弹窗 */}
      {showLeaveNote && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setShowLeaveNote(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            {noteSent ? (
              <div className="text-center py-6">
                <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-zinc-700">留言已送达他的收件箱</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-800">给他留言</h3>
                  <button onClick={() => setShowLeaveNote(false)}><X className="w-4 h-4 text-zinc-400" /></button>
                </div>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} autoFocus
                  placeholder="想对他本人说的话…"
                  className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none" />
                <button onClick={sendNote} disabled={!note.trim()}
                  className="w-full mt-3 bg-zinc-900 text-white rounded-xl py-2.5 text-sm hover:bg-zinc-700 disabled:opacity-40 transition-colors">
                  发送
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
