import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { fetchJSON } from '../lib/apiClient'
import s from '../styles/AuthPage.module.css'

export default function AuthPage({ mode }) {
  const { saveAuth } = useAuth()
  const nav = useNavigate()
  const isLogin = mode === 'login'

  const [form,    setForm]    = useState({ name: '', email: '', password: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup'
      const body     = isLogin
        ? { email: form.email.trim(), password: form.password }
        : { name: form.name.trim(), email: form.email.trim(), password: form.password }

      const { res, data } = await fetchJSON(endpoint, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      })

      if (!res.ok) {
        setError(data?.error || 'Something went wrong. Please try again.')
        return
      }

      saveAuth(data)
      nav('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Cannot reach server — run npm run dev and use http://localhost:5173')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.logo}>
          <span className={s.logoIcon}>⚡</span>
          <span className={s.logoText}>QueryCraft</span>
        </div>
        <p className={s.sub}>Natural language → SQL, instantly</p>

        <h1 className={s.heading}>{isLogin ? 'Welcome back' : 'Create your account'}</h1>

        <form onSubmit={submit} className={s.form} noValidate>
          {!isLogin && (
            <div className={s.field}>
              <label className={s.label}>Name</label>
              <input
                className={s.input}
                type="text"
                placeholder="Your full name"
                value={form.name}
                onChange={set('name')}
                required
                autoFocus={!isLogin}
                disabled={loading}
              />
            </div>
          )}

          <div className={s.field}>
            <label className={s.label}>Email</label>
            <input
              className={s.input}
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              required
              autoFocus={isLogin}
              disabled={loading}
            />
          </div>

          <div className={s.field}>
            <label className={s.label}>Password</label>
            <input
              className={s.input}
              type="password"
              placeholder={isLogin ? '••••••••' : 'Min 6 characters'}
              value={form.password}
              onChange={set('password')}
              required
              disabled={loading}
            />
          </div>

          {error && <div className={s.error}>{error}</div>}

          <button className={s.btn} type="submit" disabled={loading}>
            {loading
              ? (isLogin ? 'Signing in...' : 'Creating account...')
              : (isLogin ? 'Sign in'       : 'Create account')}
          </button>
        </form>

        <p className={s.switch}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link to={isLogin ? '/signup' : '/login'} className={s.link}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </div>

      <div className={s.grid} aria-hidden="true" />
    </div>
  )
}
