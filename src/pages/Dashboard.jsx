import React, { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useGenerate } from '../hooks/useGenerate'
import { useHistory } from '../hooks/useHistory'
import Sidebar from '../components/Sidebar'
import QueryPanel from '../components/QueryPanel'
import OutputPanel from '../components/OutputPanel'
import s from '../styles/Dashboard.module.css'

export default function Dashboard() {
  const { user, token, logout, apiFetch } = useAuth()
  const { status, streamedTokens, result, error, generate, cancel, reset } = useGenerate(token)
  const { history, loading: histLoading, addEntry, removeEntry, clearAll, search } = useHistory(apiFetch, user)

  const [schema, setSchema]           = useState('')
  const [prompt, setPrompt]           = useState('')
  const [dialect, setDialect]         = useState('PostgreSQL')
  const [showExplain, setShowExplain] = useState(true)
  const [showOpt, setShowOpt]         = useState(true)
  const [activeEntry, setActiveEntry] = useState(null)

  async function handleGenerate(isRefinement = false) {
    if (!prompt.trim()) return
    reset()
    await generate({
      schema, prompt, dialect,
      previousSQL: isRefinement && activeEntry ? (activeEntry.sql_result || activeEntry.sql) : null,
      refinement: isRefinement,
    })
  }

  // auto-save to DB when done
  useEffect(() => {
    if (status === 'done' && result?.sql) {
      const entry = { schema, prompt, dialect, ...result }
      addEntry(entry)
      setActiveEntry({ ...entry, sql_result: result.sql })
    }
  }, [status, result])

  function loadEntry(entry) {
    setSchema(entry.schema_sql || '')
    setPrompt(entry.prompt)
    setDialect(entry.dialect)
    setActiveEntry(entry)
    reset()
  }

  return (
    <div className={s.layout}>
      <Sidebar
        history={history}
        loading={histLoading}
        onLoad={loadEntry}
        onRemove={removeEntry}
        onClearAll={clearAll}
        onSearch={search}
        activeId={activeEntry?.id}
        user={user}
        onLogout={logout}
      />
      <main className={s.main}>
        <header className={s.header}>
          <div className={s.logo}>
            <span>⚡</span>
            <span className={s.logoText}>QueryCraft</span>
          </div>
          <p className={s.tag}>Natural language → SQL, instantly</p>
        </header>

        <QueryPanel
          schema={schema} setSchema={setSchema}
          prompt={prompt} setPrompt={setPrompt}
          dialect={dialect} setDialect={setDialect}
          showExplain={showExplain} setShowExplain={setShowExplain}
          showOpt={showOpt} setShowOpt={setShowOpt}
          status={status}
          onGenerate={() => handleGenerate(false)}
          onRefine={() => handleGenerate(true)}
          onCancel={cancel}
          hasActive={!!activeEntry}
        />

        <OutputPanel
          status={status}
          streamedTokens={streamedTokens}
          result={result}
          error={error}
          dialect={dialect}
          showExplain={showExplain}
          showOpt={showOpt}
          activeEntry={activeEntry}
          token={token}
        />
      </main>
    </div>
  )
}
