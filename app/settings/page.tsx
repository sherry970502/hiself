'use client'
import { useEffect, useState } from 'react'
import { Loader2, KeyRound, CheckCircle2, AlertTriangle, Zap, ZapOff } from 'lucide-react'
import { OwnerNav } from '@/components/OwnerNav'
import { useOwnerGuard } from '@/components/useOwnerGuard'

export default function SettingsPage() {
  const ready = useOwnerGuard()
  const [status, setStatus] = useState<{ hasKey: boolean; keyMasked: string | null; model?: string } | null>(null)
  const [keyInput, setKeyInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'warn'; text: string } | null>(null)

  async function load() {
    setStatus(await (await fetch('/api/settings')).json())
  }
  useEffect(() => { if (ready) load() }, [ready])

  async function save() {
    if (!keyInput.trim()) return
    setBusy(true)
    setMessage(null)
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anthropic_api_key: keyInput.trim() }),
    })
    const data = await res.json()
    setBusy(false)
    setKeyInput('')
    if (data.verified) setMessage({ kind: 'ok', text: 'key 已保存并验证成功，分身已接入真实 AI。' })
    else setMessage({ kind: 'warn', text: data.warning ?? data.error ?? '保存失败' })
    load()
  }

  if (!ready || !status) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <OwnerNav />
      <main className="flex-1 px-8 py-8 max-w-2xl">
        <h2 className="text-lg font-bold text-zinc-900 mb-6">设置</h2>

        {/* 运行模式状态 */}
        <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 mb-6 ${
          status.hasKey ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
        }`}>
          {status.hasKey
            ? <Zap className="w-5 h-5 text-green-600 shrink-0" />
            : <ZapOff className="w-5 h-5 text-amber-500 shrink-0" />}
          <div>
            <p className="text-sm font-semibold text-zinc-800">
              {status.hasKey ? '真实 AI 模式' : 'Mock 演示模式'}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              {status.hasKey
                ? `当前 key：${status.keyMasked} · 模型：${status.model ?? ''}（Claude Sonnet 4.6）`
                : '未配置 API key，所有 AI 能力为本地模拟。配置后立即切换，无需重启。'}
            </p>
          </div>
        </div>

        {/* API key 配置 */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-700">Anthropic API Key</h3>
          </div>
          <p className="text-[11px] text-zinc-400 mb-4">从 console.anthropic.com 获取。保存在服务器数据库，只有你可见。</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              placeholder="sk-ant-…"
              className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
            <button
              onClick={save}
              disabled={busy || !keyInput.trim()}
              className="shrink-0 flex items-center gap-1.5 bg-zinc-900 text-white rounded-xl px-5 text-sm hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {busy ? '验证中…' : '保存并验证'}
            </button>
          </div>
          {message && (
            <div className={`flex items-start gap-2 mt-3 text-xs rounded-lg px-3 py-2 ${
              message.kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
            }`}>
              {message.kind === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-px" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />}
              {message.text}
            </div>
          )}
        </div>

        <p className="text-[11px] text-zinc-400 mt-6 leading-relaxed">
          其他配置项通过环境变量管理：<code className="bg-zinc-100 px-1 rounded">OWNER_TOKEN</code>（登录口令，部署后务必修改）、
          <code className="bg-zinc-100 px-1 rounded">DB_PATH</code>（数据库位置）。
        </p>
      </main>
    </div>
  )
}
