'use client'
import { useEffect, useState, useRef } from 'react'
import { Loader2, Sparkles, Wand2, Save, ExternalLink, Plus, Trash2, ImagePlus, CheckCircle2, AlertTriangle } from 'lucide-react'
import { OwnerNav } from '@/components/OwnerNav'
import { useOwnerGuard } from '@/components/useOwnerGuard'
import { EMPTY_PROFILE, type BoardProfile } from '@/types'

export default function FacadePage() {
  const ready = useOwnerGuard()
  const [profile, setProfile] = useState<BoardProfile>(EMPTY_PROFILE)
  const [loaded, setLoaded] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null)
  const avatarRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!ready) return
    fetch('/api/board/profile').then(r => r.json()).then(p => { setProfile(p); setLoaded(true) })
  }, [ready])

  async function draft() {
    setDrafting(true)
    setMessage(null)
    const res = await fetch('/api/board/profile/suggest', { method: 'POST' })
    const data = await res.json()
    setDrafting(false)
    if (!res.ok) {
      setMessage({ kind: 'warn', text: data.error ?? '起草失败' })
      return
    }
    setProfile(p => ({
      ...p,
      greeting: data.greeting,
      bio: data.bio,
      questions: data.questions,
    }))
    setMessage({ kind: 'ok', text: 'AI 草稿已填入下方——改到你满意，再点保存。' })
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    const res = await fetch('/api/board/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) setMessage({ kind: 'warn', text: data.error ?? '保存失败' })
    else setMessage({ kind: 'ok', text: '已保存，看板即刻生效。' })
  }

  function pickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProfile(p => ({ ...p, avatar: reader.result as string }))
    reader.readAsDataURL(file)
  }

  function setQuestion(i: number, v: string) {
    setProfile(p => {
      const qs = [...p.questions]; qs[i] = v; return { ...p, questions: qs }
    })
  }

  if (!ready || !loaded) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <OwnerNav />
      <main className="flex-1 px-8 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-zinc-900">门面</h2>
          <a href="/board" target="_blank" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            预览看板 <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <p className="text-xs text-zinc-400 mb-6">访客打开看板的第一眼——这是你面对世界的名片。AI 起草，你定稿。</p>

        {/* AI 起草 */}
        <button onClick={draft} disabled={drafting}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all mb-5">
          {drafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {drafting ? 'AI 正在读你的人格层…' : '让 AI 根据我的人格层起草门面'}
        </button>

        {message && (
          <div className={`flex items-start gap-2 text-xs rounded-xl px-3.5 py-2.5 mb-5 ${
            message.kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
          }`}>
            {message.kind === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-px" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />}
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-5">
          {/* 头像 + 称呼 */}
          <div className="flex items-center gap-4">
            <button onClick={() => avatarRef.current?.click()}
              className="shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 border-dashed border-zinc-200 hover:border-purple-300 transition-colors flex items-center justify-center bg-zinc-50 group relative">
              {profile.avatar
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={profile.avatar} alt="头像" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"><Sparkles className="w-6 h-6 text-white" /></div>}
              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <ImagePlus className="w-4 h-4 text-white" />
              </span>
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={pickAvatar} />
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">对外称呼</label>
              <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                placeholder="比如：Sherry / 雪莹"
                className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200" />
            </div>
            {profile.avatar && (
              <button onClick={() => setProfile(p => ({ ...p, avatar: null }))} className="text-[11px] text-zinc-400 hover:text-red-400 shrink-0">清除头像</button>
            )}
          </div>

          {/* 开场白 */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">分身的第一句话</label>
            <textarea value={profile.greeting} onChange={e => setProfile(p => ({ ...p, greeting: e.target.value }))}
              rows={2} placeholder="访客打开看板时，分身说的第一句话…"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none" />
          </div>

          {/* 自我介绍 */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">自我介绍<span className="font-normal ml-2 text-zinc-300">显示在看板上，也会成为分身对外介绍你的口径</span></label>
            <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
              rows={3} placeholder="你是谁、在关注什么、思考的底色…"
              className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-none" />
          </div>

          {/* 推荐问题 */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1.5">开场推荐问题<span className="font-normal ml-2 text-zinc-300">访客一键提问，最多 4 个；只放你讲过的话题</span></label>
            <div className="space-y-2">
              {profile.questions.map((q, i) => (
                <div key={i} className="flex gap-2">
                  <input value={q} onChange={e => setQuestion(i, e.target.value)}
                    className="flex-1 rounded-xl border border-zinc-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200" />
                  <button onClick={() => setProfile(p => ({ ...p, questions: p.questions.filter((_, j) => j !== i) }))}
                    className="shrink-0 text-zinc-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {profile.questions.length < 4 && (
                <button onClick={() => setProfile(p => ({ ...p, questions: [...p.questions, ''] }))}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600">
                  <Plus className="w-3.5 h-3.5" />添加问题
                </button>
              )}
            </div>
          </div>
        </div>

        <button onClick={save} disabled={saving}
          className="mt-5 flex items-center gap-2 bg-zinc-900 text-white rounded-xl px-6 py-2.5 text-sm hover:bg-zinc-700 disabled:opacity-40 transition-colors">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          保存并生效
        </button>
      </main>
    </div>
  )
}
