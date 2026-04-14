'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('jorge@prgreens.com')
  const [password, setPassword] = useState('PRGreens2026!')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
    } else {
      router.replace('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🌱</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#15803d', margin: 0 }}>PR Greens</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>Farm Operations Manager</p>
          <span style={{
            display: 'inline-block',
            backgroundColor: '#15803d',
            color: '#ffffff',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: 999,
            marginTop: 8,
          }}>DEMO #1</span>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@prgreens.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '10px 12px',
              borderRadius: 6,
              fontSize: 14,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: loading ? '#86efac' : '#15803d',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '14px',
              fontSize: 16,
              fontWeight: 600,
              marginTop: 4,
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 16, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, color: '#6b7280' }}>
          <p style={{ fontWeight: 600, color: '#4b5563', marginBottom: 4 }}>Demo credentials:</p>
          <p style={{ margin: '4px 0', fontSize: 11 }}>Email: <span style={{ fontFamily: 'monospace', color: '#374151' }}>jorge@prgreens.com</span></p>
          <p style={{ margin: '4px 0', fontSize: 11 }}>Password: <span style={{ fontFamily: 'monospace', color: '#374151' }}>PRGreens2026!</span></p>
        </div>
      </div>
    </div>
  )
}
