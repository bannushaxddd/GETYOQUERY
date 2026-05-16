import { Router } from 'express'
import pool from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)   // all history routes need auth

// ── GET /api/history ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100)
  const search = req.query.q || ''
  try {
    let query, params
    if (search) {
      query = `
        SELECT id, prompt, dialect, sql_result, explanation, optimization, warnings, created_at
        FROM query_history
        WHERE user_id = $1
          AND (prompt ILIKE $2 OR dialect ILIKE $2)
        ORDER BY created_at DESC
        LIMIT $3`
      params = [req.user.id, `%${search}%`, limit]
    } else {
      query = `
        SELECT id, prompt, dialect, sql_result, explanation, optimization, warnings, created_at
        FROM query_history
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2`
      params = [req.user.id, limit]
    }
    const { rows } = await pool.query(query, params)
    res.json({ history: rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── POST /api/history ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { prompt, schema_sql, dialect, sql_result, explanation, optimization, warnings } = req.body
  if (!prompt || !sql_result)
    return res.status(400).json({ error: 'prompt and sql_result are required' })
  try {
    const { rows } = await pool.query(
      `INSERT INTO query_history
        (user_id, prompt, schema_sql, dialect, sql_result, explanation, optimization, warnings)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [req.user.id, prompt, schema_sql || null, dialect || 'PostgreSQL',
       sql_result, explanation || null, optimization || null, warnings || null]
    )
    res.status(201).json({ entry: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// ── DELETE /api/history/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM query_history WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (rowCount === 0)
      return res.status(404).json({ error: 'Entry not found' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// ── DELETE /api/history (clear all) ──────────────────────────────────────────
router.delete('/', async (req, res) => {
  try {
    await pool.query('DELETE FROM query_history WHERE user_id = $1', [req.user.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
