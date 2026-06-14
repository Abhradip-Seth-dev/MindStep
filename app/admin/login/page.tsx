'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await res.json()
      
      if (res.ok && data.success) {
        router.push('/admin')
      } else {
        setError(data.error || 'Invalid credentials. Access denied.')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#E8EEF5',
    fontSize: 16,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080C12',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>

      {/* Ambient */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,156,246,0.06) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,195,161,0.05) 0%, transparent 70%)',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          width: '100%', maxWidth: 420,
          padding: '0 24px',
          position: 'relative', zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              width: 56, height: 56, borderRadius: 18,
              background: 'rgba(91,156,246,0.12)',
              border: '1px solid rgba(91,156,246,0.25)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 0 40px rgba(91,156,246,0.1)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24"
              fill="none" stroke="#5B9CF6" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </motion.div>

          <h1 style={{
            fontSize: 26,
            fontFamily: 'Playfair Display, serif',
            color: '#E8EEF5', marginBottom: 6, fontWeight: 600,
          }}>
            Admin Portal
          </h1>
          <p style={{ fontSize: 13, color: '#3A4A5E' }}>
            MindStep — Mental Health Commission
          </p>
        </div>

        {/* Card */}
        <div style={{
          padding: '32px', borderRadius: 20,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
        }}>
          <p style={{
            fontSize: 10, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#3A4A5E',
            marginBottom: 20, fontWeight: 600,
          }}>
            Authorized access only
          </p>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block', fontSize: 11,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#3A4A5E', marginBottom: 6, fontWeight: 600,
            }}>
              Admin email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mindstep.edu"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'rgba(91,156,246,0.4)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block', fontSize: 11,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#3A4A5E', marginBottom: 6, fontWeight: 600,
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="········"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'rgba(91,156,246,0.4)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(224,92,92,0.08)',
                border: '1px solid rgba(224,92,92,0.2)',
                marginBottom: 16,
              }}
            >
              <p style={{ fontSize: 12, color: '#E05C5C' }}>{error}</p>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 12,
              border: 'none',
              background: loading
                ? 'rgba(91,156,246,0.3)'
                : 'linear-gradient(135deg, #5B9CF6, #4A7FD4)',
              color: '#E8EEF5', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(91,156,246,0.3)',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
            }}
          >
            {loading ? 'Verifying...' : 'Access dashboard →'}
          </motion.button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 11, color: '#2A3547', lineHeight: 1.6 }}>
            This portal is restricted to authorized university<br />
            mental health commission staff only.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              marginTop: 12, background: 'none', border: 'none',
              color: '#3A4A5E', fontSize: 12, cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Back to student app
          </button>
        </div>
      </motion.div>
    </div>
  )
}