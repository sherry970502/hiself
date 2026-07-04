'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, MessageCircle, Database, Brain, Settings, ExternalLink, LogOut } from 'lucide-react'

const NAV = [
  { href: '/', label: '仪表盘', icon: LayoutDashboard },
  { href: '/chat', label: '对话', icon: MessageCircle },
  { href: '/feed', label: '喂养', icon: Database },
  { href: '/memory', label: '记忆', icon: Brain },
  { href: '/settings', label: '设置', icon: Settings },
]

export function OwnerNav() {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <aside className="w-52 shrink-0 h-screen sticky top-0 border-r border-zinc-200 bg-white flex flex-col">
      <div className="px-5 py-5 border-b border-zinc-100">
        <h1 className="font-bold text-zinc-900 text-[15px]">HiSelf</h1>
        <p className="text-[11px] text-zinc-400 mt-0.5">遇见更好的自己 · 控制台</p>
      </div>
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors ${
                active ? 'bg-zinc-900 text-white font-medium' : 'text-zinc-600 hover:bg-zinc-100'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-2 py-3 border-t border-zinc-100 space-y-0.5">
        <a href="/board" target="_blank"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-blue-600 hover:bg-blue-50 transition-colors">
          <ExternalLink className="w-4 h-4" />
          公开看板
        </a>
        <button onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors">
          <LogOut className="w-4 h-4" />
          退出
        </button>
      </div>
    </aside>
  )
}
