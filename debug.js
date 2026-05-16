// Run this to diagnose ALL problems: node debug.js
import { config } from 'dotenv'
config()

console.log('\n=== QueryCraft Debug ===\n')

// 1. Check env vars
const vars = {
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  DATABASE_URL:   process.env.DATABASE_URL,
  JWT_SECRET:     process.env.JWT_SECRET,
}
console.log('1. ENV VARS:')
for (const [k, v] of Object.entries(vars)) {
  if (!v) {
    console.log(`   ❌ ${k} — MISSING`)
  } else {
    console.log(`   ✅ ${k} — set (${v.slice(0,12)}...)`)
  }
}

const allEnvOk = Object.values(vars).every(Boolean)
if (!allEnvOk) {
  console.log('\n   ⚠️  Fix missing env vars in .env first, then re-run.\n')
  process.exit(0)
}

// 2. Test DB connection
console.log('\n2. DATABASE:')
try {
  const pg = await import('pg')
  const pool = new pg.default.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  })
  const client = await pool.connect()
  const res = await client.query('SELECT NOW() as time')
  client.release()
  await pool.end()
  console.log(`   ✅ Connected — DB time: ${res.rows[0].time}`)
} catch (err) {
  console.log(`   ❌ FAILED: ${err.message}`)
  console.log('   → Check DATABASE_URL in your .env')
}

// 3. Test Gemini API
console.log('\n3. GEMINI API:')
try {
  const { geminiGenerate } = await import('./server/lib/gemini.js')
  const { data, model } = await geminiGenerate({
    contents: [{ role: 'user', parts: [{ text: 'Say hello in one word' }] }],
    generationConfig: { maxOutputTokens: 10 },
  })
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text
  console.log(`   ✅ ${model} replied: "${reply?.trim()}"`)
} catch (err) {
  console.log(`   ❌ FAILED: ${err.message}`)
  console.log('   → Get a new key at aistudio.google.com or set GEMINI_MODEL=gemini-2.5-flash')
}

// 4. Check tables exist
console.log('\n4. DB TABLES:')
try {
  const pg = await import('pg')
  const pool = new pg.default.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  })
  const client = await pool.connect()
  const res = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN ('users','query_history')
  `)
  client.release()
  await pool.end()
  const found = res.rows.map(r => r.table_name)
  const needsInit = []
  if (!found.includes('users'))         needsInit.push('users')
  if (!found.includes('query_history')) needsInit.push('query_history')
  if (needsInit.length) {
    console.log(`   ❌ Missing tables: ${needsInit.join(', ')}`)
    console.log('   → Run: npm run db:init')
  } else {
    console.log('   ✅ Tables exist: users, query_history')
  }
} catch (err) {
  console.log(`   ❌ FAILED: ${err.message}`)
}

console.log('\n========================\n')
