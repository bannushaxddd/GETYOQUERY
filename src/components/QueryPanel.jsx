import React, { useRef } from 'react'
import { SAMPLE_SCHEMAS, DIALECTS, EXAMPLE_PROMPTS } from '../lib/samples'
import s from '../styles/QueryPanel.module.css'

export default function QueryPanel({
  schema, setSchema, prompt, setPrompt,
  dialect, setDialect,
  showExplain, setShowExplain, showOpt, setShowOpt,
  status, onGenerate, onRefine, onCancel, hasActive
}) {
  const [schemaOpen, setSchemaOpen] = React.useState(true)
  const promptRef = useRef(null)
  const busy = status === 'streaming'

  function onKey(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); onGenerate() }
  }

  return (
    <div className={s.wrap}>
      {/* Schema */}
      <section className={s.section}>
        <div className={s.row}>
          <button className={s.collapseBtn} onClick={() => setSchemaOpen(o=>!o)}>
            <span className={`${s.chev} ${schemaOpen?s.open:''}`}>›</span>
            <span className={s.secLabel}>Database Schema</span>
            <span className={s.pill}>optional</span>
          </button>
          <div className={s.chips}>
            {Object.entries(SAMPLE_SCHEMAS).map(([k,v]) => (
              <button key={k} className={s.chip} onClick={() => { setSchema(v.sql); setSchemaOpen(true) }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        {schemaOpen && (
          <textarea
            className={`${s.ta} ${s.schemaTA}`}
            value={schema}
            onChange={e => setSchema(e.target.value)}
            placeholder={`Paste CREATE TABLE statements here...\n\nCREATE TABLE users (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100),\n  ...\n);`}
            rows={8}
            spellCheck={false}
          />
        )}
      </section>

      {/* Prompt */}
      <section className={s.section}>
        <div className={s.secLabel} style={{marginBottom:'0.5rem'}}>What do you want to query?</div>
        <div className={s.exRows}>
          {EXAMPLE_PROMPTS.map(p => (
            <button key={p} className={s.chip} onClick={() => { setPrompt(p); promptRef.current?.focus() }}>
              {p}
            </button>
          ))}
        </div>
        <div className={s.promptRow}>
          <textarea
            ref={promptRef}
            className={`${s.ta} ${s.promptTA}`}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={onKey}
            placeholder="e.g. Top 10 customers by revenue last month, include their country and order count..."
            rows={3}
          />
          <div className={s.btns}>
            {busy
              ? <button className={`${s.btn} ${s.stopBtn}`} onClick={onCancel}>Stop</button>
              : <>
                  <button className={`${s.btn} ${s.genBtn}`} onClick={onGenerate} disabled={!prompt.trim()}>
                    ⚡ Generate <span className={s.kbd}>⌘↵</span>
                  </button>
                  {hasActive && (
                    <button className={`${s.btn} ${s.refineBtn}`} onClick={onRefine} disabled={!prompt.trim()}>
                      ↻ Refine
                    </button>
                  )}
                </>
            }
          </div>
        </div>
      </section>

      {/* Options */}
      <div className={s.optBar}>
        <select className={s.select} value={dialect} onChange={e => setDialect(e.target.value)}>
          {DIALECTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <label className={s.tog}><input type="checkbox" checked={showExplain} onChange={e=>setShowExplain(e.target.checked)} /> Explain</label>
        <label className={s.tog}><input type="checkbox" checked={showOpt}     onChange={e=>setShowOpt(e.target.checked)}     /> Optimize tips</label>
        {busy && <span className={s.badge}><span className={s.pulse}/> Generating...</span>}
      </div>
    </div>
  )
}
