'use client'
import { useState, useRef } from 'react'
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, ClipboardPaste } from 'lucide-react'
import { OwnerNav } from '@/components/OwnerNav'
import { useOwnerGuard } from '@/components/useOwnerGuard'

interface IngestResult { source: string; count: number; error?: string }

export default function FeedPage() {
  const ready = useOwnerGuard()
  const [pasteText, setPasteText] = useState('')
  const [pasteSource, setPasteSource] = useState('')
  const [busy, setBusy] = useState(false)
  const [results, setResults] = useState<IngestResult[]>([])
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files)
    if (!list.length) return
    setBusy(true)
    const formData = new FormData()
    for (const f of list) formData.append('files', f)
    try {
      const res = await fetch('/api/ingest', { method: 'POST', body: formData })
      const data = await res.json()
      setResults(prev => [...(data.results ?? []), ...prev])
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function submitPaste() {
    if (!pasteText.trim()) return
    setBusy(true)
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText, source: pasteSource.trim() || '文本粘贴' }),
      })
      const data = await res.json()
      setResults(prev => [...(data.results ?? []), ...prev])
      setPasteText('')
      setPasteSource('')
    } finally {
      setBusy(false)
    }
  }

  if (!ready) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-zinc-300" /></div>
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <OwnerNav />
      <main className="flex-1 px-8 py-8 max-w-3xl">
        <h2 className="text-lg font-bold text-zinc-900 mb-1">喂养管道</h2>
        <p className="text-xs text-zinc-400 mb-6">导入 → 切分 → AI 分型打标（V/M/F/P/S）→ 入库。涉及隐私的内容会默认标为 private。</p>

        {/* 文件上传 */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); uploadFiles(e.dataTransfer.files) }}
          onClick={() => fileRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-all mb-6 ${
            dragging ? 'border-blue-400 bg-blue-50/50' : 'border-zinc-200 bg-white hover:border-zinc-300'
          }`}
        >
          <Upload className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-sm text-zinc-600 font-medium">拖入文件，或点击选择</p>
          <p className="text-[11px] text-zinc-400 mt-1">.md / .txt / .docx / .pdf，支持批量（文章、逐字稿、笔记、聊天记录导出）</p>
          <input ref={fileRef} type="file" multiple accept=".md,.txt,.docx,.pdf" className="hidden"
            onChange={e => e.target.files && uploadFiles(e.target.files)} />
        </div>

        {/* 文本粘贴 */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardPaste className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-700">随手贴一段</h3>
          </div>
          <textarea
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
            rows={5}
            placeholder="贴一段你的想法、一篇文章、一段聊天记录…"
            className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-200 resize-y"
          />
          <div className="flex items-center gap-3 mt-3">
            <input
              value={pasteSource}
              onChange={e => setPasteSource(e.target.value)}
              placeholder="来源备注（可选）"
              className="flex-1 rounded-xl border border-zinc-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
            <button
              onClick={submitPaste}
              disabled={busy || !pasteText.trim()}
              className="shrink-0 flex items-center gap-1.5 bg-zinc-900 text-white rounded-xl px-5 py-2 text-sm hover:bg-zinc-700 disabled:opacity-40 transition-colors"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              喂给分身
            </button>
          </div>
        </div>

        {/* 处理结果 */}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-zinc-500 mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            正在切分、分型打标、入库…（文件多时需要一会儿）
          </div>
        )}
        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">导入记录（本次会话）</h3>
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl px-4 py-3">
                {r.error
                  ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  : <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
                <FileText className="w-4 h-4 text-zinc-300 shrink-0" />
                <span className="flex-1 text-sm text-zinc-700 truncate">{r.source}</span>
                <span className="shrink-0 text-xs text-zinc-400">
                  {r.error ? r.error : `${r.count} 条入库`}
                </span>
              </div>
            ))}
            <a href="/memory" className="inline-block text-sm text-blue-600 hover:underline mt-2">去记忆管理页查看 →</a>
          </div>
        )}
      </main>
    </div>
  )
}
