'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Sidebar from '@/components/Sidebar'

export default function Profile() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [notificationTime, setNotificationTime] = useState('21:00')

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/onboarding'); return }
      setUser(firebaseUser)
      setUserName(
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        'Student'
      )
      try {
        const res = await fetch(`/api/user?firebaseUid=${firebaseUser.uid}`)
        const data = await res.json()
        if (!data.error) {
          setUserData(data)
          setName(data.name || '')
          setNotificationTime(data.notificationTime || '21:00')
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: user.uid,
          name,
          notificationTime,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#E8EEF5', fontSize: 13, outline: 'none',
    transition: 'border-color 0.2s', fontFamily: 'Inter, sans-serif',
  }

  const labelStyle = {
    fontSize: 11, letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#3A4A5E', marginBottom: 6,
    display: 'block', fontWeight: 600,
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
        <Sidebar userName={userName} userData={userData} />
        <main style={{ flex: 1, marginLeft: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(79,195,161,0.1)', borderTop: '2px solid #4FC3A1' }} />
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '10%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,161,0.04) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.04) 0%, transparent 70%)' }} />
      </div>

      <Sidebar userName={userName} userData={userData} />

      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh', overflowY: 'auto', position: 'relative', zIndex: 1 }}>

        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 40, padding: '20px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,18,0.92)', backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 3 }}>Settings</p>
            <h1 style={{ fontSize: 24, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', fontWeight: 600 }}>Your profile</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSave} disabled={saving}
            style={{
              padding: '10px 24px', borderRadius: 12, border: 'none',
              background: saved ? 'rgba(79,195,161,0.15)' : 'linear-gradient(135deg, #4FC3A1, #3DA88B)',
              color: saved ? '#4FC3A1' : '#080C12', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.3s',
              boxShadow: saved ? 'none' : '0 4px 20px rgba(79,195,161,0.3)',
            }}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save changes'}
          </motion.button>
        </div>

        <div style={{ padding: '32px', maxWidth: 900 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Avatar card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '28px', borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(79,195,161,0.06), rgba(91,156,246,0.04))',
                  border: '1px solid rgba(79,195,161,0.15)',
                  display: 'flex', alignItems: 'center', gap: 20,
                }}
              >
                <div style={{ position: 'relative' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    style={{
                      position: 'absolute', inset: -3, borderRadius: '50%',
                      border: '1px solid transparent',
                      borderTopColor: '#4FC3A1', borderRightColor: '#5B9CF6',
                    }}
                  />
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(79,195,161,0.2), rgba(91,156,246,0.2))',
                    border: '1px solid rgba(79,195,161,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 700, color: '#4FC3A1',
                    fontFamily: 'Playfair Display, serif',
                  }}>
                    {(name || userName)[0]?.toUpperCase()}
                  </div>
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 4 }}>
                    {name || userName}
                  </h2>
                  <p style={{ fontSize: 12, color: '#5A6A7E', marginBottom: 8 }}>{user?.email}</p>

                  {/* University badges */}
                  {userData?.course && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: '#4FC3A1', padding: '2px 8px', borderRadius: 20, background: 'rgba(79,195,161,0.08)', border: '1px solid rgba(79,195,161,0.15)', fontWeight: 500 }}>
                        {userData.course}
                      </span>
                      {userData.semester && (
                        <span style={{ fontSize: 10, color: '#5B9CF6', padding: '2px 8px', borderRadius: 20, background: 'rgba(91,156,246,0.08)', border: '1px solid rgba(91,156,246,0.15)', fontWeight: 500 }}>
                          Sem {userData.semester}
                        </span>
                      )}
                      {userData.studentType === 'hosteller' && userData.hostel && (
                        <span style={{ fontSize: 10, color: '#A78BFA', padding: '2px 8px', borderRadius: 20, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', fontWeight: 500 }}>
                          🏨 {userData.hostel}
                        </span>
                      )}
                      {userData.studentType === 'dayscholar' && (
                        <span style={{ fontSize: 10, color: '#E8A04A', padding: '2px 8px', borderRadius: 20, background: 'rgba(232,160,74,0.08)', border: '1px solid rgba(232,160,74,0.15)', fontWeight: 500 }}>
                          🏠 Day Scholar
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: 'rgba(79,195,161,0.1)', border: '1px solid rgba(79,195,161,0.2)' }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#4FC3A1', boxShadow: '0 0 6px #4FC3A1' }} />
                    <span style={{ fontSize: 10, color: '#4FC3A1', fontWeight: 600 }}>Active student</span>
                  </div>
                </div>
              </motion.div>

              {/* University info card */}
              {userData?.uid && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(91,156,246,0.1)', border: '1px solid rgba(91,156,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎓</div>
                    <h3 style={{ fontSize: 14, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>University details</h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { label: 'University ID', value: userData.uid, color: '#5B9CF6' },
                      { label: 'School', value: userData.school, color: '#4FC3A1' },
                      { label: 'Course', value: userData.course, color: '#4FC3A1' },
                      { label: 'Roll Number', value: userData.rollNumber, color: '#A78BFA' },
                      { label: 'Semester', value: userData.semester ? `Semester ${userData.semester}` : '—', color: '#5B9CF6' },
                      { label: 'Student Type', value: userData.studentType === 'hosteller' ? `Hosteller — ${userData.hostel}` : 'Day Scholar', color: '#E8A04A' },
                    ].map((item) => (
                      <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ fontSize: 11, color: '#3A4A5E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</span>
                        <span style={{ fontSize: 12, color: item.color, fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{item.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Personal info */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(91,156,246,0.1)', border: '1px solid rgba(91,156,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
                  <h3 style={{ fontSize: 14, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>Personal information</h3>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Display name</label>
                  <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name"
                    onFocus={(e) => e.target.style.borderColor = 'rgba(79,195,161,0.4)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={labelStyle}>Email address</label>
                  <input style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} value={user?.email || ''} disabled />
                  <p style={{ fontSize: 11, color: '#3A4A5E', marginTop: 4 }}>Email cannot be changed here</p>
                </div>
                <div>
                  <label style={labelStyle}>Daily reminder time</label>
                  <input type="time" style={inputStyle} value={notificationTime} onChange={(e) => setNotificationTime(e.target.value)}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(79,195,161,0.4)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
                  <p style={{ fontSize: 11, color: '#3A4A5E', marginTop: 4 }}>When you want your daily check-in reminder</p>
                </div>
              </motion.div>

              {/* Stats card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(232,160,74,0.1)', border: '1px solid rgba(232,160,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>📊</div>
                  <h3 style={{ fontSize: 14, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>Your stats</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Current streak', value: `${userData?.streak || 0} days`, color: '#E8A04A', icon: '🔥' },
                    { label: 'Member since', value: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—', color: '#5B9CF6', icon: '📅' },
                    { label: 'Consent given', value: userData?.consentGiven ? 'Yes' : 'No', color: userData?.consentGiven ? '#4FC3A1' : '#E05C5C', icon: '✅' },
                    { label: 'Baseline', value: 'Building', color: '#A78BFA', icon: '📈' },
                  ].map((stat) => (
                    <div key={stat.label} style={{ padding: '14px', borderRadius: 12, background: `${stat.color}08`, border: `1px solid ${stat.color}20` }}>
                      <div style={{ fontSize: 18, marginBottom: 6 }}>{stat.icon}</div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: stat.color, marginBottom: 2 }}>{stat.value}</p>
                      <p style={{ fontSize: 11, color: '#3A4A5E' }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* UCC Alert info */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                style={{ padding: '24px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(79,195,161,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(79,195,161,0.2)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(79,195,161,0.1)', border: '1px solid rgba(79,195,161,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏥</div>
                  <h3 style={{ fontSize: 14, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>Emergency alert</h3>
                </div>
                <p style={{ fontSize: 12, color: '#5A6A7E', marginBottom: 16, lineHeight: 1.7 }}>
                  If MindStep detects serious and persistent distress in your check-in patterns, an automatic
                  alert is sent to the University Counselling Centre. They will reach out to check on your
                  wellbeing and offer support or a session.
                </p>
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {[
                    { label: 'Notified team', value: 'University Counselling Centre', color: '#4FC3A1' },
                    { label: 'Contact', value: 'ucc@tnu.in', color: '#5B9CF6' },
                    { label: 'Trigger', value: 'RED drift detected', color: '#E05C5C' },
                    { label: 'Your privacy', value: 'Alert is confidential', color: '#A78BFA' },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize: 11, color: '#3A4A5E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</span>
                      <span style={{ fontSize: 12, color: item.color, fontWeight: 500 }}>{item.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <span style={{ fontSize: 11, color: '#3A4A5E', letterSpacing: '0.08em', textTransform: 'uppercase' }}>You are notified</span>
                    <span style={{ fontSize: 12, color: '#E8A04A', fontWeight: 500 }}>No — team contacts you</span>
                  </div>
                </div>
              </motion.div>

              {/* Privacy */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(79,195,161,0.1)', border: '1px solid rgba(79,195,161,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🔒</div>
                  <h3 style={{ fontSize: 14, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>Privacy & data</h3>
                </div>
                {[
                  { icon: '🔐', title: 'End-to-end encrypted', desc: 'All your check-in data is encrypted at rest and in transit.' },
                  { icon: '🚫', title: 'No selling of data', desc: 'Your data is never sold or shared with third parties.' },
                  { icon: '👁', title: 'You control sharing', desc: 'Only you and your designated contact can see your data.' },
                  { icon: '🗑', title: 'Delete anytime', desc: 'You can request full data deletion at any time.' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#C8D4E0', marginBottom: 2 }}>{item.title}</p>
                      <p style={{ fontSize: 12, color: '#3A4A5E', lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* What MindStep never does */}
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                style={{ padding: '24px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(167,139,250,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(167,139,250,0.15)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🧠</div>
                  <h3 style={{ fontSize: 14, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>What MindStep never does</h3>
                </div>
                {[
                  'Diagnose any mental health condition',
                  'Use clinical or alarming language',
                  'Compare you to other students',
                  'Share data without your consent',
                  'Replace professional mental health support',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#E05C5C', fontWeight: 700, flexShrink: 0 }}>✕</div>
                    <p style={{ fontSize: 12, color: '#5A6A7E' }}>{item}</p>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}