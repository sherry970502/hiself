'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/** Owner 页面守卫：未登录跳转 /login */
export function useOwnerGuard(): boolean {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    fetch('/api/auth').then(r => r.json()).then(({ isOwner }) => {
      if (!isOwner) router.replace('/login')
      else setReady(true)
    })
  }, [router])
  return ready
}
