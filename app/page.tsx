'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Brain, Users, HelpCircle, Inbox, Loader2, MessageCircle, ChevronRight } from 'lucide-react'
import { OwnerNav } from '@/components/OwnerNav'
import { useOwnerGuard } from '@/components/useOwnerGuard'
import { TYPE_META, type Memory, type InboxMessage, type MemoryType } from '@/types'

interface Stats {
  memoryCount: number
  memoryByType: Record<string, number>
  visitorSessionCount: number
  pendingQuestions: Memory[]
  unreadInboxCount: number
  recentInbox: InboxMessage[]
  topTopics: { topic: string; count: number }[]
}

export default function DashboardPage() {
  const ready = useOwnerGuard()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    if (!ready) return
    fetch('/api/stats').then(r => r.json()).then(setStats)
  }, [ready])

  if (!ready || !stats) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>
  }

  const personaCount = ['V', 'M', 'F', 'P', 'S'].reduce((a, t) => a + (stats.memoryByType[t] ?? 0), 0)

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <OwnerNav />
      <main className="flex-1 px-8 py-8 max-w-5xl">
        <h2 className="text-lg font-bold text-zinc-900 mb-6">仪表盘</h2>

        {/* 核心指标 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard icon={Brain} label="人格层条目" value={personaCount} color="text-purple-600 bg-purple-50" href="/memory" />
          <StatCard icon={Users} label="访客会话" value={stats.visitorSessionCount} color="text-blue-600 bg-blue-50" href="/memory?tab=sessions" />
          <StatCard icon={HelpCircle} label="待访谈问题" value={stats.pendingQuestions.length} color="text-amber-600 bg-amber-50" href="/memory?tab=interview" />
          <StatCard icon={Inbox} label="未读留言" value={stats.unreadInboxCount} color="text-green-600 bg-green-50" href="/memory?tab=inbox" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 人格层构成 */}
          <section className="bg-white rounded-2xl border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-zinc-700 mb-4">人格层构成</h3>
            {personaCount === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-zinc-400 mb-3">人格层还是空的</p>
                <Link href="/feed" className="text-sm text-blue-600 hover:underline">去喂养第一批资料 →</Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {(['V', 'M', 'F', 'P', 'S'] as MemoryType[]).map(t => {
                  const n = stats.memoryByType[t] ?? 0
                  const pct = personaCount ? (n / personaCount) * 100 : 0
                  return (
                    <div key={t} className="flex items-center gap-3">
                      <span className={`shrink-0 w-16 text-[11px] px-1.5 py-0.5 rounded text-center font-medium ${TYPE_META[t].color}`}>{TYPE_META[t].label}</span>
                      <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-zinc-800 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="shrink-0 w-8 text-right text-xs text-zinc-500 tabular-nums">{n}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* 待访谈队列 */}
          <section className="bg-white rounded-2xl border border-zinc-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-700">待访谈队列</h3>
              <Link href="/chat" className="text-xs text-blue-600 hover:underline flex items-center gap-0.5">
                去回答 <MessageCircle className="w-3 h-3" />
              </Link>
            </div>
            {stats.pendingQuestions.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">队列为空——访客问到你没讲过的问题时会自动出现</p>
            ) : (
              <ul className="space-y-2">
                {stats.pendingQuestions.slice(0, 5).map(q => (
                  <li key={q.id} className="text-[13px] text-zinc-700 bg-amber-50/60 border border-amber-100 rounded-lg px-3 py-2 leading-snug">
                    {q.content}
                    <span className="block text-[10px] text-zinc-400 mt-1">{q.source} · {q.created_at.slice(0, 16)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 留言收件箱 */}
          <section className="bg-white rounded-2xl border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-zinc-700 mb-4">最近留言</h3>
            {stats.recentInbox.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">暂无留言</p>
            ) : (
              <ul className="space-y-2">
                {stats.recentInbox.map(m => (
                  <li key={m.id} className={`text-[13px] rounded-lg px-3 py-2 leading-snug border ${m.is_read ? 'text-zinc-500 bg-zinc-50 border-zinc-100' : 'text-zinc-800 bg-green-50/60 border-green-100'}`}>
                    {m.content}
                    <span className="block text-[10px] text-zinc-400 mt-1">{m.created_at.slice(0, 16)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 被问最多的话题 */}
          <section className="bg-white rounded-2xl border border-zinc-200 p-5">
            <h3 className="text-sm font-semibold text-zinc-700 mb-4">访客最关心的话题</h3>
            {stats.topTopics.length === 0 ? (
              <p className="text-sm text-zinc-400 py-4 text-center">还没有访客提问数据</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.topTopics.map(t => (
                  <span key={t.topic} className="text-[12px] bg-zinc-100 text-zinc-700 rounded-full px-3 py-1">
                    {t.topic} <span className="text-zinc-400">×{t.count}</span>
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, href }: {
  icon: typeof Brain; label: string; value: number; color: string; href: string
}) {
  return (
    <Link href={href} className="bg-white rounded-2xl border border-zinc-200 p-4 hover:border-zinc-300 hover:shadow-sm transition-all group">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-zinc-900 tabular-nums">{value}</p>
      <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-0.5">
        {label} <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </p>
    </Link>
  )
}
