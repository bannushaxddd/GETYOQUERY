import React, { useState } from 'react'
import s from '../styles/Sidebar.module.css'

function relTime(iso) {
  const d = Date.now() - new Date(iso).getTime()
  if (d < 60000)   return 'just now'
  if (d < 3600000) return `${Math.floor(d/60000)}m ago`
  if (d < 86400000)return `${Math.floor(d/3600000)}h ago`
  return `${Math.floor(d/86400000)}d ago`
}

export default function Sidebar({ history, loading, onLoad, onRemove, onClearAll, onSearch, activeId, user, onLogout }) {
  const [open, setOpen]     = useState(true)
  const [query, setQuery]   = useState('')
  const [confirm, setConfirm] = useState(false)

  function handleSearch(val) {
    setQuery(val)
    onSearch(val)
  }

  if (!open) return (
    <aside className={s.mini}>
      <button className={s.iconBtn} onClick={() => setOpen(true)} title="Open sidebar">☰</button>
    </aside>
  )

  return (
    <aside className={s.sidebar}>
      {/* User info */}
      <div className={s.userRow}>
        <div className={s.avatar}>{user?.name?.[0]?.toUpperCase() || '?'}</div>
        <div className={s.userInfo}>
          <span className={s.userName}>{user?.name}</span>
          <span className={s.userEmail}>{user?.email}</span>
        </div>
        <button className={s.iconBtn} onClick={() => setOpen(false)} title="Collapse">‹</button>
      </div>

      {/* Search */}
      <div className={s.searchWrap}>
        <input
          className={s.search}
          placeholder="Search history..."
          value={query}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {/* History list */}
      <div className={s.list}>
        {loading && <div className={s.empty}>Loading...</div>}
        {!loading && history.length === 0 && (
          <div className={s.empty}>
            {query ? 'No matches' : 'No queries yet.\nGenerate one to get started!'}
          </div>
        )}
        {history.map(entry => (
          <div
            key={entry.id}
            className={`${s.item} ${activeId === entry.id ? s.active : ''}`}
            onClick={() => onLoad(entry)}
          >
            <div className={s.itemPrompt}>{entry.prompt}</div>
            <div className={s.itemMeta}>
              <span className={s.dialect}>{entry.dialect}</span>
              <span>{relTime(entry.created_at)}</span>
            </div>
            <button
              className={s.removeBtn}
              onClick={e => { e.stopPropagation(); onRemove(entry.id) }}
              title="Delete"
            >✕</button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className={s.footer}>
        {history.length > 0 && (
          confirm
            ? <div className={s.confirmRow}>
                <span>Clear all?</span>
                <button className={s.dangerBtn} onClick={() => { onClearAll(); setConfirm(false) }}>Yes</button>
                <button className={s.ghostBtn} onClick={() => setConfirm(false)}>No</button>
              </div>
            : <button className={s.ghostBtn} onClick={() => setConfirm(true)}>Clear history</button>
        )}
        <button className={s.logoutBtn} onClick={onLogout}>Sign out</button>
      </div>
    </aside>
  )
}
