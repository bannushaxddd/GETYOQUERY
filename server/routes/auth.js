import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db/pool.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  console.log('[signup] body:', { ...req.body, password: '***' })

  const { name, email, password } = req.body

  // Validation
  if (!name?.trim())     return res.status(400).json({ error: 'Name is required' })
  if (!email?.trim())    return res.status(400).json({ error: 'Email is required' })
  if (!password)         return res.status(400).json({ error: 'Password is required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Invalid email address' })

  try {
    // 10 rounds is secure and ~10x faster than 12 in dev
    const hash = await bcrypt.hash(password, 10)

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), email.toLowerCase().trim(), hash]
    )

    const user = rows[0]
    console.log('[signup] success, user id:', user.id)
    return res.status(201).json({
      token: makeToken(user),
      user: { id: user.id, name: user.name, email: user.email }
    })

  } catch (err) {
    console.error('[signup] error:', err.message, err.code)
    if (err.code === '23505')
      return res.status(409).json({ error: 'An account with that email already exists' })
    return res.status(500).json({ error: 'Server error: ' + err.message })
  }
})

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  console.log('[login] attempt:', req.body?.email)

  const { email, password } = req.body
  if (!email?.trim()) return res.status(400).json({ error: 'Email is required' })
  if (!password)      return res.status(400).json({ error: 'Password is required' })

  try {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )

    const user = rows[0]
    if (!user) {
      console.log('[login] user not found:', email)
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      console.log('[login] wrong password for:', email)
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    console.log('[login] success, user id:', user.id)
    return res.json({
      token: makeToken(user),
      user: { id: user.id, name: user.name, email: user.email }
    })

  } catch (err) {
    console.error('[login] error:', err.message)
    return res.status(500).json({ error: 'Server error: ' + err.message })
  }
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'User not found' })
    return res.json({ user: rows[0] })
  } catch (err) {
    console.error('[/me] error:', err.message)
    return res.status(500).json({ error: 'Server error: ' + err.message })
  }
})

export default router
