import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { geminiStreamGenerate, geminiGenerate } from '../lib/gemini.js'

const router = Router()

const SYSTEM_PROMPT = `You are QueryCraft, an elite SQL expert. Generate clean, efficient, production-ready SQL.

Always respond with ONLY valid JSON — no markdown fences, no preamble, nothing outside the JSON.

JSON shape:
{
  "sql": "complete SQL query with inline comments for complex parts",
  "explanation": "plain English explanation of what this query does (2-4 sentences)",
  "optimization": "specific performance tips or null if not applicable",
  "warnings": "any schema assumptions or potential issues, or null"
}

Rules:
- Use correct dialect syntax and functions
- Add -- inline comments for complex JOINs and WHERE clauses
- If schema is given, use ONLY those exact table and column names
- Format SQL with newlines and 2-space indentation
- For refinements, build on the previous query provided`

function buildPrompt({ schema, prompt, dialect, previousSQL, refinement }) {
  const parts = []
  if (schema?.trim()) parts.push(`Database schema:\n${schema.trim()}`)
  if (previousSQL && refinement) {
    parts.push(`Previous SQL:\n${previousSQL}`)
    parts.push(`Refinement request: ${prompt}`)
  } else {
    parts.push(`Generate a ${dialect || 'PostgreSQL'} SQL query for: ${prompt}`)
  }
  return parts.join('\n\n')
}

const generationBody = (userText) => ({
  system_instruction: {
    parts: [{ text: SYSTEM_PROMPT }],
  },
  contents: [
    { role: 'user', parts: [{ text: userText }] },
  ],
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 2000,
  },
})

// ── POST /api/generate  (streaming SSE) ──────────────────────────────────────
router.post('/generate', requireAuth, async (req, res) => {
  const { schema, prompt, dialect, previousSQL, refinement } = req.body

  if (!prompt?.trim())
    return res.status(400).json({ error: 'prompt is required' })

  if (!process.env.GOOGLE_API_KEY)
    return res.status(500).json({ error: 'GOOGLE_API_KEY is not configured on the server' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()

  const userText = buildPrompt({ schema, prompt, dialect, previousSQL, refinement })

  console.log('[generate] prompt:', prompt?.slice(0, 60))

  try {
    const { res: geminiRes, model } = await geminiStreamGenerate(generationBody(userText))

    const reader  = geminiRes.body.getReader()
    const decoder = new TextDecoder()
    let lineBuf  = ''
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      lineBuf += decoder.decode(value, { stream: true })
      const lines = lineBuf.split('\n')
      lineBuf = lines.pop()

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (!raw || raw === '[DONE]') continue
        try {
          const chunk = JSON.parse(raw)
          const parts = chunk?.candidates?.[0]?.content?.parts || []
          const token = parts.map(p => p.text).filter(Boolean).join('')
          if (token) {
            fullText += token
            res.write(`data: ${JSON.stringify({ token })}\n\n`)
          }
        } catch { /* skip malformed SSE chunk */ }
      }
    }

    console.log('[generate] completed with', model, 'length:', fullText.length)

    try {
      const clean  = fullText.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      res.write(`data: ${JSON.stringify({ done: true, result: parsed })}\n\n`)
    } catch (parseErr) {
      console.warn('[generate] JSON parse failed, returning raw text:', parseErr.message)
      res.write(`data: ${JSON.stringify({ done: true, result: { sql: fullText, explanation: null, optimization: null, warnings: null } })}\n\n`)
    }
    res.end()

  } catch (err) {
    console.error('[generate] error:', err.message)
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
    res.end()
  }
})

// ── POST /api/explain  (one-shot) ────────────────────────────────────────────
router.post('/explain', requireAuth, async (req, res) => {
  const { sql, dialect } = req.body
  if (!sql) return res.status(400).json({ error: 'sql is required' })

  if (!process.env.GOOGLE_API_KEY)
    return res.status(500).json({ error: 'GOOGLE_API_KEY is not configured' })

  try {
    const { data } = await geminiGenerate({
      contents: [{
        role: 'user',
        parts: [{
          text: `Explain this ${dialect || 'SQL'} query step by step in plain English. Respond ONLY with valid JSON, no code fences: {"steps":["step 1","step 2"],"summary":"one line"}\n\nSQL:\n${sql}`,
        }],
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 800 },
    })

    const text  = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const clean = text.replace(/```json|```/g, '').trim()
    res.json(JSON.parse(clean))

  } catch (err) {
    console.error('[explain] error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

export default router
