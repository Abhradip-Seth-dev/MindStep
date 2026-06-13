'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

const SCHOOLS: Record<string, string[]> = {
  'School of Agriculture and Allied Sciences': [
    'B.Sc Agriculture', 'B.Sc Horticulture', 'B.Sc Forestry'
  ],
  'School of Fisheries Science': [
    'B.Sc Fisheries Science', 'B.F.Sc'
  ],
  'School of Skill Development and Vocational Studies': [
    'B.Voc Software Development', 'B.Voc Retail Management'
  ],
  'School of Science and Technology': [
    'B.Tech CSE (AI/ML)', 'B.Tech CSE (Data Science)',
    'B.Tech CSE (Cyber Security)', 'B.Tech CSE (Robotics)',
    'BCA', 'B.Sc Computer Science', 'B.Sc Physics', 'B.Sc Chemistry'
  ],
  'School of Integrated Sciences': [
    'B.Sc Biotechnology', 'B.Sc Microbiology', 'B.Sc Biochemistry'
  ],
  'School of Health Sciences': [
    'B.Sc Nursing', 'B.Sc Medical Lab Technology', 'B.Sc Radiology'
  ],
  'School of Hospitality & Culinary Art': [
    'BHM Hotel Management', 'B.Sc Culinary Arts'
  ],
  'School of Humanities, Management and Social Sciences': [
    'BBA', 'B.Com', 'BA Economics', 'BA Psychology', 'BA English'
  ],
  'School of Legal Studies': [
    'BA LLB', 'BBA LLB', 'LLB'
  ],
  'School of Maritime Studies': [
    'B.Sc Nautical Science', 'B.Tech Marine Engineering'
  ],
  'School of Nursing': [
    'B.Sc Nursing', 'Post Basic B.Sc Nursing'
  ],
  'School of Pharmacy': [
    'B.Pharm', 'D.Pharm', 'Pharm.D'
  ],
}

const BOYS_HOSTELS = ['Boys Hostel 1', 'Boys Hostel 2', 'Boys Hostel 3', 'Boys Hostel 4', 'Boys Hostel 5', 'Boys Hostel 6', 'Boys Hostel 7']
const GIRLS_HOSTELS = ['Girls Hostel 1', 'Girls Hostel 2', 'Girls Hostel 3', 'Girls Hostel 4', 'Girls Hostel 5', 'Girls Hostel 6', 'Girls Hostel 7']

const steps = [
  { id: 0, label: 'Welcome' },
  { id: 1, label: 'How it works' },
  { id: 2, label: 'Create account' },
  { id: 3, label: 'University info' },
  { id: 4, label: 'Consent' },
]

const inputStyle = {
  width: '100%',
  padding: '16px 20px',
  borderRadius: 14,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: '#E8EEF5',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
  transition: 'all 0.3s ease',
  appearance: 'none' as const,
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
}

const labelStyle = {
  display: 'block' as const,
  fontSize: 12,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: '#8B9BB0',
  marginBottom: 8,
  fontWeight: 600,
}

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 2 — auth
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Step 3 — university info
  const [uid, setUid] = useState('')
  const [school, setSchool] = useState('')
  const [course, setCourse] = useState('')
  const [rollNumber, setRollNumber] = useState('')
  const [semester, setSemester] = useState('')
  const [studentType, setStudentType] = useState<'dayscholar' | 'hosteller'>('dayscholar')
  const [hostel, setHostel] = useState('')

  // Step 4 — consent
  const [consent, setConsent] = useState(false)

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result && result.user) {
          setLoading(true)
          const user = result.user
      
          // Check if user already exists
          const res = await fetch(`/api/user?firebaseUid=${user.uid}`)
          const existing = await res.json()
      
          if (!existing.error) {
            // User exists — check if they have university info
            if (existing.course) {
              // Fully set up — go straight to dashboard
              router.push('/dashboard')
            } else {
              // Exists but no university info — go to step 3
              setName(existing.name || user.displayName || '')
              setStep(3)
            }
            setLoading(false)
            return
          }
      
          // New user — create and go to step 3
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
      
          setName(user.displayName || '')
          setStep(3)
          setLoading(false)
        }
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }
    handleRedirect()
  }, [router])

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError('')
      const provider = new GoogleAuthProvider()
      await signInWithRedirect(auth, provider)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleEmailSignUp = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all fields')
      return
    }
    try {
      setLoading(true)
      setError('')
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const user = result.user

      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          name,
          email,
          consentGiven: false,
        }),
      })

      setStep(3)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUniversityInfo = async () => {
    if (!uid || !school || !course || !rollNumber || !semester) {
      setError('Please fill in all required fields')
      return
    }
    if (studentType === 'hosteller' && !hostel) {
      setError('Please select your hostel')
      return
    }
    try {
      setLoading(true)
      setError('')
      const user = auth.currentUser
      if (!user) return
  
      const payload = {
        firebaseUid: user.uid,
        uid,
        school,
        course,
        rollNumber,
        semester: parseInt(semester),
        studentType,
        hostel: studentType === 'hosteller' ? hostel : '',
      }
  
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
  
      await res.json()
  
      setStep(4)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConsent = async () => {
    if (!consent) {
      setError('Please accept the consent to continue')
      return
    }
    try {
      setLoading(true)
      const user = auth.currentUser
      if (!user) return

      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          consentGiven: true,
        }),
      })

      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#080C12' }}>

      {/* Background orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(79,195,161,0.06) 0%, transparent 70%)' }} />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(91,156,246,0.06) 0%, transparent 70%)' }} />

      <div className="w-full relative z-10" style={{ maxWidth: 520 }}>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {steps.map((s) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <motion.div
                animate={{
                  width: step === s.id ? 40 : 12,
                  backgroundColor: step >= s.id ? '#4FC3A1' : '#1E2A38',
                  boxShadow: step >= s.id ? '0 0 12px rgba(79,195,161,0.5)' : 'none',
                }}
                transition={{ duration: 0.4, type: 'spring' }}
                className="h-[6px] rounded-full"
              />
            </div>
          ))}
        </div>

        <motion.div
          style={{
            background: 'rgba(8, 12, 18, 0.6)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 32,
            padding: '48px 40px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Subtle inner highlight */}
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(79,195,161,0.3), transparent)' }} />

        <AnimatePresence mode="wait">

          {/* STEP 0 — Welcome */}
          {step === 0 && (
            <motion.div key="step0"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}
              style={{ textAlign: 'center' }}
            >
              <motion.div
                animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 4, repeat: Infinity }}
                style={{
                  width: 96, height: 96, borderRadius: '50%',
                  margin: '0 auto 32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'radial-gradient(circle, rgba(79,195,161,0.2) 0%, rgba(79,195,161,0.05) 70%)',
                  border: '1px solid rgba(79,195,161,0.3)',
                  boxShadow: '0 0 60px rgba(79,195,161,0.15)',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4FC3A1" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.607L5 14.5m14.8.5l-1.57-.393" />
                </svg>
              </motion.div>

              <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4FC3A1', marginBottom: 12 }}>
                Team Ignite
              </p>
              <h1 style={{ fontSize: 48, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 12, fontWeight: 600 }}>
                Mind<span style={{ color: '#4FC3A1' }}>Step</span>
              </h1>
              <p style={{ fontSize: 16, color: '#8B9BB0', marginBottom: 8 }}>
                Your pattern is already there.
              </p>
              <p style={{ fontSize: 16, color: '#5A6A7E', marginBottom: 40 }}>
                You just can't see it yet.
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setStep(1)}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16,
                  background: 'linear-gradient(135deg, #4FC3A1 0%, #3DA88B 100%)',
                  color: '#080C12', fontSize: 15, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(79,195,161,0.25)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Get started →
              </motion.button>
              <p style={{ fontSize: 11, color: '#3A4A5E', marginTop: 12 }}>
                Built for The Neotia University students
              </p>
            </motion.div>
          )}

          {/* STEP 1 — How it works */}
          {step === 1 && (
            <motion.div key="step1"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}
            >
              <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4FC3A1', marginBottom: 8 }}>
                How it works
              </p>
              <h2 style={{ fontSize: 30, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 6, fontWeight: 600 }}>
                Three steps to clarity
              </h2>
              <p style={{ fontSize: 13, color: '#5A6A7E', marginBottom: 28, lineHeight: 1.6 }}>
                MindStep learns what normal looks like for you — then quietly notices when things drift.
              </p>

              {[
                { n: '01', title: 'Log daily', desc: 'Answer 5 questions every evening. Takes 30 seconds. No pressure, no judgment.', color: '#4FC3A1' },
                { n: '02', title: 'Build your baseline', desc: 'After 7 days, the app knows your personal normal — not population averages. Yours.', color: '#5B9CF6' },
                { n: '03', title: 'Get notified early', desc: 'When your pattern drifts, MindStep quietly lets you and the right people know.', color: '#E8A04A' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  style={{
                    display: 'flex', gap: 16, padding: '16px 20px',
                    borderRadius: 16, marginBottom: 10,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <span style={{ fontSize: 24, fontFamily: 'Playfair Display, serif', color: item.color, fontWeight: 600, flexShrink: 0 }}>
                    {item.n}
                  </span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#E8EEF5', marginBottom: 4 }}>{item.title}</p>
                    <p style={{ fontSize: 12, color: '#5A6A7E', lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setStep(2)}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16, marginTop: 16,
                  background: 'linear-gradient(135deg, #4FC3A1 0%, #3DA88B 100%)',
                  color: '#080C12', fontSize: 15, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 8px 32px rgba(79,195,161,0.25)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Create my account →
              </motion.button>
            </motion.div>
          )}

          {/* STEP 2 — Sign up */}
          {step === 2 && (
            <motion.div key="step2"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}
            >
              <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4FC3A1', marginBottom: 8 }}>
                Create account
              </p>
              <h2 style={{ fontSize: 30, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 6, fontWeight: 600 }}>
                Let's get you set up
              </h2>
              <p style={{ fontSize: 13, color: '#5A6A7E', marginBottom: 24 }}>
                Your data never leaves your device without your consent.
              </p>

              {/* Google */}
              <motion.button
                whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#E8EEF5', fontSize: 15, fontWeight: 500, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', marginBottom: 24,
                  transition: 'background 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </motion.button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontSize: 12, color: '#3A4A5E' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {[
                { label: 'Full name', value: name, setter: setName, type: 'text', placeholder: 'Your full name' },
                { label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'your@email.com' },
                { label: 'Password', value: password, setter: setPassword, type: 'password', placeholder: '········' },
              ].map((field) => (
                <div key={field.label} style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>{field.label}</label>
                  <input
                    type={field.type} value={field.value}
                    onChange={(e) => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(79,195,161,0.6)'; e.target.style.boxShadow = '0 0 12px rgba(79,195,161,0.2)' }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.2)' }}
                  />
                </div>
              ))}

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#E05C5C' }}>{error}</p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleEmailSignUp}
                disabled={loading}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16,
                  background: 'linear-gradient(135deg, #4FC3A1 0%, #3DA88B 100%)',
                  color: '#080C12', fontSize: 15, fontWeight: 600,
                  border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1,
                  boxShadow: '0 8px 32px rgba(79,195,161,0.25)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {loading ? 'Creating account...' : 'Create account →'}
              </motion.button>
            </motion.div>
          )}

          {/* STEP 3 — University Info */}
          {step === 3 && (
            <motion.div key="step3"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}
            >
              <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4FC3A1', marginBottom: 8 }}>
                University details
              </p>
              <h2 style={{ fontSize: 30, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 6, fontWeight: 600 }}>
                Tell us about yourself
              </h2>
              <p style={{ fontSize: 13, color: '#5A6A7E', marginBottom: 24 }}>
                This helps MindStep personalize your experience at TNU.
              </p>

              {/* UID */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>University ID (UID)</label>
                <input
                  type="text" value={uid}
                  onChange={(e) => setUid(e.target.value)}
                  placeholder="e.g. TNU2024053100024"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(79,195,161,0.4)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>

              {/* Roll Number */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Roll Number</label>
                <input
                  type="text" value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="e.g. 2024CSE001"
                  style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(79,195,161,0.4)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>

              {/* School */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>School</label>
                <select
                  value={school}
                  onChange={(e) => { setSchool(e.target.value); setCourse('') }}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(79,195,161,0.4)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                >
                  <option value="" style={{ background: '#0D1117' }}>Select your school</option>
                  {Object.keys(SCHOOLS).map((s) => (
                    <option key={s} value={s} style={{ background: '#0D1117' }}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Course */}
              {school && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginBottom: 12 }}
                >
                  <label style={labelStyle}>Course</label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(79,195,161,0.4)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  >
                    <option value="" style={{ background: '#0D1117' }}>Select your course</option>
                    {SCHOOLS[school].map((c) => (
                      <option key={c} value={c} style={{ background: '#0D1117' }}>{c}</option>
                    ))}
                  </select>
                </motion.div>
              )}

              {/* Semester */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Current Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(79,195,161,0.4)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                >
                  <option value="" style={{ background: '#0D1117' }}>Select semester</option>
                  {[1,2,3,4,5,6,7,8].map((s) => (
                    <option key={s} value={s} style={{ background: '#0D1117' }}>Semester {s}</option>
                  ))}
                </select>
              </div>

              {/* Student type */}
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Student type</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    { value: 'dayscholar', label: '🏠 Day Scholar' },
                    { value: 'hosteller', label: '🏨 Hosteller' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setStudentType(opt.value as any); setHostel('') }}
                      style={{
                        flex: 1, padding: '12px',
                        borderRadius: 12,
                        border: studentType === opt.value
                          ? '1px solid rgba(79,195,161,0.4)'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: studentType === opt.value
                          ? 'rgba(79,195,161,0.1)'
                          : 'rgba(255,255,255,0.03)',
                        color: studentType === opt.value ? '#4FC3A1' : '#5A6A7E',
                        fontSize: 13, cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'all 0.2s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hostel selection */}
              {studentType === 'hosteller' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ marginBottom: 12 }}
                >
                  <label style={labelStyle}>Your Hostel</label>
                  <select
                    value={hostel}
                    onChange={(e) => setHostel(e.target.value)}
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(79,195,161,0.4)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  >
                    <option value="" style={{ background: '#0D1117' }}>Select your hostel</option>
                    <optgroup label="Boys Hostels" style={{ background: '#0D1117' }}>
                      {BOYS_HOSTELS.map((h) => (
                        <option key={h} value={h} style={{ background: '#0D1117' }}>{h}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Girls Hostels" style={{ background: '#0D1117' }}>
                      {GIRLS_HOSTELS.map((h) => (
                        <option key={h} value={h} style={{ background: '#0D1117' }}>{h}</option>
                      ))}
                    </optgroup>
                  </select>
                </motion.div>
              )}

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#E05C5C' }}>{error}</p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleUniversityInfo}
                disabled={loading}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16,
                  background: 'linear-gradient(135deg, #4FC3A1 0%, #3DA88B 100%)',
                  color: '#080C12', fontSize: 15, fontWeight: 600,
                  border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1,
                  boxShadow: '0 8px 32px rgba(79,195,161,0.25)',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {loading ? 'Saving...' : 'Continue →'}
              </motion.button>
            </motion.div>
          )}

          {/* STEP 4 — Consent */}
          {step === 4 && (
            <motion.div key="step4"
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.4 }}
            >
              <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4FC3A1', marginBottom: 8 }}>
                One last thing
              </p>
              <h2 style={{ fontSize: 30, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 6, fontWeight: 600 }}>
                Your safety net
              </h2>
              <p style={{ fontSize: 13, color: '#5A6A7E', marginBottom: 20, lineHeight: 1.6 }}>
                MindStep monitors your wellbeing silently. If things look serious, the right people will be notified — not your parents.
              </p>

              {/* UCC info box */}
              <div style={{
                padding: '20px', borderRadius: 16, marginBottom: 16,
                background: 'rgba(79,195,161,0.05)',
                border: '1px solid rgba(79,195,161,0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(79,195,161,0.12)', border: '1px solid rgba(79,195,161,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                  }}>🏥</div>
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#4FC3A1', marginBottom: 2 }}>University Counselling Centre</p>
                    <p style={{ fontSize: 11, color: '#3A4A5E' }}>ucc@tnu.in · The Neotia University</p>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#5A6A7E', lineHeight: 1.7 }}>
                  If MindStep detects a serious and persistent sign of distress over multiple days, an automatic alert is sent to the
                  University Counselling Centre. They will reach out to check on your wellbeing and offer support — with full care and sensitivity.
                </p>
                <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(232,160,74,0.06)', border: '1px solid rgba(232,160,74,0.15)' }}>
                  <p style={{ fontSize: 11, color: '#E8A04A', lineHeight: 1.6 }}>
                    ⚠️ You will not be informed when an alert is sent. The counselling team will approach with sensitivity.
                  </p>
                </div>
              </div>

              {/* Consent checkbox */}
              <div
                onClick={() => setConsent(!consent)}
                style={{
                  padding: '16px', borderRadius: 14, marginBottom: 16,
                  background: 'rgba(255,255,255,0.02)',
                  border: consent ? '1px solid rgba(79,195,161,0.3)' : '1px solid rgba(255,255,255,0.07)',
                  cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  background: consent ? '#4FC3A1' : 'transparent',
                  border: consent ? 'none' : '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {consent && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#080C12" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
                <p style={{ fontSize: 12, color: '#5A6A7E', lineHeight: 1.6 }}>
                  I understand that MindStep tracks my daily check-ins to build a personal baseline.
                  I consent to the University Counselling Centre (ucc@tnu.in) being automatically notified
                  if serious and consistent distress is detected in my check-in patterns.
                  This app does not diagnose or replace professional mental health support.
                </p>
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.2)', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: '#E05C5C' }}>{error}</p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleConsent}
                disabled={loading || !consent}
                style={{
                  width: '100%', padding: '16px', borderRadius: 16,
                  background: consent
                    ? 'linear-gradient(135deg, #4FC3A1 0%, #3DA88B 100%)'
                    : 'rgba(255,255,255,0.05)',
                  color: consent ? '#080C12' : '#3A4A5E',
                  fontSize: 15, fontWeight: 600,
                  border: 'none', cursor: consent ? 'pointer' : 'not-allowed',
                  boxShadow: consent ? '0 8px 32px rgba(79,195,161,0.25)' : 'none',
                  fontFamily: 'Inter, sans-serif', transition: 'all 0.3s',
                }}
              >
                {loading ? 'Setting up...' : "I'm ready → Enter MindStep"}
              </motion.button>
            </motion.div>
          )}

        </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}