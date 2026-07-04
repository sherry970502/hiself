'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Send, Loader2 } from 'lucide-react'

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Props {
  onSend: (text: string) => void
  disabled?: boolean
  placeholder?: string
}

/** 语音优先的输入框：点击麦克风录音（Web Speech API zh-CN），或直接打字 */
export function VoiceComposer({ onSend, disabled, placeholder }: Props) {
  const [text, setText] = useState('')
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef<any>(null)
  const textRef = useRef(text)
  textRef.current = text

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { setSpeechSupported(false); return }
    const rec = new SR()
    rec.lang = 'zh-CN'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e: any) => {
      let finalText = ''
      let interimText = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += r[0].transcript
        else interimText += r[0].transcript
      }
      if (finalText) setText(t => t + finalText)
      setInterim(interimText)
    }
    rec.onend = () => { setListening(false); setInterim('') }
    rec.onerror = () => { setListening(false); setInterim('') }
    recognitionRef.current = rec
    return () => { try { rec.stop() } catch { /* noop */ } }
  }, [])

  const toggleListening = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
    if (listening) {
      rec.stop()
      setListening(false)
    } else {
      try { rec.start(); setListening(true) } catch { /* already started */ }
    }
  }, [listening])

  function send() {
    const t = (text + interim).trim()
    if (!t || disabled) return
    if (listening) { try { recognitionRef.current?.stop() } catch { /* noop */ } }
    setText('')
    setInterim('')
    onSend(t)
  }

  return (
    <div className="flex items-end gap-2">
      {speechSupported && (
        <button
          onClick={toggleListening}
          disabled={disabled}
          className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            listening
              ? 'bg-red-500 text-white shadow-lg shadow-red-200 animate-pulse'
              : 'bg-zinc-900 text-white hover:bg-zinc-700'
          } disabled:opacity-40`}
          title={listening ? '停止录音' : '按一下开始说话'}
        >
          {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>
      )}
      <div className="flex-1 relative">
        <textarea
          value={text + interim}
          onChange={e => { setText(e.target.value); setInterim('') }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          rows={1}
          placeholder={listening ? '正在听…直接说' : (placeholder ?? '说点什么，或按麦克风说话')}
          className={`w-full resize-none rounded-2xl border px-4 py-3 text-[14px] leading-relaxed focus:outline-none focus:ring-2 transition-all max-h-32 ${
            listening ? 'border-red-300 ring-2 ring-red-100 bg-red-50/40' : 'border-zinc-200 focus:ring-zinc-200 bg-white'
          }`}
          style={{ minHeight: 44 }}
        />
      </div>
      <button
        onClick={send}
        disabled={disabled || !(text + interim).trim()}
        className="shrink-0 w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-30 transition-all"
      >
        {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </div>
  )
}
