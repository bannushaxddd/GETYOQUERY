import React, { useState, useEffect } from 'react'
import { highlightSQL } from '../lib/highlight'
import s from '../styles/OutputPanel.module.css'

function extractSQL(tokens) {
  const m = tokens.match(/"sql"\s*:\s*"((?:[^"\\]|\\.)*)/);
  return m ? m[1].replace(/\\n/g,'\n').replace(/\\t/g,'  ').replace(/\\"/g,'"') : ''
}

export default function OutputPanel({ status, streamedTokens, result, error, dialect, showExplain, showOpt, activeEntry, token }) {
  const [copied, setCopied]         = useState(false)
  const [steps, setSteps]           = useState(null)
  const [stepsLoading, setStepsLoading] = useState(false)

  const sql = result?.sql || (status === 'streaming' ? extractSQL(streamedTokens) : '')
  const isBusy = status === 'streaming'
  const isDone = status === 'done'

  useEffect(() => { if (isDone) setSteps(null) }, [isDone])

  async function copy() {
    if (!sql) return
    await navigator.clipboard.writeText(sql)
    setCopied(true); setTimeout(() => setCopied(false), 1800)
  }

  function download() {
    if (!sql) return
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([sql], { type: 'text/plain' })),
      download: `query_${Date.now()}.sql`
    })
    a.click()
  }

  async function fetchSteps() {
    if (!sql || stepsLoading) return
    setStepsLoading(true); setSteps(null)
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sql, dialect }),
      })
      setSteps(await res.json())
    } catch { setSteps({ error: 'Failed to load explanation' }) }
    setStepsLoading(false)
  }

  if (status === 'idle' && !activeEntry) return (
    <div className={s.placeholder}>
      <div className={s.placeholderIcon}>⚡</div>
      <p>Describe your query and hit Generate</p>
      <p className={s.hint}>Tip: paste your schema for accurate column names</p>
    </div>
  )

  const displaySQL = result?.sql || activeEntry?.sql_result || ''

  return (
    <div className={s.out}>
      {/* SQL card */}
      <div className={s.card}>
        <div className={s.cardHead}>
          <div className={s.cardTitle}>
            Generated SQL <span className={s.dialectBadge}>{dialect}</span>
          </div>
          <div className={s.actions}>
            <button className={s.act} onClick={copy}        disabled={!displaySQL && !sql}>{copied ? '✓ Copied' : 'Copy'}</button>
            <button className={s.act} onClick={download}    disabled={!displaySQL && !sql}>↓ .sql</button>
            <button className={s.act} onClick={fetchSteps}  disabled={(!displaySQL && !sql) || stepsLoading}>
              {stepsLoading ? '...' : '≡ Steps'}
            </button>
          </div>
        </div>
        <div className={s.sqlBox}>
          {sql || displaySQL ? (
            <pre className={s.pre} dangerouslySetInnerHTML={{ __html: highlightSQL(sql || displaySQL) }} />
          ) : (
            <span className={s.waiting}>
              {isBusy ? <><span className={s.gen}>Generating</span><span className={s.cursor}>▌</span></> : 'No output yet'}
            </span>
          )}
          {isBusy && sql && <span className={s.cursor}>▌</span>}
        </div>
      </div>

      {/* Steps */}
      {steps && (
        <div className={s.infoCard}>
          <div className={s.infoTitle}>Step-by-step breakdown</div>
          {steps.error
            ? <p className={s.errTxt}>{steps.error}</p>
            : <>
                {steps.summary && <p className={s.summary}>{steps.summary}</p>}
                <ol className={s.steps}>{steps.steps?.map((st,i) => <li key={i}>{st}</li>)}</ol>
              </>
          }
        </div>
      )}

      {/* Explanation */}
      {showExplain && result?.explanation && (
        <div className={s.infoCard}>
          <div className={s.infoTitle}><span className={s.dot} style={{background:'var(--blue)'}}/> What this does</div>
          <p className={s.infoTxt}>{result.explanation}</p>
        </div>
      )}

      {/* Optimization */}
      {showOpt && result?.optimization && (
        <div className={`${s.infoCard} ${s.optCard}`}>
          <div className={s.infoTitle}><span className={s.dot} style={{background:'var(--accent)'}}/> Optimization tip</div>
          <p className={s.infoTxt}>{result.optimization}</p>
        </div>
      )}

      {/* Warnings */}
      {result?.warnings && (
        <div className={`${s.infoCard} ${s.warnCard}`}>
          <div className={s.infoTitle}><span className={s.dot} style={{background:'var(--amber)'}}/> Assumptions</div>
          <p className={s.infoTxt}>{result.warnings}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className={`${s.infoCard} ${s.errCard}`}>
          <div className={s.infoTitle}>Error</div>
          <p className={s.infoTxt}>{error}</p>
        </div>
      )}
    </div>
  )
}
