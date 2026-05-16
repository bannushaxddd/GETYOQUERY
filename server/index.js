// env.js MUST be first import — loads .env via side-effect before anything reads process.env
import './env.js'

import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import pool          from './db/pool.js'
import authRoutes    from './routes/auth.js'
import historyRoutes from './routes/history.js'
import generateRoutes from './routes/generate.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app  = express()
const PORT = process.env.PORT || 3001

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes)
app.use('/api/history', historyRoutes)
app.use('/api',         generateRoutes)

// Health check — also fixes the "localhost:3001 404" in browser
app.get('/', (_, res) =>
  res.json({ name: 'QueryCraft API', status: 'ok', time: new Date().toISOString() })
)
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
)

// 404 fallback for unknown API routes
app.use('/api', (_, res) => res.status(404).json({ error: 'Route not found' }))

// ── Serve built frontend in production ───────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get('*', (_, res) => res.sendFile(path.join(distPath, 'index.html')))
}

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  // Check required env vars
  const missing = []
  if (!process.env.GOOGLE_API_KEY) missing.push('GOOGLE_API_KEY')
  if (!process.env.DATABASE_URL)   missing.push('DATABASE_URL')
  if (!process.env.JWT_SECRET)     missing.push('JWT_SECRET')

  if (missing.length) {
    console.error(`\n❌  Missing in .env: ${missing.join(', ')}`)
    console.error('   Create a .env file — copy .env.example and fill in the values\n')
    process.exit(1)
  }

  console.log('✅  Env vars loaded')
  console.log('   GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY?.slice(0,8) + '...')
  console.log('   DATABASE_URL:  ', process.env.DATABASE_URL?.replace(/:\/\/.*@/, '://***@'))

  // Verify DB
  try {
    const client = await pool.connect()
    await client.query('SELECT 1')
    client.release()
    console.log('✅  Database connected')
  } catch (err) {
    console.error('\n❌  Database connection failed:', err.message)
    console.error('   Check DATABASE_URL in your .env file')
    console.error('   Run: npm run db:init\n')
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`\n⚡  QueryCraft running`)
    console.log(`   API running on port ${PORT}`)
    console.log(`   Frontend: http://localhost:5173\n`)
  })
}

start()
