'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import { useIsMobile } from '@/lib/hooks'

const EMOTION_COLORS: Record<string, string> = {
  Good: '#4FC3A1', Okay: '#5B9CF6', Tired: '#8B9BB0',
  Anxious: '#E8A04A', Flat: '#A78BFA', Overwhelmed: '#E05C5C',
}

const EMOTION_EMOJI: Record<string, string> = {
  Good: '😊', Okay: '😐', Tired: '😴',
  Anxious: '😰', Flat: '😶', Overwhelmed: '😵',
}

type Filter = 'all' | 'week' | 'month'

export default function History() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const [checkins, setCheckins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'grid'>('list')
  const isMobile = useIsMobile()

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
        const userRes = await fetch(`/api/user?firebaseUid=${firebaseUser.uid}`)
        const ud = await userRes.json()
        if (!ud.error) setUserData(ud)

        const res = await fetch(`/api/checkin?userId=${firebaseUser.uid}&limit=60`)
        const data = await res.json()
        setCheckins(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const filtered = checkins.filter((c) => {
    const date = new Date(c.timestamp)
    const now = new Date()
    if (filter === 'week') {
      const weekAgo = new Date()
      weekAgo.setDate(now.getDate() - 7)
      return date >= weekAgo
    }
    if (filter === 'month') {
      const monthAgo = new Date()
      monthAgo.setMonth(now.getMonth() - 1)
      return date >= monthAgo
    }
    return true
  })

  const statusColor = (s: string) =>
    s === 'red' ? '#E05C5C' : s === 'amber' ? '#E8A04A' : '#4FC3A1'

  const avgSleep = checkins.length
    ? (checkins.reduce((a, c) => a + c.sleep, 0) / checkins.length).toFixed(1) : '—'
  const avgSocial = checkins.length
    ? (checkins.reduce((a, c) => a + c.socialEnergy, 0) / checkins.length).toFixed(1) : '—'
  const avgPressure = checkins.length
    ? (checkins.reduce((a, c) => a + c.pressure, 0) / checkins.length).toFixed(1) : '—'

  const greenCount = checkins.filter(c => c.status === 'green').length
  const amberCount = checkins.filter(c => c.status === 'amber').length
  const redCount = checkins.filter(c => c.status === 'red').length

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
        <Sidebar userName={userName} userData={userData} />
        <main style={{
          flex: 1, marginLeft: isMobile ? 0 : '220px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '2px solid rgba(79,195,161,0.1)',
              borderTop: '2px solid #4FC3A1',
            }}
          />
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', top: '10%', right: '15%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,195,161,0.04) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '20%', left: '30%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91,156,246,0.04) 0%, transparent 70%)',
        }} />
      </div>

      <Sidebar userName={userName} userData={userData} />
      {isMobile && <BottomNav userName={userName} />}

      <main style={{
        flex: 1, marginLeft: isMobile ? 0 : '220px',
        minHeight: '100vh', overflowY: 'auto',
        position: 'relative', zIndex: 1,
        paddingBottom: isMobile ? 80 : 0
      }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 40,
          padding: isMobile ? '14px 16px' : '20px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,18,0.92)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          gap: 12, flexWrap: 'wrap'
        }}>
          <div>
            <p style={{
              fontSize: 10, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 3,
            }}>
              Check-in history
            </p>
            <h1 style={{
              fontSize: 24, fontFamily: 'Playfair Display, serif',
              color: '#E8EEF5', fontWeight: 600,
            }}>
              Your journey so far
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', gap: 3, padding: '3px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {[{ id: 'list', icon: '☰' }, { id: 'grid', icon: '⊞' }].map((v) => (
                <button key={v.id} onClick={() => setView(v.id as any)} style={{
                  width: 32, height: 28, borderRadius: 7, border: 'none',
                  background: view === v.id ? 'rgba(79,195,161,0.15)' : 'transparent',
                  color: view === v.id ? '#4FC3A1' : '#3A4A5E',
                  cursor: 'pointer', fontSize: 14, transition: 'all 0.2s',
                }}>
                  {v.icon}
                </button>
              ))}
            </div>

            <div style={{
              display: 'flex', gap: 3, padding: '3px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              {(['all', 'month', 'week'] as Filter[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '5px 14px', borderRadius: 7, border: 'none',
                  background: filter === f ? 'rgba(79,195,161,0.12)' : 'transparent',
                  color: filter === f ? '#4FC3A1' : '#5A6A7E',
                  fontSize: 12, fontWeight: filter === f ? 500 : 400,
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {f === 'all' ? 'All time' : `This ${f}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? '20px 16px' : '28px 32px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 14, marginBottom: 24,
          }}>
            {[
              { label: 'Total logs', value: checkins.length, sub: 'check-ins', color: '#4FC3A1', icon: '📋', glow: 'rgba(79,195,161,0.15)' },
              { label: 'Avg sleep', value: avgSleep, sub: 'out of 10', color: '#5B9CF6', icon: '🌙', glow: 'rgba(91,156,246,0.15)' },
              { label: 'Avg social', value: avgSocial, sub: 'out of 10', color: '#4FC3A1', icon: '🤝', glow: 'rgba(79,195,161,0.15)' },
              { label: 'Avg pressure', value: avgPressure, sub: 'out of 10', color: '#E8A04A', icon: '📚', glow: 'rgba(232,160,74,0.15)' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                style={{
                  padding: '20px', borderRadius: 16,
                  background: `linear-gradient(135deg, ${stat.color}08, rgba(255,255,255,0.02))`,
                  border: `1px solid ${stat.color}20`,
                  position: 'relative', overflow: 'hidden', cursor: 'default',
                }}
              >
                <div style={{
                  position: 'absolute', top: -20, right: -20,
                  width: 80, height: 80, borderRadius: '50%',
                  background: `radial-gradient(circle, ${stat.glow} 0%, transparent 70%)`,
                  pointerEvents: 'none',
                }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <span style={{ fontSize: 22 }}>{stat.icon}</span>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: stat.color, boxShadow: `0 0 8px ${stat.color}` }} />
                </div>
                <p style={{ fontSize: 36, fontWeight: 300, fontFamily: 'Playfair Display, serif', color: stat.color, lineHeight: 1, marginBottom: 6 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 12, color: '#C8D4E0', marginBottom: 2, fontWeight: 500 }}>{stat.label}</p>
                <p style={{ fontSize: 11, color: '#3A4A5E' }}>{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {checkins.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                padding: '20px 24px', borderRadius: 16,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 24,
                display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: 32,
                flexDirection: isMobile ? 'column' : 'row'
              }}
            >
              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 8 }}>
                  Status breakdown
                </p>
                <div style={{ display: 'flex', gap: 24 }}>
                  {[
                    { label: 'Stable', count: greenCount, color: '#4FC3A1' },
                    { label: 'Drifting', count: amberCount, color: '#E8A04A' },
                    { label: 'Alert', count: redCount, color: '#E05C5C' },
                  ].map((s) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                      <span style={{ fontSize: 13, color: s.color, fontWeight: 500 }}>{s.count}</span>
                      <span style={{ fontSize: 12, color: '#3A4A5E' }}>{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 3, height: 40 }}>
                {checkins.slice(0, 30).reverse().map((c, i) => {
                  const sc = statusColor(c.status)
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      animate={{ height: `${(c.sleep / 10) * 100}%` }}
                      transition={{ delay: i * 0.02, duration: 0.4 }}
                      style={{
                        flex: 1, borderRadius: 2,
                        background: `${sc}60`, border: `1px solid ${sc}40`, minHeight: 4,
                      }}
                    />
                  )
                })}
              </div>
            </motion.div>
          )}

          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                padding: '80px 32px', textAlign: 'center',
                borderRadius: 20,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
              <h3 style={{ fontSize: 22, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 8 }}>
                No check-ins yet
              </h3>
              <p style={{ fontSize: 13, color: '#5A6A7E', marginBottom: 24 }}>
                Start logging daily to build your history.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/checkin')}
                style={{
                  padding: '12px 28px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)',
                  color: '#080C12', fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(79,195,161,0.3)',
                }}
              >
                Log first check-in →
              </motion.button>
            </motion.div>
          ) : view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
              {filtered.map((c, i) => {
                const sc = statusColor(c.status)
                const ec = EMOTION_COLORS[c.emotion] || '#5A6A7E'
                return (
                  <motion.div
                    key={c.id || i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ y: -4 }}
                    style={{
                      padding: '20px', borderRadius: 16,
                      background: `linear-gradient(135deg, ${sc}06, rgba(255,255,255,0.02))`,
                      border: `1px solid ${sc}20`,
                      cursor: 'default', position: 'relative', overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: -30, right: -30,
                      width: 100, height: 100, borderRadius: '50%',
                      background: `radial-gradient(circle, ${sc}15 0%, transparent 70%)`,
                      pointerEvents: 'none',
                    }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <p style={{ fontSize: 14, color: '#C8D4E0', fontWeight: 500 }}>
                          {new Date(c.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p style={{ fontSize: 11, color: '#3A4A5E' }}>
                          {new Date(c.timestamp).toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 20,
                        background: `${sc}15`, border: `1px solid ${sc}30`,
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: sc, boxShadow: `0 0 4px ${sc}` }} />
                        <span style={{ fontSize: 10, color: sc, fontWeight: 600, textTransform: 'capitalize' }}>{c.status}</span>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16,
                      padding: '10px 12px', borderRadius: 10,
                      background: `${ec}10`, border: `1px solid ${ec}20`,
                    }}>
                      <span style={{ fontSize: 20 }}>{EMOTION_EMOJI[c.emotion] || '😐'}</span>
                      <div>
                        <p style={{ fontSize: 13, color: ec, fontWeight: 500 }}>{c.emotion || 'Not set'}</p>
                        <p style={{ fontSize: 10, color: '#3A4A5E' }}>Feeling</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[
                        { label: 'Sleep', value: c.sleep, color: '#5B9CF6' },
                        { label: 'Social', value: c.socialEnergy, color: '#4FC3A1' },
                        { label: 'Pressure', value: c.pressure, color: '#E8A04A' },
                      ].map((m) => (
                        <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <p style={{ fontSize: 10, color: '#3A4A5E', width: 52, flexShrink: 0 }}>{m.label}</p>
                          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                            <div style={{ width: `${m.value * 10}%`, height: '100%', borderRadius: 2, background: m.color }} />
                          </div>
                          <p style={{ fontSize: 11, color: m.color, width: 16, textAlign: 'right', fontWeight: 500 }}>{m.value}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      marginTop: 12, padding: '6px 10px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ fontSize: 12 }}>
                        {c.ate === 'yes' ? '✅' : c.ate === 'somewhat' ? '🟡' : '❌'}
                      </span>
                      <span style={{
                        fontSize: 11,
                        color: c.ate === 'yes' ? '#4FC3A1' : c.ate === 'somewhat' ? '#E8A04A' : '#E05C5C',
                        textTransform: 'capitalize',
                      }}>
                        Ate: {c.ate}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((c, i) => {
                const sc = statusColor(c.status)
                const ec = EMOTION_COLORS[c.emotion] || '#5A6A7E'
                const isExp = expanded === (c.id || String(i))
                return (
                  <motion.div
                    key={c.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.005 }}
                      onClick={() => setExpanded(isExp ? null : (c.id || String(i)))}
                      style={{
                        padding: '16px 20px',
                        borderRadius: isExp ? '16px 16px 0 0' : 16,
                        background: isExp
                          ? `linear-gradient(135deg, ${sc}08, rgba(255,255,255,0.03))`
                          : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isExp ? sc + '25' : 'rgba(255,255,255,0.06)'}`,
                        borderBottom: isExp ? 'none' : undefined,
                        cursor: 'pointer',
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : '160px 1fr 1fr 1fr 100px 120px 90px 24px',
                        alignItems: 'center', gap: 16, transition: 'all 0.2s',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 13, color: '#C8D4E0', fontWeight: 500 }}>
                          {new Date(c.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </p>
                        <p style={{ fontSize: 11, color: '#3A4A5E' }}>
                          {new Date(c.timestamp).toLocaleDateString('en-US', { weekday: 'long' })}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: '#3A4A5E', marginBottom: 4 }}>Sleep</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(91,156,246,0.1)', overflow: 'hidden' }}>
                            <div style={{ width: `${c.sleep * 10}%`, height: '100%', background: '#5B9CF6', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#5B9CF6', fontWeight: 500 }}>{c.sleep}</span>
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: '#3A4A5E', marginBottom: 4 }}>Social</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(79,195,161,0.1)', overflow: 'hidden' }}>
                            <div style={{ width: `${c.socialEnergy * 10}%`, height: '100%', background: '#4FC3A1', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#4FC3A1', fontWeight: 500 }}>{c.socialEnergy}</span>
                        </div>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, color: '#3A4A5E', marginBottom: 4 }}>Pressure</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(232,160,74,0.1)', overflow: 'hidden' }}>
                            <div style={{ width: `${c.pressure * 10}%`, height: '100%', background: '#E8A04A', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 12, color: '#E8A04A', fontWeight: 500 }}>{c.pressure}</span>
                        </div>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <span style={{ fontSize: 13 }}>
                          {c.ate === 'yes' ? '✅' : c.ate === 'somewhat' ? '🟡' : '❌'}
                        </span>
                        <span style={{
                          fontSize: 11,
                          color: c.ate === 'yes' ? '#4FC3A1' : c.ate === 'somewhat' ? '#E8A04A' : '#E05C5C',
                          textTransform: 'capitalize',
                        }}>
                          {c.ate}
                        </span>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '4px 10px', borderRadius: 8,
                        background: `${ec}10`, border: `1px solid ${ec}20`,
                      }}>
                        <span style={{ fontSize: 14 }}>{EMOTION_EMOJI[c.emotion] || '😐'}</span>
                        <span style={{ fontSize: 12, color: ec, fontWeight: 500 }}>{c.emotion || '—'}</span>
                      </div>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '4px 10px', borderRadius: 20,
                        background: `${sc}12`, border: `1px solid ${sc}25`, width: 'fit-content',
                      }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: sc, boxShadow: `0 0 5px ${sc}` }} />
                        <span style={{ fontSize: 11, color: sc, fontWeight: 600, textTransform: 'capitalize' }}>{c.status}</span>
                      </div>
                      <motion.div
                        animate={{ rotate: isExp ? 180 : 0 }}
                        style={{ color: '#3A4A5E', fontSize: 12, textAlign: 'center' }}
                      >
                        ▼
                      </motion.div>
                    </motion.div>
                    <AnimatePresence>
                      {isExp && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{
                            padding: '16px 20px',
                            borderRadius: '0 0 16px 16px',
                            background: `${sc}05`,
                            border: `1px solid ${sc}20`,
                            borderTop: `1px solid ${sc}10`,
                            display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: isMobile ? 20 : 40,
                          }}>
                            <div>
                              <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 4 }}>Logged at</p>
                              <p style={{ fontSize: 13, color: '#8B9BB0' }}>
                                {new Date(c.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div>
                              <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 4 }}>All scores</p>
                              <p style={{ fontSize: 13, color: '#8B9BB0' }}>
                                Sleep {c.sleep} · Social {c.socialEnergy} · Pressure {c.pressure}
                              </p>
                            </div>
                            <div>
                              <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 4 }}>Status</p>
                              <p style={{ fontSize: 13, color: sc, fontWeight: 500, textTransform: 'capitalize' }}>{c.status} day</p>
                            </div>
                            <div>
                              <p style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 4 }}>Nutrition</p>
                              <p style={{
                                fontSize: 13,
                                color: c.ate === 'yes' ? '#4FC3A1' : c.ate === 'somewhat' ? '#E8A04A' : '#E05C5C',
                                textTransform: 'capitalize',
                              }}>
                                {c.ate}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}