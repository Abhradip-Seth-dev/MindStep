'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Sidebar from '@/components/Sidebar'

const BADGES = [
  { id: 1, emoji: '🌱', title: 'First Step', desc: 'Logged your first check-in', requirement: 1, color: '#4FC3A1', gradient: 'linear-gradient(135deg, rgba(79,195,161,0.15), rgba(79,195,161,0.05))', border: 'rgba(79,195,161,0.25)' },
  { id: 2, emoji: '🔥', title: 'On Fire', desc: '7 day logging streak', requirement: 7, color: '#E8A04A', gradient: 'linear-gradient(135deg, rgba(232,160,74,0.15), rgba(232,160,74,0.05))', border: 'rgba(232,160,74,0.25)' },
  { id: 3, emoji: '⚡', title: 'Momentum', desc: '14 day logging streak', requirement: 14, color: '#5B9CF6', gradient: 'linear-gradient(135deg, rgba(91,156,246,0.15), rgba(91,156,246,0.05))', border: 'rgba(91,156,246,0.25)' },
  { id: 4, emoji: '🌙', title: 'Night Owl', desc: '21 day logging streak', requirement: 21, color: '#A78BFA', gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.05))', border: 'rgba(167,139,250,0.25)' },
  { id: 5, emoji: '💎', title: 'Diamond Mind', desc: '30 day logging streak', requirement: 30, color: '#4FC3A1', gradient: 'linear-gradient(135deg, rgba(79,195,161,0.2), rgba(91,156,246,0.1))', border: 'rgba(79,195,161,0.3)' },
  { id: 6, emoji: '🏆', title: 'Legend', desc: '60 day logging streak', requirement: 60, color: '#E8A04A', gradient: 'linear-gradient(135deg, rgba(232,160,74,0.2), rgba(224,92,92,0.1))', border: 'rgba(232,160,74,0.3)' },
]

const MOTIVATIONAL_MESSAGES = [
  { text: "You don't have to be perfect. You just have to show up.", author: 'Psychology of habit formation', color: '#4FC3A1' },
  { text: 'Awareness is the first step. You are already doing the hardest part.', author: 'Cognitive behavioral research', color: '#5B9CF6' },
  { text: 'Every check-in is a small act of self-compassion.', author: 'Mindfulness research', color: '#A78BFA' },
  { text: 'Patterns only become visible when you look. You are looking.', author: 'Behavioral science', color: '#E8A04A' },
]

export default function Rewards() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const [baseline, setBaseline] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [messageIndex] = useState(() => Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length))

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/onboarding'); return }
      setUserName(
        firebaseUser.displayName ||
        firebaseUser.email?.split('@')[0] ||
        'Student'
      )
      try {
        const userRes = await fetch(`/api/user?firebaseUid=${firebaseUser.uid}`)
        const ud = await userRes.json()
        if (!ud.error) setUserData(ud)

        const baselineRes = await fetch(`/api/baseline?userId=${firebaseUser.uid}`)
        const bd = await baselineRes.json()
        if (bd.baseline) setBaseline(bd.baseline)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    })
    return () => unsub()
  }, [])

  const streak = userData?.streak || 0
  const totalDays = baseline?.totalDays || 0
  const message = MOTIVATIONAL_MESSAGES[messageIndex]
  const nextBadge = BADGES.find(b => b.requirement > streak)
  const daysToNext = nextBadge ? nextBadge.requirement - streak : 0
  const progressToNext = nextBadge ? (streak / nextBadge.requirement) * 100 : 100

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
        <div style={{ position: 'absolute', top: '0%', right: '5%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,160,74,0.04) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '0%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,161,0.04) 0%, transparent 70%)' }} />
      </div>

      <Sidebar userName={userName} userData={userData} />

      <main style={{ flex: 1, marginLeft: '220px', minHeight: '100vh', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{
          position: 'sticky', top: 0, zIndex: 40, padding: '20px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,12,18,0.92)', backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 3 }}>Your achievements</p>
            <h1 style={{ fontSize: 24, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', fontWeight: 600 }}>Rewards & streaks</h1>
          </div>
        </div>

        <div style={{ padding: '28px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

            {/* Streak hero */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{
                padding: '32px', borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(232,160,74,0.1), rgba(232,160,74,0.03))',
                border: '1px solid rgba(232,160,74,0.2)', position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{
                position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                fontSize: 140, fontWeight: 700, fontFamily: 'Playfair Display, serif',
                color: 'rgba(232,160,74,0.06)', pointerEvents: 'none', lineHeight: 1, userSelect: 'none',
              }}>
                {streak}
              </div>
              <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#E8A04A', marginBottom: 12, fontWeight: 600 }}>
                Current streak
              </p>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginBottom: 12 }}>
                <motion.p
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  style={{ fontSize: 80, fontWeight: 300, fontFamily: 'Playfair Display, serif', color: '#E8A04A', lineHeight: 1 }}
                >
                  {streak}
                </motion.p>
                <p style={{ fontSize: 20, color: '#5A6A7E', marginBottom: 12 }}>days</p>
              </div>
              <p style={{ fontSize: 13, color: '#5A6A7E', marginBottom: 20 }}>
                {streak === 0 ? 'Log your first check-in to start your streak'
                  : streak < 7 ? `${7 - streak} more days to your first milestone 🌱`
                  : streak < 30 ? `You're building something real. Keep going. 🔥`
                  : 'You are genuinely exceptional. 🏆'}
              </p>
              {nextBadge && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#3A4A5E' }}>Next: {nextBadge.emoji} {nextBadge.title}</span>
                    <span style={{ fontSize: 11, color: '#E8A04A' }}>{daysToNext} days away</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${progressToNext}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                      style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #E8A04A, #E8A04A80)', boxShadow: '0 0 8px rgba(232,160,74,0.4)' }}
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Motivational message */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                padding: '32px', borderRadius: 20,
                background: `linear-gradient(135deg, ${message.color}08, rgba(255,255,255,0.02))`,
                border: `1px solid ${message.color}20`,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                position: 'relative', overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', top: 20, left: 24, fontSize: 60, color: `${message.color}10`, fontFamily: 'Playfair Display, serif', lineHeight: 1, userSelect: 'none' }}>"</div>
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: message.color, marginBottom: 16, fontWeight: 600 }}>
                  This week's message
                </p>
                <p style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#C8D4E0', lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{message.text}"
                </p>
              </div>
              <p style={{ fontSize: 11, color: '#3A4A5E', marginTop: 16 }}>— {message.author}</p>
            </motion.div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { icon: '📋', label: 'Total check-ins', value: totalDays, sub: 'days logged', color: '#4FC3A1' },
              { icon: '🏅', label: 'Badges earned', value: BADGES.filter(b => b.requirement <= streak).length, sub: `of ${BADGES.length} total`, color: '#A78BFA' },
              { icon: '📈', label: 'Baseline status', value: totalDays >= 7 ? 'Active' : `${7 - totalDays} days`, sub: totalDays >= 7 ? 'drift detection on' : 'until baseline', color: totalDays >= 7 ? '#4FC3A1' : '#5B9CF6' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                whileHover={{ y: -3 }}
                style={{ padding: '20px 24px', borderRadius: 16, background: `${stat.color}06`, border: `1px solid ${stat.color}18`, cursor: 'default' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{stat.icon}</span>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: stat.color, boxShadow: `0 0 6px ${stat.color}` }} />
                </div>
                <p style={{ fontSize: 28, fontWeight: 300, fontFamily: 'Playfair Display, serif', color: stat.color, lineHeight: 1, marginBottom: 6 }}>{stat.value}</p>
                <p style={{ fontSize: 12, color: '#C8D4E0', marginBottom: 2 }}>{stat.label}</p>
                <p style={{ fontSize: 11, color: '#3A4A5E' }}>{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Badges */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 3, fontWeight: 600 }}>Milestone badges</p>
                <h2 style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>Your achievements</h2>
              </div>
              <p style={{ fontSize: 12, color: '#3A4A5E' }}>{BADGES.filter(b => b.requirement <= streak).length} / {BADGES.length} unlocked</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {BADGES.map((badge, i) => {
                const unlocked = streak >= badge.requirement
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                    whileHover={{ y: unlocked ? -4 : -1 }}
                    style={{
                      padding: '24px', borderRadius: 18,
                      background: unlocked ? badge.gradient : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${unlocked ? badge.border : 'rgba(255,255,255,0.05)'}`,
                      position: 'relative', overflow: 'hidden', cursor: 'default',
                      filter: unlocked ? 'none' : 'grayscale(0.8)', transition: 'all 0.3s',
                    }}
                  >
                    {unlocked && (
                      <div style={{
                        position: 'absolute', top: -20, right: -20,
                        width: 100, height: 100, borderRadius: '50%',
                        background: `radial-gradient(circle, ${badge.color}20 0%, transparent 70%)`,
                        pointerEvents: 'none',
                      }} />
                    )}
                    {!unlocked && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(8,12,18,0.3)', borderRadius: 18, zIndex: 1,
                      }}>
                        <div style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(8,12,18,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <span style={{ fontSize: 11, color: '#3A4A5E' }}>🔒 {badge.requirement} day streak</span>
                        </div>
                      </div>
                    )}
                    <div style={{ position: 'relative', zIndex: 2 }}>
                      <motion.div
                        animate={unlocked ? { scale: [1, 1.05, 1] } : {}}
                        transition={{ duration: 3, repeat: Infinity }}
                        style={{
                          width: 56, height: 56, borderRadius: 16,
                          background: unlocked ? `${badge.color}20` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${unlocked ? badge.color + '40' : 'rgba(255,255,255,0.06)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 28, marginBottom: 16,
                          boxShadow: unlocked ? `0 0 20px ${badge.color}20` : 'none',
                        }}
                      >
                        {badge.emoji}
                      </motion.div>
                      <p style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Playfair Display, serif', color: unlocked ? '#E8EEF5' : '#3A4A5E', marginBottom: 4 }}>{badge.title}</p>
                      <p style={{ fontSize: 12, color: unlocked ? '#5A6A7E' : '#2A3547', marginBottom: 12 }}>{badge.desc}</p>
                      {unlocked && (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: `${badge.color}15`, border: `1px solid ${badge.color}30` }}>
                          <div style={{ width: 4, height: 4, borderRadius: '50%', background: badge.color, boxShadow: `0 0 4px ${badge.color}` }} />
                          <span style={{ fontSize: 10, color: badge.color, fontWeight: 600 }}>Unlocked</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {streak === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                padding: '28px 32px', borderRadius: 20,
                background: 'linear-gradient(135deg, rgba(79,195,161,0.08), rgba(91,156,246,0.05))',
                border: '1px solid rgba(79,195,161,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 6 }}>Start your journey today</h3>
                <p style={{ fontSize: 13, color: '#5A6A7E' }}>Log your first check-in to unlock your first badge and start building your streak.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/checkin')}
                style={{
                  padding: '12px 24px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)',
                  color: '#080C12', fontSize: 13, fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(79,195,161,0.3)',
                  whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 24,
                }}
              >
                Log today →
              </motion.button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}