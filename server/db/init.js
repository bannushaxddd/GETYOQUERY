import '../env.js'   // load .env first before pool reads DATABASE_URL
import pool from './pool.js'

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)        NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255)        NOT NULL,
  created_at  TIMESTAMPTZ         DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS query_history (
  id           SERIAL PRIMARY KEY,
  user_id      INT          REFERENCES users(id) ON DELETE CASCADE,
  prompt       TEXT         NOT NULL,
  schema_sql   TEXT,
  dialect      VARCHAR(50)  DEFAULT 'PostgreSQL',
  sql_result   TEXT,
  explanation  TEXT,
  optimization TEXT,
  warnings     TEXT,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_user_id ON query_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_created ON query_history(user_id, created_at DESC);
`

async function init() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:\/\/.*@/, '://***@'))
  const client = await pool.connect()
  try {
    await client.query(SQL)
    console.log('✅  Tables created successfully')
  } catch (err) {
    console.error('❌  Init failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

init()
