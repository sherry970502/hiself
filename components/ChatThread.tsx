'use client'
import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { Sparkles } from 'lucide-react'

export interface ThreadMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export function ChatThread({ messages, streaming, emptyHint }: {
  messages: ThreadMessage[]
  streaming?: string
  emptyHint?: React.ReactNode
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streaming])

  if (!messages.length && !streaming) {
    return <div className="flex-1 flex items-center justify-center p-8">{emptyHint}</div>
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
      {messages.map(m => <Bubble key={m.id} role={m.role} content={m.content} />)}
      {streaming !== undefined && streaming !== '' && <Bubble role="assistant" content={streaming} pulsing />}
      <div ref={bottomRef} />
    </div>
  )
}

function Bubble({ role, content, pulsing }: { role: 'user' | 'assistant'; content: string; pulsing?: boolean }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[78%] bg-zinc-900 text-white rounded-2xl rounded-br-md px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex gap-2.5">
      <div className={`shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mt-0.5 ${pulsing ? 'animate-pulse' : ''}`}>
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="max-w-[82%] text-[14px] leading-relaxed text-zinc-800 prose prose-sm prose-zinc max-w-none prose-p:my-2 prose-li:my-0.5">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  )
}
