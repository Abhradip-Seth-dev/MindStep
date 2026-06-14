'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    try {
      setLoading(true)
      setError('')
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    // 1. MUST be the very first line to prevent popup-blocked error in strict browsers (Brave/Safari)
    const provider = new GoogleAuthProvider()
    let result;
    try {
      result = await signInWithPopup(auth, provider)
    } catch (err: any) {
      setError(err.message)
      return
    }

    // 2. Now we can do state updates
    setLoading(true)
    setError('')
    try {
      const user = result.user

      const res = await fetch(`/api/user?firebaseUid=${user.uid}`)
      const existing = await res.json()

      if (existing.error) {
        // New user — create and go to onboarding step 3
        await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: user.uid,
            name: user.displayName || 'Student',
            email: user.email,
            consentGiven: false,
          }),
        })
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
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
      minHeight: '100vh', background: '#080C12',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box',
    }}>

      {/* Ambient */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '-10%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,195,161,0.06) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,156,246,0.05) 0%, transparent 70%)',
        }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{
              width: 64, height: 64, borderRadius: '50%',
              margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(circle, rgba(79,195,161,0.2) 0%, rgba(79,195,161,0.05) 70%)',
              border: '1px solid rgba(79,195,161,0.3)',
              boxShadow: '0 0 40px rgba(79,195,161,0.15)',
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#4FC3A1', boxShadow: '0 0 10px #4FC3A1' }} />
          </motion.div>
          <h1 style={{
            fontSize: 28, fontFamily: 'Playfair Display, serif',
            color: '#E8EEF5', marginBottom: 6, fontWeight: 600,
          }}>
            Mind<span style={{ color: '#4FC3A1' }}>Step</span>
          </h1>
          <p style={{ fontSize: 13, color: '#3A4A5E' }}>
            Welcome back
          </p>
        </div>

        {/* Card */}
        <div style={{
          padding: '32px', borderRadius: 20,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>

          {/* Google */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#E8EEF5', fontSize: 14, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', marginBottom: 20,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </motion.button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 12, color: '#3A4A5E' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block', fontSize: 11, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 6, fontWeight: 600,
            }}>
              Email
            </label>
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'rgba(79,195,161,0.4)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block', fontSize: 11, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 6, fontWeight: 600,
            }}>
              Password
            </label>
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="········"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = 'rgba(79,195,161,0.4)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(224,92,92,0.08)',
              border: '1px solid rgba(224,92,92,0.2)',
              marginBottom: 16,
            }}>
              <p style={{ fontSize: 12, color: '#E05C5C' }}>{error}</p>
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleEmailLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '14px', borderRadius: 14,
              background: loading
                ? 'rgba(79,195,161,0.3)'
                : 'linear-gradient(135deg, #4FC3A1, #3DA88B)',
              color: '#080C12', fontSize: 14, fontWeight: 600,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(79,195,161,0.3)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in →'}
          </motion.button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => router.push('/onboarding')}
            style={{
              background: 'none', border: 'none',
              color: '#3A4A5E', fontSize: 13, cursor: 'pointer',
            }}
          >
            Don't have an account? Sign up →
          </button>
        </div>
      </motion.div>
    </div>
  )
}