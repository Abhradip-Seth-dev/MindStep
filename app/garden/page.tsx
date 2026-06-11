'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/UserContext'
import Sidebar from '@/components/Sidebar'

// ── helpers ────────────────────────────────────────────────────────────────
/**
 * Computes garden state using a two-layer approach:
 *  1. LONG-TERM score: baseline averages (reflects overall trajectory)
 *  2. SHORT-TERM score: last 7 days average (reflects recent mood)
 *
 * The final state is the long-term score, dampened slightly by the short-term.
 * A bad week can shift state down by ONE level at most — it cannot destroy a
 * healthy garden that took months to build.
 */
function computeScore(checkins: any[], days: number): number {
  if (checkins.length === 0) return 5
  const slice = checkins.slice(-days)
  return slice.reduce((sum: number, c: any) => {
    return sum + ((c.sleep ?? 5) + (c.socialEnergy ?? 5) + (10 - (c.pressure ?? 5))) / 3
  }, 0) / slice.length
}

function scoreToState(score: number): 'blooming' | 'growing' | 'cloudy' | 'wilting' {
  if (score >= 7) return 'blooming'
  if (score >= 5) return 'growing'
  if (score >= 3) return 'cloudy'
  return 'wilting'
}

const STATE_ORDER = ['wilting', 'cloudy', 'growing', 'blooming'] as const

function getGardenState(
  checkins: any[],
  streak: number,
  baseline: any | null
): 'empty' | 'blooming' | 'growing' | 'cloudy' | 'wilting' {
  if (checkins.length === 0) return 'empty'

  // ── Long-term score: prefer baseline averages if established ──────────────
  let longTermScore: number
  if (baseline && baseline.totalDays >= 7) {
    // Composite from baseline averages (same formula as checkin scoring)
    longTermScore = ((baseline.avgSleep ?? 5) + (baseline.avgSocialEnergy ?? 5) + (10 - (baseline.avgPressure ?? 5))) / 3
  } else {
    // Fallback: rolling 30-day score (or all available)
    longTermScore = computeScore(checkins, 30)
  }

  const longTermState = scoreToState(longTermScore)
  const longTermIdx = STATE_ORDER.indexOf(longTermState)

  // ── Short-term score: last 7 days ─────────────────────────────────────────
  const shortTermScore = computeScore(checkins, 7)
  const shortTermState = scoreToState(shortTermScore)
  const shortTermIdx = STATE_ORDER.indexOf(shortTermState)

  // ── Clamp: short-term dips can only shift state DOWN by 1 level max ───────
  // Positive moods can also boost 1 level up from baseline
  const finalIdx = Math.min(
    longTermIdx + 1,           // cap: can improve at most 1 level in short-term
    Math.max(longTermIdx - 1,  // floor: can fall at most 1 level in short-term
    shortTermIdx)
  )

  // Bonus: a long streak (14+ days) protects against 1 level of degradation
  const streakProtected = streak >= 14 ? Math.max(finalIdx, longTermIdx) : finalIdx

  return STATE_ORDER[Math.max(0, Math.min(3, streakProtected))]
}

function getPlantCount(checkins: any[]) { return Math.min(checkins.length, 30) }

const PLANT_TYPES = ['🌸', '🌺', '🌻', '🌷', '🌹', '💐', '🌼', '🪷']
const TREE_TYPES = ['🌳', '🌲', '🌴', '🎋']

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

// ── Sub-components ──────────────────────────────────────────────────────────
function SkyLayer({ state }: { state: string }) {
  const configs: Record<string, { from: string; to: string; stars: boolean; rain: boolean }> = {
    blooming: { from: '#0d1f3c', to: '#1a3a5c', stars: true, rain: false },
    growing:  { from: '#0f2030', to: '#162d45', stars: true, rain: false },
    cloudy:   { from: '#0a1520', to: '#111a26', stars: false, rain: false },
    wilting:  { from: '#0a0e14', to: '#0d1520', stars: false, rain: true },
    empty:    { from: '#0a1a2e', to: '#0d2040', stars: true, rain: false },
  }
  const cfg = configs[state] || configs.empty
  return (
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${cfg.from} 0%, ${cfg.to} 100%)`, overflow: 'hidden' }}>
      {cfg.stars && Array.from({ length: 60 }).map((_, i) => (
        <motion.div key={i}
          animate={{ opacity: [seededRandom(i * 3) * 0.6 + 0.2, 1, seededRandom(i * 3) * 0.6 + 0.2] }}
          transition={{ duration: seededRandom(i) * 3 + 2, repeat: Infinity, delay: seededRandom(i * 2) * 4 }}
          style={{
            position: 'absolute',
            left: `${seededRandom(i * 7) * 100}%`,
            top: `${seededRandom(i * 11) * 60}%`,
            width: seededRandom(i * 5) > 0.8 ? 2 : 1,
            height: seededRandom(i * 5) > 0.8 ? 2 : 1,
            borderRadius: '50%',
            background: '#fff',
          }}
        />
      ))}
      {cfg.rain && Array.from({ length: 40 }).map((_, i) => (
        <motion.div key={i}
          animate={{ y: ['-10%', '110%'], opacity: [0, 0.5, 0] }}
          transition={{ duration: seededRandom(i) * 1.5 + 0.8, repeat: Infinity, delay: seededRandom(i * 3) * 2, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: `${seededRandom(i * 9) * 100}%`,
            top: 0,
            width: 1,
            height: seededRandom(i) * 20 + 10,
            background: 'linear-gradient(180deg, transparent, rgba(147,197,253,0.4))',
          }}
        />
      ))}
    </div>
  )
}

function Moon({ state }: { state: string }) {
  const color = state === 'blooming' ? '#fde68a' : state === 'growing' ? '#d1fae5' : '#94a3b8'
  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute', top: 40, right: 80,
        width: 56, height: 56, borderRadius: '50%',
        background: color,
        boxShadow: `0 0 40px ${color}60, 0 0 80px ${color}30`,
      }}
    />
  )
}

function Cloud({ x, delay, opacity }: { x: number; delay: number; opacity: number }) {
  return (
    <motion.div
      animate={{ x: [0, 30, 0] }}
      transition={{ duration: 20 + delay * 3, repeat: Infinity, ease: 'easeInOut', delay }}
      style={{ position: 'absolute', top: `${10 + delay * 8}%`, left: `${x}%`, opacity, display: 'flex', gap: -8 }}
    >
      {[48, 64, 56].map((s, i) => (
        <div key={i} style={{ width: s, height: s * 0.6, borderRadius: '50%', background: 'rgba(148,163,184,0.12)', marginLeft: i === 0 ? 0 : -16 }} />
      ))}
    </motion.div>
  )
}

function Plant({ emoji, x, y, size, delay, checkin }: { emoji: string; x: number; y: number; size: number; delay: number; checkin: any }) {
  const health = checkin ? ((checkin.sleep ?? 5) + (checkin.socialEnergy ?? 5) + (10 - (checkin.pressure ?? 5))) / 3 : 5
  const glowColor = health >= 7 ? '#4FC3A1' : health >= 5 ? '#86efac' : health >= 3 ? '#fbbf24' : '#f87171'
  const glowIntensity = health >= 7 ? 12 : health >= 5 ? 8 : 4
  return (
    <motion.div
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 12, stiffness: 200, delay }}
      whileHover={{ scale: 1.3, y: -5 }}
      style={{
        position: 'absolute', left: `${x}%`, bottom: `${y}%`,
        fontSize: size, cursor: 'default',
        filter: `drop-shadow(0 0 ${glowIntensity}px ${glowColor})`,
        userSelect: 'none',
      }}
    >
      <motion.span
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.5 }}
        style={{ display: 'block' }}
      >
        {emoji}
      </motion.span>
    </motion.div>
  )
}

function Firefly({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.div
      animate={{ x: [0, 20, -10, 15, 0], y: [0, -15, 5, -20, 0], opacity: [0, 1, 0.5, 1, 0] }}
      transition={{ duration: 5 + delay * 2, repeat: Infinity, delay, ease: 'easeInOut' }}
      style={{
        position: 'absolute', left: `${x}%`, bottom: `${y}%`,
        width: 4, height: 4, borderRadius: '50%',
        background: '#bbf7d0',
        boxShadow: '0 0 6px #4ade80, 0 0 12px #4ade80',
      }}
    />
  )
}

function Ground({ state }: { state: string }) {
  const color = state === 'blooming' ? '#1a3a2a' : state === 'growing' ? '#162d22' : state === 'wilting' ? '#1a1a1a' : '#111f18'
  const stripe = state === 'blooming' ? '#22543d' : '#1a2e22'
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: '28%',
      background: `linear-gradient(180deg, ${color} 0%, #0a0f0a 100%)`,
      borderRadius: '60% 60% 0 0 / 20% 20% 0 0',
    }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute', bottom: 0, left: `${i * 14}%`, width: '18%', height: '60%',
          background: `linear-gradient(180deg, ${stripe}20, transparent)`,
          borderRadius: '50% 50% 0 0',
        }} />
      ))}
    </div>
  )
}

const stateInfo: Record<string, { title: string; subtitle: string; color: string; tip: string }> = {
  blooming: {
    title: 'Blooming 🌸',
    subtitle: 'Your garden is thriving!',
    color: '#4FC3A1',
    tip: 'Your sleep, social energy, and stress levels are all balanced. Keep it up!',
  },
  growing: {
    title: 'Growing 🌱',
    subtitle: 'Steady progress, keep going',
    color: '#86efac',
    tip: 'You\'re doing well! A little more rest tonight could help your garden bloom even more.',
  },
  cloudy: {
    title: 'Overcast ☁️',
    subtitle: 'A rough patch — it\'s okay',
    color: '#94a3b8',
    tip: 'Rough days happen. Try one small act of self-care today — even a 10-minute walk counts.',
  },
  wilting: {
    title: 'Struggling 🌧️',
    subtitle: 'Your garden needs attention',
    color: '#f87171',
    tip: 'Please consider talking to someone. Your wellbeing matters. Aura is here too.',
  },
  empty: {
    title: 'Plant your first seed 🌱',
    subtitle: 'Complete a daily check-in to start',
    color: '#5B9CF6',
    tip: 'Your garden grows with every check-in. Head to Daily Log to start today!',
  },
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function MindGarden() {
  const router = useRouter()
  const { user, userData, checkins, baseline, loading } = useUser()
  const [tooltip, setTooltip] = useState<{ checkin: any; idx: number } | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/onboarding')
  }, [user, loading, router])

  const streak = userData?.streak ?? 0
  const state = getGardenState(checkins, streak, baseline)
  const plantCount = getPlantCount(checkins)
  const info = stateInfo[state]

  // Build plant layout — deterministic positions so it looks the same every render
  const plants = Array.from({ length: plantCount }).map((_, i) => {
    const row = i < 10 ? 0 : i < 20 ? 1 : 2
    const col = i % 10
    const isTree = i % 7 === 0
    const emoji = isTree
      ? TREE_TYPES[Math.floor(seededRandom(i * 13) * TREE_TYPES.length)]
      : PLANT_TYPES[Math.floor(seededRandom(i * 17) * PLANT_TYPES.length)]
    return {
      emoji,
      x: 5 + col * 9.5 + seededRandom(i * 3) * 4 - 2,
      y: 4 + row * 8 + seededRandom(i * 7) * 3,
      size: isTree ? 40 + seededRandom(i * 11) * 16 : 24 + seededRandom(i * 5) * 12,
      delay: i * 0.04,
      checkin: checkins[i] ?? null,
    }
  })

  const fireflies = state === 'blooming' || state === 'growing'
    ? Array.from({ length: 12 }).map((_, i) => ({
        x: 10 + seededRandom(i * 23) * 80,
        y: 15 + seededRandom(i * 17) * 25,
        delay: seededRandom(i * 7) * 6,
      }))
    : []

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080C12', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
          <span style={{ fontSize: 48 }}>🌱</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar userName={userData?.name} userData={userData} />

      <main style={{ marginLeft: 220, flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', overflowY: 'auto' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4A5A6E', marginBottom: 6 }}>Mind Garden</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 style={{ fontSize: 32, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', margin: 0 }}>Your Garden</h1>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                padding: '6px 14px', borderRadius: 20,
                background: `${info.color}15`, border: `1px solid ${info.color}40`,
                color: info.color, fontSize: 13, fontWeight: 500,
              }}
            >
              {info.title}
            </motion.div>
          </div>
          <p style={{ fontSize: 14, color: '#4A5A6E', marginTop: 6 }}>{info.subtitle}</p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}
        >
          {[
            { label: 'Plants Grown', value: plantCount, icon: '🌱', color: '#4FC3A1' },
            { label: 'Day Streak', value: streak, icon: '🔥', color: '#f97316' },
            { label: 'Garden Age', value: `${checkins.length}d`, icon: '📅', color: '#5B9CF6' },
            { label: 'Garden State', value: state.charAt(0).toUpperCase() + state.slice(1), icon: '✨', color: info.color },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
              style={{
                padding: '16px 18px', borderRadius: 14,
                background: `${stat.color}08`, border: `1px solid ${stat.color}20`,
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.icon}</div>
              <p style={{ fontSize: 22, fontWeight: 600, color: stat.color, fontFamily: 'Playfair Display, serif', margin: 0 }}>{stat.value}</p>
              <p style={{ fontSize: 11, color: '#4A5A6E', marginTop: 2 }}>{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Garden Canvas */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            flex: 1, minHeight: 420,
            borderRadius: 24, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.07)',
            position: 'relative',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }}
        >
          {/* Sky */}
          <SkyLayer state={state} />
          <Moon state={state} />

          {/* Clouds */}
          {(state === 'cloudy' || state === 'wilting') && [
            { x: 5, delay: 0, opacity: 0.7 },
            { x: 30, delay: 2, opacity: 0.5 },
            { x: 55, delay: 1, opacity: 0.6 },
            { x: 75, delay: 3, opacity: 0.4 },
          ].map((c, i) => <Cloud key={i} {...c} />)}

          {/* Ground */}
          <Ground state={state} />

          {/* Fireflies */}
          {fireflies.map((f, i) => <Firefly key={i} {...f} />)}

          {/* Plants */}
          <AnimatePresence>
            {plants.map((p, i) => (
              <Plant key={i} {...p} />
            ))}
          </AnimatePresence>

          {/* Empty state */}
          {plantCount === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}
            >
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <span style={{ fontSize: 64 }}>🌱</span>
              </motion.div>
              <p style={{ color: '#4A5A6E', fontSize: 16, textAlign: 'center' }}>Complete your first daily check-in to plant your first seed</p>
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/checkin')}
                style={{
                  marginTop: 8, padding: '10px 24px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)',
                  color: '#080C12', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >
                Start Daily Log →
              </motion.button>
            </motion.div>
          )}

          {/* Garden state overlay label */}
          <div style={{ position: 'absolute', top: 16, left: 16 }}>
            <div style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 11, color: '#94a3b8', letterSpacing: '0.1em' }}>LIVE GARDEN</span>
            </div>
          </div>
        </motion.div>

        {/* Tip Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{
            marginTop: 20, padding: '18px 22px', borderRadius: 14,
            background: `${info.color}08`, border: `1px solid ${info.color}25`,
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0 }}>💡</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: info.color, marginBottom: 4 }}>Aura says</p>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7, margin: 0 }}>{info.tip}</p>
          </div>
        </motion.div>

        {/* Recent Plants Timeline */}
        {checkins.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} style={{ marginTop: 24 }}>
            <p style={{ fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 14 }}>Recent Seeds</p>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
              {checkins.slice(-14).reverse().map((c: any, i: number) => {
                const health = ((c.sleep ?? 5) + (c.socialEnergy ?? 5) + (10 - (c.pressure ?? 5))) / 3
                const col = health >= 7 ? '#4FC3A1' : health >= 5 ? '#86efac' : health >= 3 ? '#fbbf24' : '#f87171'
                const plantEmoji = PLANT_TYPES[Math.floor(seededRandom(i * 17) * PLANT_TYPES.length)]
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    whileHover={{ scale: 1.06, y: -2 }}
                    style={{
                      flexShrink: 0, padding: '12px 14px', borderRadius: 12, minWidth: 90,
                      background: `${col}10`, border: `1px solid ${col}30`,
                      textAlign: 'center', cursor: 'default',
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 6 }}>{plantEmoji}</div>
                    <p style={{ fontSize: 9, color: col, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                      {c.emotion || c.status || 'Day'}
                    </p>
                    <p style={{ fontSize: 9, color: '#3A4A5E', marginTop: 2 }}>
                      {c.date ? c.date.slice(5) : `Day ${i + 1}`}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

      </main>
    </div>
  )
}
