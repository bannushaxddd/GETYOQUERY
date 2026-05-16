// env is loaded by server/env.js before this module is imported
import pg from 'pg'
const { Pool } = pg

// Prefer IPv4 on Windows — localhost often resolves to ::1 while Postgres listens on 127.0.0.1
let connectionString = process.env.DATABASE_URL
if (connectionString?.includes('@localhost')) {
  connectionString = connectionString.replace('@localhost', '@127.0.0.1')
}

const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
})

pool.on('error', (err) => console.error('DB pool error:', err.message))

export default pool
