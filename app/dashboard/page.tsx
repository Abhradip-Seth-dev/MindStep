'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/UserContext'
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import Sidebar from '@/components/Sidebar'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'

// ── XP helpers ────────────────────────────────────────────────────────────
const XP_PER_LEVEL = 500
function calcXP(checkins: any[], streak: number) { return checkins.length * 50 + streak * 30 }
function calcLevel(xp: number) { return Math.floor(xp / XP_PER_LEVEL) + 1 }
function xpProgress(xp: number) { return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100 }

const LEVEL_COLORS = ['#4FC3A1','#4FC3A1','#5B9CF6','#5B9CF6','#A78BFA','#A78BFA','#E8A04A','#E8A04A','#E05C5C','#ffd700']
function getLevelColor(l: number) { return LEVEL_COLORS[Math.min(l-1, LEVEL_COLORS.length-1)] }

export default function Dashboard() {
  const router = useRouter()
  const { user, userData, baseline, checkins, loading } = useUser()
  const [driftStatus, setDriftStatus] = useState<'green' | 'amber' | 'red'>('green')
  const [particlesInit, setParticlesInit] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => await loadSlim(engine)).then(() => setParticlesInit(true))
  }, [])

  useEffect(() => {
    // TEMPORARILY DISABLED to debug redirect loop
    // if (!loading && !user) router.push('/onboarding')
  }, [user, loading, router])

  useEffect(() => {
    if (checkins.length > 0) {
      const last3 = checkins.slice(-3)
      if (last3.some((c: any) => c.status === 'red')) setDriftStatus('red')
      else if (last3.some((c: any) => c.status === 'amber')) setDriftStatus('amber')
    }
  }, [checkins])

  const chartData = checkins.map((c: any, i: number) => ({
    day: `D${i + 1}`,
    sleep: c.sleep,
    social: c.socialEnergy,
    pressure: c.pressure,
  }))

  const statusConfig = {
    green: { color: '#4FC3A1', bg: 'rgba(79,195,161,0.08)', border: 'rgba(79,195,161,0.2)', label: 'Stable Baseline', message: "You're doing well. Your baseline is holding steady." },
    amber: { color: '#E8A04A', bg: 'rgba(232,160,74,0.08)', border: 'rgba(232,160,74,0.2)', label: 'Drifting Detected', message: "You've seemed a bit low this week. Consider talking to someone." },
    red: { color: '#E05C5C', bg: 'rgba(224,92,92,0.08)', border: 'rgba(224,92,92,0.2)', label: 'Needs Attention', message: "Your pattern looks very different. Someone who cares has been notified." },
  }
  const status = statusConfig[driftStatus]

  const userName = userData?.name || user?.displayName || user?.email?.split('@')[0] || 'Student'
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening'

  // XP logic
  const streak = userData?.streak || 0
  const totalXP = calcXP(checkins, streak)
  const level = calcLevel(totalXP)
  const levelColor = getLevelColor(level)
  const progress = xpProgress(totalXP)

  // Aura's Insight
  const lastC = checkins[checkins.length - 1]
  const insight = lastC
    ? (lastC.status === 'red' ? 'Your latest check-in showed high stress. Please take it easy today.'
      : lastC.sleep < 5 ? 'Your sleep was very low last night. Try to rest early tonight for a better tomorrow.'
      : lastC.status === 'green' ? 'You are in a great baseline state! Whatever you are doing, it is working.'
      : 'You are doing okay, but remember to take breaks and stay hydrated.')
    : 'Log your first check-in to get daily insights from Aura.'

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080C12' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid rgba(79,195,161,0.1)', borderTop: '2px solid #4FC3A1' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Particles BG */}
      {particlesInit && <Particles id="tsparticles" options={{
        background: { color: { value: 'transparent' } }, fpsLimit: 30,
        particles: {
          color: { value: '#4FC3A1' }, links: { color: '#4FC3A1', distance: 180, enable: true, opacity: 0.04, width: 1 },
          move: { enable: true, speed: 0.3 }, number: { value: 30 }, opacity: { value: 0.06 }, size: { value: { min: 1, max: 2 } },
        }
      }} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />}

      <Sidebar userName={userName} userData={userData} />

      <main style={{ flex: 1, marginLeft: 220, minHeight: '100vh', overflowY: 'auto', position: 'relative', zIndex: 1, padding: 32 }}>

        {/* ── HEADER ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5A6A7E', marginBottom: 4 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', margin: 0 }}>
              {greeting}, <span style={{ color: '#4FC3A1' }}>{userName.split(' ')[0]}</span>
            </h1>
          </div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/checkin')}
            style={{ padding: '10px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)', color: '#080C12', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,195,161,0.3)' }}>
            + Log today
          </motion.button>
        </div>

        {/* ── DRIFT ALERT ───────────────────────────────────────────── */}
        {driftStatus !== 'green' && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '16px 20px', borderRadius: 16, background: status.bg, border: `1px solid ${status.border}`, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 10, height: 10, borderRadius: '50%', background: status.color }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: status.color, marginBottom: 2 }}>{status.label}</p>
              <p style={{ fontSize: 13, color: '#E8EEF5' }}>{status.message}</p>
            </div>
          </motion.div>
        )}

        {/* ── TOP ROW: Level Progress + Aura's Insight ──────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          
          {/* Level / XP */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '24px', borderRadius: 20, background: `linear-gradient(135deg, ${levelColor}10, rgba(8,12,18,0.9))`, border: `1px solid ${levelColor}25`, position: 'relative', overflow: 'hidden' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', top: -100, right: -100, width: 250, height: 250, borderRadius: '50%', border: `1px solid ${levelColor}15`, pointerEvents: 'none' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: levelColor, fontWeight: 600, marginBottom: 4 }}>Progression</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 48, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', lineHeight: 1 }}>Level {level}</span>
                </div>
              </div>
              <div style={{ padding: '6px 14px', borderRadius: 20, background: `${levelColor}15`, border: `1px solid ${levelColor}30` }}>
                <span style={{ fontSize: 12, color: levelColor, fontWeight: 600 }}>{totalXP} XP</span>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.2, delay: 0.3 }}
                style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${levelColor}, ${levelColor}88)`, boxShadow: `0 0 8px ${levelColor}60` }} />
            </div>
            <p style={{ fontSize: 11, color: '#5A6A7E', marginTop: 8, textAlign: 'right' }}>{500 - (totalXP % 500)} XP to Next Level</p>
          </motion.div>

          {/* Aura Insight */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ padding: '24px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(139,92,246,0.05))', border: '1px solid rgba(167,139,250,0.2)', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>✦</motion.div>
              <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#A78BFA', fontWeight: 600, margin: 0 }}>Aura's Insight</p>
            </div>
            <h3 style={{ fontSize: 20, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', lineHeight: 1.4, marginBottom: 16 }}>
              "{insight}"
            </h3>
            <button onClick={() => router.push('/companion')} style={{ background: 'none', border: 'none', fontSize: 12, color: '#A78BFA', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
              Chat with Aura →
            </button>
          </motion.div>
        </div>

        {/* ── MIDDLE ROW: Baseline Chart + Right Stats ──────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
          
          {/* Glassmorphic Chart */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5A6A7E', marginBottom: 4 }}>Baseline Tracker</p>
                <h3 style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>Your Personal Pattern</h3>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                {[{ color: '#5B9CF6', label: 'Sleep' }, { color: '#4FC3A1', label: 'Social' }, { color: '#E8A04A', label: 'Pressure' }].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                    <span style={{ fontSize: 11, color: '#5A6A7E' }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {checkins.length === 0 ? (
              <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#5A6A7E', fontSize: 13 }}>Log your first check-in to see your chart.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <defs>
                    <linearGradient id="gSleep" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#5B9CF6" stopOpacity={0.4} /><stop offset="95%" stopColor="#5B9CF6" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gSocial" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4FC3A1" stopOpacity={0.4} /><stop offset="95%" stopColor="#4FC3A1" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fill: '#5A6A7E', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fill: '#5A6A7E', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(8,12,18,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#E8EEF5', fontSize: 12, backdropFilter: 'blur(10px)' }} itemStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="sleep" stroke="#5B9CF6" strokeWidth={3} fill="url(#gSleep)" dot={{ r: 3, fill: '#5B9CF6', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#5B9CF6', stroke: '#080C12', strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="social" stroke="#4FC3A1" strokeWidth={3} fill="url(#gSocial)" dot={{ r: 3, fill: '#4FC3A1', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#4FC3A1', stroke: '#080C12', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="pressure" stroke="#E8A04A" strokeWidth={2} dot={{ r: 2, fill: '#E8A04A' }} strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Right Column: Streak + Average */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Streak */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ flex: 1, padding: '24px', borderRadius: 20, background: 'rgba(232,160,74,0.05)', border: '1px solid rgba(232,160,74,0.15)' }}>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5A6A7E', marginBottom: 12 }}>Current Streak</p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 64, fontWeight: 300, color: '#E8A04A', fontFamily: 'Playfair Display, serif', lineHeight: 1 }}>{streak}</span>
                <span style={{ fontSize: 16, color: '#5A6A7E', marginBottom: 8 }}>days</span>
              </div>
              <p style={{ fontSize: 12, color: '#5A6A7E' }}>{streak >= 7 ? '🔥 On fire! Keep going.' : 'Log daily to build your streak'}</p>
            </motion.div>

            {/* Baseline Status */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              style={{ flex: 1, padding: '24px', borderRadius: 20, background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)' }}>
              <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5A6A7E', marginBottom: 12 }}>Baseline Status</p>
              {baseline?.totalDays >= 7 ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4FC3A1', boxShadow: '0 0 8px #4FC3A1' }} />
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#4FC3A1' }}>Active & Monitoring</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#5A6A7E', lineHeight: 1.6 }}>Drift detection is actively learning your patterns.</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 36, fontWeight: 300, color: '#A78BFA', fontFamily: 'Playfair Display, serif', lineHeight: 1, marginBottom: 4 }}>
                    {7 - (baseline?.totalDays || 0)} <span style={{ fontSize: 14, color: '#5A6A7E', marginLeft: 4 }}>days left</span>
                  </p>
                  <p style={{ fontSize: 12, color: '#5A6A7E', marginBottom: 12 }}>until baseline is established</p>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${((baseline?.totalDays || 0) / 7) * 100}%` }} transition={{ duration: 1, delay: 0.5 }} style={{ height: '100%', borderRadius: 2, background: '#A78BFA' }} />
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* ── BOTTOM ROW: Recent Checkins ───────────────────────────── */}
        {checkins.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5A6A7E', marginBottom: 16 }}>Recent Check-ins Log</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12 }}>
              {checkins.slice(-7).reverse().map((c: any, i: number) => {
                const sc = c.status === 'red' ? '#E05C5C' : c.status === 'amber' ? '#E8A04A' : '#4FC3A1'
                return (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.05 }} whileHover={{ y: -4 }}
                    style={{ padding: '16px 8px', borderRadius: 16, background: `${sc}08`, border: `1px solid ${sc}25`, textAlign: 'center', cursor: 'default' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc, margin: '0 auto 10px', boxShadow: `0 0 8px ${sc}` }} />
                    <p style={{ fontSize: 11, fontWeight: 600, color: sc, marginBottom: 4 }}>{c.emotion?.slice(0, 4) || '—'}</p>
                    <p style={{ fontSize: 10, color: '#5A6A7E' }}>{new Date(c.timestamp).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

      </main>
      
      {/* ── FLOATING AURA BADGE ───────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1 }} whileHover={{ scale: 1.05 }} onClick={() => router.push('/companion')}
        style={{ position: 'fixed', bottom: 32, right: 32, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.08))', border: '1px solid rgba(167,139,250,0.3)', cursor: 'pointer', zIndex: 50, boxShadow: '0 8px 32px rgba(167,139,250,0.2)', backdropFilter: 'blur(20px)' }}>
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 3, repeat: Infinity }}
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.4) 0%, rgba(167,139,250,0.1) 70%)', border: '1px solid rgba(167,139,250,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 0 16px rgba(167,139,250,0.4)' }}>✦</motion.div>
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#A78BFA', lineHeight: 1, marginBottom: 3 }}>Aura AI Companion</p>
          <p style={{ fontSize: 10, color: '#E8EEF5', lineHeight: 1 }}>{driftStatus !== 'green' ? 'Wants to check in with you' : 'Your companion is here'}</p>
        </div>
      </motion.div>

    </div>
  )
}