'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import Sidebar from '@/components/Sidebar'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Engine } from '@tsparticles/engine'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userData, setUserData] = useState<any>(null)
  const [baseline, setBaseline] = useState<any>(null)
  const [checkins, setCheckins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [driftStatus, setDriftStatus] = useState<'green' | 'amber' | 'red'>('green')
  const [particlesInit, setParticlesInit] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setParticlesInit(true)
    })
  }, [])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push('/onboarding')
        return
      }
      setUser(firebaseUser)
      try {
        const userRes = await fetch(`/api/user?firebaseUid=${firebaseUser.uid}`)
        const ud = await userRes.json()
        if (!ud.error) setUserData(ud)

        const baselineRes = await fetch(`/api/baseline?userId=${firebaseUser.uid}`)
        const bd = await baselineRes.json()
        if (bd.baseline) setBaseline(bd.baseline)
        setCheckins(bd.recentCheckins || [])

        if (bd.recentCheckins?.length > 0) {
          const last3 = bd.recentCheckins.slice(-3)
          if (last3.some((c: any) => c.status === 'red')) setDriftStatus('red')
          else if (last3.some((c: any) => c.status === 'amber')) setDriftStatus('amber')
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const chartData = checkins.map((c: any, i: number) => ({
    day: `D${i + 1}`,
    sleep: c.sleep,
    social: c.socialEnergy,
    pressure: c.pressure,
  }))

  const statusConfig = {
    green: {
      color: '#4FC3A1',
      bg: 'rgba(79,195,161,0.08)',
      border: 'rgba(79,195,161,0.2)',
      label: 'Stable',
      message: "You're doing well. Your baseline is holding steady.",
    },
    amber: {
      color: '#E8A04A',
      bg: 'rgba(232,160,74,0.08)',
      border: 'rgba(232,160,74,0.2)',
      label: 'Drifting',
      message: "You've seemed a bit low this week. Consider talking to someone.",
    },
    red: {
      color: '#E05C5C',
      bg: 'rgba(224,92,92,0.08)',
      border: 'rgba(224,92,92,0.2)',
      label: 'Needs attention',
      message: "Your pattern looks different. Someone who cares has been notified.",
    },
  }

  const status = statusConfig[driftStatus]

  const stats = [
    {
      label: 'Sleep Quality',
      value: baseline ? baseline.avgSleep.toFixed(1) : '—',
      sub: 'avg score',
      color: '#5B9CF6',
      icon: '🌙',
    },
    {
      label: 'Social Energy',
      value: baseline ? baseline.avgSocialEnergy.toFixed(1) : '—',
      sub: 'avg score',
      color: '#4FC3A1',
      icon: '🤝',
    },
    {
      label: 'Pressure Level',
      value: baseline ? baseline.avgPressure.toFixed(1) : '—',
      sub: 'avg score',
      color: '#E8A04A',
      icon: '📚',
    },
    {
      label: 'Days Logged',
      value: baseline ? baseline.totalDays : '0',
      sub: baseline?.totalDays >= 7
        ? '✓ baseline active'
        : `${7 - (baseline?.totalDays || 0)} more needed`,
      color: '#A78BFA',
      icon: '📅',
    },
  ]

  const userName =
    userData?.name ||
    user?.displayName ||
    user?.email?.split('@')[0] ||
    'Student'

  const greeting =
    new Date().getHours() < 12
      ? 'Good morning'
      : new Date().getHours() < 17
      ? 'Good afternoon'
      : 'Good evening'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080C12' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '2px solid rgba(79,195,161,0.1)',
            borderTop: '2px solid #4FC3A1',
          }}
        />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>

      {/* Particles */}
      {particlesInit && <Particles
        id="tsparticles"
        options={{
          background: { color: { value: 'transparent' } },
          fpsLimit: 30,
          particles: {
            color: { value: '#4FC3A1' },
            links: { color: '#4FC3A1', distance: 180, enable: true, opacity: 0.04, width: 1 },
            move: { enable: true, speed: 0.3 },
            number: { value: 30 },
            opacity: { value: 0.06 },
            size: { value: { min: 1, max: 2 } },
          },
        }}
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      />}

      <Sidebar userName={userName} userData={userData} />

      <main style={{
        flex: 1, marginLeft: '220px',
        minHeight: '100vh', overflowY: 'auto',
        position: 'relative', zIndex: 1,
      }}>

        {/* Top bar */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 40,
          padding: '16px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,18,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div>
            <p style={{
              fontSize: 11, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: '#5A6A7E', marginBottom: 2,
            }}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric'
              })}
            </p>
            <h1 style={{
              fontSize: 22, fontFamily: 'Playfair Display, serif',
              fontWeight: 600, color: '#E8EEF5',
            }}>
              {greeting},{' '}
              <span style={{ color: '#4FC3A1' }}>
                {userName.split(' ')[0]}
              </span>
            </h1>

            {/* University badges */}
            {userData?.course && (
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 6, marginTop: 6, flexWrap: 'wrap',
              }}>
                <span style={{
                  fontSize: 11, color: '#4FC3A1',
                  padding: '2px 10px', borderRadius: 20,
                  background: 'rgba(79,195,161,0.08)',
                  border: '1px solid rgba(79,195,161,0.15)',
                  fontWeight: 500,
                }}>
                  {userData.course}
                </span>
                {userData.semester && (
                  <span style={{
                    fontSize: 11, color: '#5B9CF6',
                    padding: '2px 10px', borderRadius: 20,
                    background: 'rgba(91,156,246,0.08)',
                    border: '1px solid rgba(91,156,246,0.15)',
                    fontWeight: 500,
                  }}>
                    Sem {userData.semester}
                  </span>
                )}
                {userData.studentType === 'hosteller' && userData.hostel && (
                  <span style={{
                    fontSize: 11, color: '#A78BFA',
                    padding: '2px 10px', borderRadius: 20,
                    background: 'rgba(167,139,250,0.08)',
                    border: '1px solid rgba(167,139,250,0.15)',
                    fontWeight: 500,
                  }}>
                    🏨 {userData.hostel}
                  </span>
                )}
                {userData.studentType === 'dayscholar' && (
                  <span style={{
                    fontSize: 11, color: '#E8A04A',
                    padding: '2px 10px', borderRadius: 20,
                    background: 'rgba(232,160,74,0.08)',
                    border: '1px solid rgba(232,160,74,0.15)',
                    fontWeight: 500,
                  }}>
                    🏠 Day Scholar
                  </span>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 24,
              background: status.bg, border: `1px solid ${status.border}`,
            }}>
              <motion.div
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', background: status.color }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: status.color }}>
                {status.label}
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/checkin')}
              style={{
                padding: '8px 20px', borderRadius: 24,
                background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)',
                color: '#080C12', fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(79,195,161,0.3)',
              }}
            >
              + Log today
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '32px' }}>

          {/* Status banner */}
          {driftStatus !== 'green' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginBottom: 24, padding: '16px 20px', borderRadius: 16,
                background: status.bg, border: `1px solid ${status.border}`,
                display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 10, height: 10, borderRadius: '50%', background: status.color, flexShrink: 0 }}
              />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: status.color, marginBottom: 2 }}>
                  {status.label}
                </p>
                <p style={{ fontSize: 13, color: '#8B9BB0' }}>{status.message}</p>
              </div>
            </motion.div>
          )}

          {/* Stats grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16, marginBottom: 24,
          }}>
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                style={{
                  padding: '24px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'default',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <span style={{ fontSize: 24 }}>{stat.icon}</span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: stat.color }} />
                </div>
                <p style={{
                  fontSize: 40, fontWeight: 300, color: stat.color,
                  fontFamily: 'Playfair Display, serif', lineHeight: 1, marginBottom: 8,
                }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#E8EEF5', marginBottom: 3 }}>
                  {stat.label}
                </p>
                <p style={{ fontSize: 11, color: '#5A6A7E' }}>{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr',
            gap: 16, marginBottom: 24,
          }}>

            {/* Baseline chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                padding: '24px', borderRadius: 20,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                <div>
                  <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5A6A7E', marginBottom: 4 }}>
                    Baseline tracker
                  </p>
                  <h3 style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>
                    Your personal pattern
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { color: '#5B9CF6', label: 'Sleep' },
                    { color: '#4FC3A1', label: 'Social' },
                    { color: '#E8A04A', label: 'Pressure' },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                      <span style={{ fontSize: 11, color: '#5A6A7E' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {checkins.length === 0 ? (
                <div style={{
                  height: 200, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 16,
                    background: 'rgba(79,195,161,0.1)',
                    border: '1px solid rgba(79,195,161,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>
                    📊
                  </div>
                  <p style={{ fontSize: 13, color: '#5A6A7E', textAlign: 'center', lineHeight: 1.6 }}>
                    No data yet.<br />Log your first check-in to start tracking.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => router.push('/checkin')}
                    style={{
                      padding: '8px 16px', borderRadius: 12,
                      background: 'rgba(79,195,161,0.1)',
                      border: '1px solid rgba(79,195,161,0.2)',
                      color: '#4FC3A1', fontSize: 13, cursor: 'pointer',
                    }}
                  >
                    Start logging →
                  </motion.button>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                    <defs>
                      <linearGradient id="gSleep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5B9CF6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#5B9CF6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gSocial" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4FC3A1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#4FC3A1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" tick={{ fill: '#5A6A7E', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#5A6A7E', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{
                      background: '#0D1117', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12, color: '#E8EEF5', fontSize: 12,
                    }} />
                    <Area type="monotone" dataKey="sleep" stroke="#5B9CF6" strokeWidth={2} fill="url(#gSleep)" dot={false} />
                    <Area type="monotone" dataKey="social" stroke="#4FC3A1" strokeWidth={2} fill="url(#gSocial)" dot={false} />
                    <Line type="monotone" dataKey="pressure" stroke="#E8A04A" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </motion.div>

            {/* Right cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Streak */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{
                  flex: 1, padding: '24px', borderRadius: 20,
                  background: 'rgba(232,160,74,0.05)',
                  border: '1px solid rgba(232,160,74,0.15)',
                }}
              >
                <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5A6A7E', marginBottom: 12 }}>
                  Current streak
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                  <motion.p
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    style={{
                      fontSize: 64, fontWeight: 300, color: '#E8A04A',
                      fontFamily: 'Playfair Display, serif', lineHeight: 1,
                    }}
                  >
                    {userData?.streak || 0}
                  </motion.p>
                  <span style={{ fontSize: 16, color: '#5A6A7E', marginBottom: 8 }}>days</span>
                </div>
                <p style={{ fontSize: 12, color: '#5A6A7E' }}>
                  {(userData?.streak || 0) >= 7 ? '🔥 On fire! Keep going.' : 'Log daily to build your streak'}
                </p>
              </motion.div>

              {/* Baseline status */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                style={{
                  flex: 1, padding: '24px', borderRadius: 20,
                  background: 'rgba(167,139,250,0.05)',
                  border: '1px solid rgba(167,139,250,0.15)',
                }}
              >
                <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5A6A7E', marginBottom: 12 }}>
                  Baseline status
                </p>
                {baseline?.totalDays >= 7 ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4FC3A1' }} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#4FC3A1' }}>Active</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#5A6A7E', lineHeight: 1.6 }}>
                      Drift detection is running on your personal baseline.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{
                      fontSize: 36, fontWeight: 300, color: '#A78BFA',
                      fontFamily: 'Playfair Display, serif', lineHeight: 1, marginBottom: 4,
                    }}>
                      {7 - (baseline?.totalDays || 0)}
                      <span style={{ fontSize: 14, color: '#5A6A7E', marginLeft: 6 }}>days left</span>
                    </p>
                    <p style={{ fontSize: 12, color: '#5A6A7E', marginBottom: 12 }}>
                      until baseline is established
                    </p>
                    <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((baseline?.totalDays || 0) / 7) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        style={{ height: '100%', borderRadius: 2, background: '#A78BFA' }}
                      />
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </div>

          {/* Recent check-ins */}
          {checkins.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                padding: '24px', borderRadius: 20,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5A6A7E', marginBottom: 16 }}>
                Recent check-ins
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 10 }}>
                {checkins.slice(0, 7).map((c: any, i: number) => {
                  const sc = c.status === 'red' ? '#E05C5C' : c.status === 'amber' ? '#E8A04A' : '#4FC3A1'
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      whileHover={{ y: -3 }}
                      style={{
                        padding: '14px 8px', borderRadius: 14,
                        background: `${sc}08`, border: `1px solid ${sc}25`,
                        textAlign: 'center', cursor: 'default',
                      }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc, margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 11, fontWeight: 500, color: sc, marginBottom: 4 }}>
                        {c.emotion?.slice(0, 4) || '—'}
                      </p>
                      <p style={{ fontSize: 10, color: '#5A6A7E' }}>
                        {new Date(c.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                      </p>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </div>
      </main>
      {/* Aura floating badge */}
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: 1 }}
  whileHover={{ scale: 1.05 }}
  onClick={() => router.push('/companion')}
  style={{
    position: 'fixed', bottom: 32, right: 32,
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 20px', borderRadius: 20,
    background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.08))',
    border: '1px solid rgba(167,139,250,0.3)',
    cursor: 'pointer', zIndex: 50,
    boxShadow: '0 8px 32px rgba(167,139,250,0.2)',
    backdropFilter: 'blur(20px)',
  }}
>
  <motion.div
    animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
    transition={{ duration: 3, repeat: Infinity }}
    style={{
      width: 28, height: 28, borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(167,139,250,0.4) 0%, rgba(167,139,250,0.1) 70%)',
      border: '1px solid rgba(167,139,250,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14,
      boxShadow: '0 0 12px rgba(167,139,250,0.3)',
    }}
  >
    ✦
  </motion.div>
  <div>
    <p style={{ fontSize: 11, fontWeight: 600, color: '#A78BFA', lineHeight: 1, marginBottom: 2 }}>
      Aura AI
    </p>
    <p style={{ fontSize: 10, color: '#5A6A7E', lineHeight: 1 }}>
      {driftStatus !== 'green' ? 'Wants to check in with you' : 'Your companion is here'}
    </p>
  </div>
  <motion.div
    animate={{ opacity: [1, 0.3, 1] }}
    transition={{ duration: 2, repeat: Infinity }}
    style={{ width: 6, height: 6, borderRadius: '50%', background: driftStatus !== 'green' ? '#E8A04A' : '#A78BFA', boxShadow: `0 0 6px ${driftStatus !== 'green' ? '#E8A04A' : '#A78BFA'}` }}
  />
</motion.div>
    </div>
  )
}