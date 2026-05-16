import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/AuthContext'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', color:'var(--text3)', fontFamily:'var(--font-ui)' }}>
      Loading...
    </div>
  )

  return (
    <Routes>
      <Route path="/login"  element={!user ? <AuthPage mode="login"  /> : <Navigate to="/" replace />} />
      <Route path="/signup" element={!user ? <AuthPage mode="signup" /> : <Navigate to="/" replace />} />
      <Route path="/*"      element={ user ? <Dashboard />            : <Navigate to="/login" replace />} />
    </Routes>
  )
}
