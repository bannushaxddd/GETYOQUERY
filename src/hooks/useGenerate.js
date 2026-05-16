import { useState, useRef } from 'react'

function sanitizeError(msg) {
  if (!msg || typeof msg !== 'string') return 'Generation failed'
  if (msg.startsWith('Gemini API error')) {
    const jsonStart = msg.indexOf('{')
    if (jsonStart !== -1) {
      try {
        const j = JSON.parse(msg.slice(jsonStart))
        const m = j?.error?.message
        if (m) return m.split('\n')[0]
      } catch { /* use shortened message below */ }
    }
  }
  return msg.length > 280 ? msg.slice(0, 280) + '…' : msg
}

export function useGenerate(token) {
  const [status, setStatus]           = useState('idle')
  const [streamedTokens, setStreamed] = useState('')
  const [result, setResult]           = useState(null)
  const [error, setError]             = useState(null)
  const abortRef = useRef(null)

  async function generate(payload) {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setStatus('streaming'); setStreamed(''); setResult(null); setError(null)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(sanitizeError(err.error || `Server error ${res.status}`))
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop()
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6))
          if (data.error) throw new Error(sanitizeError(data.error))
          if (data.token) setStreamed(t => t + data.token)
          if (data.done)  { setResult(data.result); setStatus('done') }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(sanitizeError(err.message)); setStatus('error')
    }
  }

  function cancel() { abortRef.current?.abort(); setStatus('idle') }
  function reset()  { setStatus('idle'); setStreamed(''); setResult(null); setError(null) }

  return { status, streamedTokens, result, error, generate, cancel, reset }
}
