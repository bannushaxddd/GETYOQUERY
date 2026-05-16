import React, { createContext, useContext, useState, useEffect } from 'react'
import { fetchJSON } from './apiClient'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [token,   setToken]   = useState(() => localStorage.getItem('qc_token') || null)
  const [loading, setLoading] = useState(true)

  // Verify stored token on first load
  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    // Hard timeout — if server is slow / down, stop spinning after 5s
    const timeout = setTimeout(() => {
      console.warn('Auth check timed out')
      localStorage.removeItem('qc_token')
      setToken(null)
      setLoading(false)
    }, 5000)

    fetchJSON('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 5000,
    })
      .then(({ res, data }) => {
        if (!res.ok) throw new Error('invalid token')
        setUser(data.user)
      })
      .catch(() => {
        localStorage.removeItem('qc_token')
        setToken(null)
      })
      .finally(() => {
        clearTimeout(timeout)
        setLoading(false)
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function saveAuth(data) {
    localStorage.setItem('qc_token', data.token)
    setToken(data.token)
    setUser(data.user)
  }

  function logout() {
    localStorage.removeItem('qc_token')
    setToken(null)
    setUser(null)
  }

  async function apiFetch(url, opts = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    }
    return fetch(url, { ...opts, headers })
  }

  return (
    <AuthCtx.Provider value={{ user, token, loading, saveAuth, logout, apiFetch }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
