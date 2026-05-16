import { useState, useEffect, useCallback } from 'react'

export function useHistory(apiFetch, user) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchHistory = useCallback(async (q = '') => {
    if (!user) return
    setLoading(true)
    try {
      const url = q ? `/api/history?q=${encodeURIComponent(q)}` : '/api/history'
      const res = await apiFetch(url)
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch {}
    setLoading(false)
  }, [user, apiFetch])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  async function addEntry(entry) {
    try {
      const res = await apiFetch('/api/history', {
        method: 'POST',
        body: JSON.stringify({
          prompt:       entry.prompt,
          schema_sql:   entry.schema,
          dialect:      entry.dialect,
          sql_result:   entry.sql,
          explanation:  entry.explanation || null,
          optimization: entry.optimization || null,
          warnings:     entry.warnings || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(prev => [data.entry, ...prev])
      }
    } catch {}
  }

  async function removeEntry(id) {
    setHistory(prev => prev.filter(e => e.id !== id))
    await apiFetch(`/api/history/${id}`, { method: 'DELETE' })
  }

  async function clearAll() {
    setHistory([])
    await apiFetch('/api/history', { method: 'DELETE' })
  }

  return { history, loading, addEntry, removeEntry, clearAll, search: fetchHistory }
}
