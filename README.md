# ⚡ GETYOQUERY — AI-Powered SQL Generator & Query Assistant

> Think in English. Ship in SQL.
> From messy ideas to clean SQL in seconds. 
> Built as a full-stack web application with real authentication, database persistence, and live deployment.

---

## Live Demo

🌐 **Deployed:** Live On [https://getyoquery.onrender.com]

---

## Features

### Core
- **Natural language → SQL** — describe what you want, get correct SQL instantly
- **8 dialects** — PostgreSQL, MySQL, SQLite, SQL Server, BigQuery, Snowflake, Oracle, DuckDB
- **Real-time streaming** — SQL appears token-by-token as Claude generates it
- **Schema-aware generation** — paste your `CREATE TABLE` DDL for exact column names
- **Query refinement** — ask Claude to tweak an existing query ("add a LIMIT", "group by month")
- **Step-by-step explanation** — plain English breakdown of any query
- **Optimization tips** — Claude flags missing indexes, N+1 risks, query pitfalls

### Auth & Data
- **JWT authentication** — secure login/signup with bcrypt password hashing
- **PostgreSQL database** — users and query history stored server-side
- **Per-user history** — last 50 queries saved to DB, searchable, accessible across devices
- **7-day token expiry** — auto-logout after session expires

### UX
- **Streaming UI** — live cursor while generating
- **Copy / download** — copy SQL to clipboard or save as `.sql` file
- **4 sample schemas** — E-commerce, Blog, HR, SaaS analytics (one click to load)
- **Example prompts** — clickable suggestions to get started fast
- **Collapsible sidebar** — history panel with search, delete, clear all

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, React Router 6, CSS Modules, Vite |
| Backend | Node.js, Express |
| Database | PostgreSQL (via `pg`) |
| Auth | JWT (`jsonwebtoken`), bcrypt (`bcryptjs`) |
| AI | Anthropic Claude Sonnet (`@anthropic-ai/sdk`) |
| Streaming | Server-Sent Events (SSE) |
| Deployment | Railway (backend + DB) or Render |

---

## Project Structure

```
GETYOQUERY/
├── server/
│   ├── index.js            ← Express app, middleware, static serving
│   ├── db/
│   │   ├── pool.js         ← PostgreSQL connection pool
│   │   └── init.js         ← Schema initializer (run once)
│   ├── middleware/
│   │   └── auth.js         ← JWT verification middleware
│   └── routes/
│       ├── auth.js         ← /api/auth/* (signup, login, me)
│       ├── history.js      ← /api/history/* (CRUD, search)
│       └── generate.js     ← /api/generate (SSE streaming), /api/explain
├── src/
│   ├── main.jsx            ← React entry, BrowserRouter, AuthProvider
│   ├── App.jsx             ← Route guard (auth vs dashboard)
│   ├── lib/
│   │   ├── AuthContext.jsx ← React context: user, token, apiFetch
│   │   ├── highlight.js    ← Zero-dep SQL syntax highlighter
│   │   └── samples.js      ← Sample schemas + example prompts
│   ├── hooks/
│   │   ├── useGenerate.js  ← SSE streaming hook
│   │   └── useHistory.js   ← Server-side history CRUD hook
│   ├── pages/
│   │   ├── AuthPage.jsx    ← Login + Signup page
│   │   └── Dashboard.jsx   ← Main app after login
│   └── components/
│       ├── Sidebar.jsx     ← User info, history list, logout
│       ├── QueryPanel.jsx  ← Schema input, prompt, options
│       └── OutputPanel.jsx ← Streaming SQL, copy, steps, info cards
├── railway.toml            ← Railway deployment config
├── Procfile                ← Render/Heroku deployment
└── .env.example            ← Environment variable template
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL (local or free cloud — see below)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/querycraft.git
cd querycraft
npm install
```

### 2. Get a PostgreSQL database

**Option A — Supabase (free, no local install):**
1. Go to [supabase.com](https://supabase.com) → New project
2. Settings → Database → Connection string → URI
3. Copy the `postgresql://...` connection string

**Option B — Local Postgres:**
```bash
createdb querycraft
# Connection string: postgresql://localhost/querycraft
```

### 3. Get a Google Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Click **Create API Key**
3. Copy your Gemini API key
4. Paste it into your `.env` file as:

```env
GOOGLE_API_KEY=your_api_key_here

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
DATABASE_URL=postgresql://user:pass@host:5432/querycraft
JWT_SECRET=generate-with-openssl-rand-hex-64
```

Generate a JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5. Initialize the database

```bash
npm run db:init
```

This creates the `users` and `query_history` tables.

### 6. Start development

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## Deployment

### Render + Supabase (Production)

The application is deployed using Render for hosting and Supabase PostgreSQL for the database.

### Deploy on Render

1. Push the project to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Configure:

```bash
Build Command:
npm install && npm run build

Start Command:
node server/index.js

Add environment variables in Railway dashboard → Variables:
```
ANTHROPIC_API_KEY = sk-ant-...
DATABASE_URL      = [Railway auto-sets this when you add Postgres plugin]
JWT_SECRET        = [long random string]
NODE_ENV          = production
```

Add a PostgreSQL plugin: Railway dashboard → New Service → Database → PostgreSQL

Then initialize your DB:
```bash
railway run npm run db:init
```

Your app is live at the Railway-assigned URL. ✅

---

### Render (alternative free tier)

1. Push to GitHub
2. New Web Service → connect your repo
3. Build: `npm install && npm run build`
4. Start: `npm run start`
5. Add env vars (same as above)
6. Add a PostgreSQL database → copy connection string into `DATABASE_URL`
7. After deploy: open Shell → `npm run db:init`

---

## API Reference

### Auth

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | `/api/auth/signup` | `{name, email, password}` | `{token, user}` |
| POST | `/api/auth/login`  | `{email, password}` | `{token, user}` |
| GET  | `/api/auth/me`     | — (Bearer token) | `{user}` |

### History (all require Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/history` | List user's history (optional `?q=search`) |
| POST   | `/api/history` | Save a query result |
| DELETE | `/api/history/:id` | Delete one entry |
| DELETE | `/api/history` | Clear all entries |

### Generate (requires Bearer token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate` | Stream SQL (SSE) |
| POST | `/api/explain`  | Step-by-step explanation |

---

## Database Schema

```sql
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100)        NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255)        NOT NULL,  -- bcrypt hash
  created_at TIMESTAMPTZ         DEFAULT NOW()
);

CREATE TABLE query_history (
  id           SERIAL PRIMARY KEY,
  user_id      INT         REFERENCES users(id) ON DELETE CASCADE,
  prompt       TEXT        NOT NULL,
  schema_sql   TEXT,
  dialect      VARCHAR(50) DEFAULT 'PostgreSQL',
  sql_result   TEXT,
  explanation  TEXT,
  optimization TEXT,
  warnings     TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

---

## How Streaming Works

```
Browser            Express Server          Anthropic API
  │                      │                      │
  ├─POST /api/generate──→│                      │
  │  (Bearer token)      ├─stream request──────→│
  │                      │ ←─delta token────────┤
  │←SSE {token:"SELECT"} │                      │
  │←SSE {token:" users"} │ ←─delta token────────┤
  │       ...live...     │       ...streaming...│
  │←SSE {done:true, result:{sql,explanation,...}}│
  │                      │                      │
  [React saves to DB via POST /api/history]
```

The server pipes Claude's response through Server-Sent Events. The React `useGenerate` hook reads the SSE stream, extracts the SQL field from partial JSON using a regex, and renders it live. On completion the full result is parsed and auto-saved to PostgreSQL.

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWTs expire after 7 days
- All `/api/history` and `/api/generate` routes protected by `requireAuth` middleware
- SQL injection prevented by parameterized queries (`$1, $2` placeholders in pg)
- CORS restricted to frontend origin in production

---

## Troubleshooting

**`Cannot connect to database`**
→ Check `DATABASE_URL` in `.env`. Run `npm run db:init` to create tables.

**`ANTHROPIC_API_KEY not set`**
→ Make sure `.env` exists. Restart the server after editing it.

**Login always fails**
→ Make sure you ran `npm run db:init`. Check the `users` table exists in your DB.

**Frontend shows blank / 404 on refresh (production)**
→ The server serves `dist/index.html` for all `*` routes. Make sure `npm run build` completed before `npm run start`.

**SSE stream stops immediately**
→ Check the server terminal for errors. Common cause: invalid API key or missing `JWT_SECRET`.
