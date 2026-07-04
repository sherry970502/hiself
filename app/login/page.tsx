'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const router = useRouter()

  async function login() {
    if (!token.trim()) return
    setBusy(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    setBusy(false)
    if (res.ok) router.push('/')
    else setError('口令错误')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-zinc-900">HiSelf</h1>
            <p className="text-xs text-zinc-400">遇见更好的自己</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 space-y-4 shadow-sm">
          <input
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            placeholder="输入 Owner 口令"
            autoFocus
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={login}
            disabled={busy || !token.trim()}
            className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white rounded-xl py-3 text-sm font-medium hover:bg-zinc-700 disabled:opacity-40 transition-colors"
          >
            进入控制台 <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-zinc-400 text-center">默认口令 owner123，可通过环境变量 OWNER_TOKEN 修改</p>
        </div>
      </div>
    </div>
  )
}
