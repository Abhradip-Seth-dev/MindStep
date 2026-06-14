'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/UserContext'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import { useIsMobile } from '@/lib/hooks'

// ── XP & Level ────────────────────────────────────────────────────────────
const XP_PER_LEVEL = 500
function calcXP(checkins: any[], streak: number) {
  return checkins.length * 50 + streak * 30
}
function calcLevel(xp: number) { return Math.floor(xp / XP_PER_LEVEL) + 1 }
function xpToNextLevel(xp: number) { return XP_PER_LEVEL - (xp % XP_PER_LEVEL) }
function xpProgress(xp: number) { return ((xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100 }

// ── Badge definitions ─────────────────────────────────────────────────────
type Rarity = 'common' | 'rare' | 'epic' | 'legendary'
type Badge = {
  id: string; emoji: string; title: string; desc: string
  category: 'consistency' | 'wellness' | 'games' | 'community'
  rarity: Rarity; unlocked: (ctx: BadgeCtx) => boolean
}
type BadgeCtx = { streak: number; totalCheckins: number; greenDays: number; bloomingDays: number }

const RARITY_STYLE: Record<Rarity, { border: string; glow: string; label: string; color: string }> = {
  common:    { border: '#4A5A6E', glow: 'rgba(74,90,110,0.3)',    label: 'Common',    color: '#94a3b8' },
  rare:      { border: '#5B9CF6', glow: 'rgba(91,156,246,0.35)',  label: 'Rare',      color: '#5B9CF6' },
  epic:      { border: '#A78BFA', glow: 'rgba(167,139,250,0.4)',  label: 'Epic',      color: '#A78BFA' },
  legendary: { border: '#E8A04A', glow: 'rgba(232,160,74,0.5)',   label: 'Legendary', color: '#E8A04A' },
}

const ALL_BADGES: Badge[] = [
  // Consistency
  { id:'c1', emoji:'🌱', title:'First Step',    desc:'Logged your first check-in',     category:'consistency', rarity:'common',    unlocked: c => c.totalCheckins >= 1 },
  { id:'c2', emoji:'🔥', title:'Ignition',      desc:'7-day logging streak',            category:'consistency', rarity:'common',    unlocked: c => c.streak >= 7 },
  { id:'c3', emoji:'⚡', title:'Momentum',      desc:'14-day logging streak',           category:'consistency', rarity:'rare',      unlocked: c => c.streak >= 14 },
  { id:'c4', emoji:'🌙', title:'Night Owl',     desc:'21-day logging streak',           category:'consistency', rarity:'rare',      unlocked: c => c.streak >= 21 },
  { id:'c5', emoji:'💎', title:'Diamond Mind',  desc:'30-day logging streak',           category:'consistency', rarity:'epic',      unlocked: c => c.streak >= 30 },
  { id:'c6', emoji:'🏆', title:'Legend',        desc:'60-day logging streak',           category:'consistency', rarity:'legendary', unlocked: c => c.streak >= 60 },
  { id:'c7', emoji:'📅', title:'Century',       desc:'100 total check-ins logged',      category:'consistency', rarity:'legendary', unlocked: c => c.totalCheckins >= 100 },
  // Wellness
  { id:'w1', emoji:'😊', title:'Good Vibes',    desc:'5 green-status check-ins',        category:'wellness',    rarity:'common',    unlocked: c => c.greenDays >= 5 },
  { id:'w2', emoji:'🌿', title:'In Balance',    desc:'10 green-status check-ins',       category:'wellness',    rarity:'rare',      unlocked: c => c.greenDays >= 10 },
  { id:'w3', emoji:'🧘', title:'Zen State',     desc:'20 green-status check-ins',       category:'wellness',    rarity:'epic',      unlocked: c => c.greenDays >= 20 },
  { id:'w4', emoji:'🌸', title:'Blooming',      desc:'Garden bloomed 5 times',          category:'wellness',    rarity:'rare',      unlocked: c => c.bloomingDays >= 5 },
  { id:'w5', emoji:'✨', title:'Inner Glow',    desc:'Garden bloomed 15 times',         category:'wellness',    rarity:'epic',      unlocked: c => c.bloomingDays >= 15 },
  // Games
  { id:'g1', emoji:'🎮', title:'Player One',    desc:'Played your first mind game',     category:'games',       rarity:'common',    unlocked: c => c.totalCheckins >= 1 },
  { id:'g2', emoji:'🧠', title:'Mind Flex',     desc:'Logged 10+ days (game proxy)',    category:'games',       rarity:'rare',      unlocked: c => c.totalCheckins >= 10 },
  { id:'g3', emoji:'🎯', title:'Sharp Focus',   desc:'Logged 25+ days (game proxy)',    category:'games',       rarity:'epic',      unlocked: c => c.totalCheckins >= 25 },
  // Community
  { id:'p1', emoji:'🤝', title:'Not Alone',     desc:'Used the peer support feature',   category:'community',   rarity:'common',    unlocked: c => c.totalCheckins >= 3 },
  { id:'p2', emoji:'💬', title:'Open Heart',    desc:'Chatted with Aura 5+ times',      category:'community',   rarity:'rare',      unlocked: c => c.totalCheckins >= 5 },
  { id:'p3', emoji:'🌍', title:'Ripple Effect', desc:'30+ days — inspiring others',     category:'community',   rarity:'epic',      unlocked: c => c.streak >= 30 },
]

const CATEGORIES = [
  { id: 'all',         label: 'All Badges',   icon: '🏅' },
  { id: 'consistency', label: 'Consistency',  icon: '🔥' },
  { id: 'wellness',    label: 'Wellness',     icon: '🌿' },
  { id: 'games',       label: 'Games',        icon: '🎮' },
  { id: 'community',   label: 'Community',    icon: '🤝' },
]

const LEVEL_TITLES = ['Seedling','Explorer','Thinker','Balanced','Focused','Resilient','Mindful','Enlightened','Champion','Legend']
function getLevelTitle(level: number) { return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] }

// ── XP Bar ────────────────────────────────────────────────────────────────
function XPBar({ progress, color }: { progress: number; color: string }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${color}, ${color}99)`, boxShadow: `0 0 8px ${color}60` }}
      />
    </div>
  )
}

// ── Badge Card ────────────────────────────────────────────────────────────
function BadgeCard({ badge, unlocked, index }: { badge: Badge; unlocked: boolean; index: number }) {
  const [hovered, setHovered] = useState(false)
  const rs = RARITY_STYLE[badge.rarity]
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      whileHover={{ y: unlocked ? -5 : -2 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        padding: '20px', borderRadius: 16, position: 'relative', overflow: 'hidden', cursor: 'default',
        background: unlocked ? `radial-gradient(circle at top right, ${rs.glow}, rgba(8,12,18,0.95))` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${unlocked ? rs.border : 'rgba(255,255,255,0.06)'}`,
        filter: unlocked ? 'none' : 'grayscale(0.9)',
        transition: 'all 0.3s',
        boxShadow: unlocked && hovered ? `0 8px 32px ${rs.glow}` : 'none',
      }}
    >
      {unlocked && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', top: -60, right: -60, width: 160, height: 160, borderRadius: '50%', border: `1px solid ${rs.border}20`, pointerEvents: 'none' }}
        />
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <motion.div
          animate={unlocked ? { scale: [1, 1.08, 1] } : {}}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            width: 48, height: 48, borderRadius: 14, fontSize: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: unlocked ? `${rs.border}20` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${unlocked ? rs.border + '50' : 'rgba(255,255,255,0.06)'}`,
            boxShadow: unlocked ? `0 0 16px ${rs.glow}` : 'none',
          }}
        >
          {unlocked ? badge.emoji : '🔒'}
        </motion.div>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '3px 8px', borderRadius: 6,
          background: `${rs.color}15`, border: `1px solid ${rs.color}30`, color: rs.color,
        }}>
          {rs.label}
        </span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: unlocked ? '#E8EEF5' : '#3A4A5E', marginBottom: 4, fontFamily: 'Playfair Display, serif' }}>
        {badge.title}
      </p>
      <p style={{ fontSize: 11, color: unlocked ? '#5A6A7E' : '#2A3547', lineHeight: 1.5 }}>{badge.desc}</p>
      {unlocked && (
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
          <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ width: 4, height: 4, borderRadius: '50%', background: rs.color }} />
          <span style={{ fontSize: 10, color: rs.color, fontWeight: 600 }}>Unlocked</span>
        </div>
      )}
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Rewards() {
  const router = useRouter()
  const { user, userData, checkins, loading } = useUser()
  const isMobile = useIsMobile()
  const [activeCategory, setActiveCategory] = useState('all')

  const streak = userData?.streak ?? 0
  const totalCheckins = checkins.length
  const greenDays = checkins.filter((c: any) => c.status === 'green').length
  const bloomingDays = checkins.filter((c: any) => {
    const avg = ((c.sleep ?? 5) + (c.socialEnergy ?? 5) + (10 - (c.pressure ?? 5))) / 3
    return avg >= 7
  }).length

  const ctx: BadgeCtx = { streak, totalCheckins, greenDays, bloomingDays }
  const totalXP = calcXP(checkins, streak)
  const level = calcLevel(totalXP)
  const levelTitle = getLevelTitle(level)
  const toNext = xpToNextLevel(totalXP)
  const progress = xpProgress(totalXP)

  const badgesWithStatus = ALL_BADGES.map(b => ({ ...b, isUnlocked: b.unlocked(ctx) }))
  const filtered = activeCategory === 'all' ? badgesWithStatus : badgesWithStatus.filter(b => b.category === activeCategory)
  const unlockedCount = badgesWithStatus.filter(b => b.isUnlocked).length

  // Weekly challenge based on weakest metric
  const avgSleep = checkins.slice(-7).reduce((s: number, c: any) => s + (c.sleep ?? 5), 0) / Math.max(checkins.slice(-7).length, 1)
  const weeklyChallenge = avgSleep < 6
    ? { text: 'Sleep before midnight 4 out of the next 7 nights', reward: 200, icon: '🌙', color: '#5B9CF6' }
    : greenDays < 5
    ? { text: 'Achieve a green check-in 3 days in a row', reward: 150, icon: '✅', color: '#4FC3A1' }
    : { text: 'Log in every day this week — no breaks!', reward: 300, icon: '🔥', color: '#E8A04A' }

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
        <span style={{ fontSize: 40 }}>🏅</span>
      </motion.div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', fontFamily: 'Inter, sans-serif' }}>
      <Sidebar userName={userData?.name} userData={userData} />
      {isMobile && <BottomNav userName={userData?.name} />}
      <main style={{ marginLeft: isMobile ? 0 : 220, flex: 1, padding: isMobile ? '20px 16px' : '32px', overflowY: 'auto', paddingBottom: isMobile ? 90 : 32 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4A5A6E', marginBottom: 6 }}>Achievements</p>
          <h1 style={{ fontSize: 32, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', margin: 0 }}>Rewards & Progress</h1>
        </motion.div>

        {/* Top Row — Level card + Weekly Challenge */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Level / XP Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '28px 32px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(167,139,250,0.1), rgba(91,156,246,0.05))', border: '1px solid rgba(167,139,250,0.2)', position: 'relative', overflow: 'hidden' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              style={{ position: 'absolute', top: -80, right: -80, width: 260, height: 260, borderRadius: '50%', border: '1px solid rgba(167,139,250,0.08)', pointerEvents: 'none' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#A78BFA', marginBottom: 4, fontWeight: 600 }}>Your Level</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontSize: 72, fontWeight: 300, fontFamily: 'Playfair Display, serif', color: '#A78BFA', lineHeight: 1 }}>{level}</span>
                  <span style={{ fontSize: 14, color: '#5A6A7E' }}>/ ∞</span>
                </div>
                <p style={{ fontSize: 16, fontFamily: 'Playfair Display, serif', color: '#C8D4E0', fontStyle: 'italic', marginTop: 4 }}>{levelTitle}</p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                style={{ fontSize: 48 }}
              >✨</motion.div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#3A4A5E' }}>{totalXP} XP total</span>
                <span style={{ fontSize: 11, color: '#A78BFA' }}>{toNext} XP to Level {level + 1}</span>
              </div>
              <XPBar progress={progress} color="#A78BFA" />
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
              {[['📋', 'Check-ins', `+${checkins.length * 50} XP`], ['🔥', 'Streak', `+${streak * 30} XP`]].map(([icon, label, xp]) => (
                <div key={label as string} style={{ padding: '8px 12px', borderRadius: 10, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)' }}>
                  <p style={{ fontSize: 14 }}>{icon}</p>
                  <p style={{ fontSize: 10, color: '#5A6A7E', margin: '2px 0' }}>{label}</p>
                  <p style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600 }}>{xp}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Weekly Challenge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ padding: '28px 32px', borderRadius: 20, background: `linear-gradient(135deg, ${weeklyChallenge.color}10, rgba(8,12,18,0.95))`, border: `1px solid ${weeklyChallenge.color}25` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: weeklyChallenge.color, fontWeight: 600, marginBottom: 4 }}>Weekly Challenge</p>
                <h3 style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', lineHeight: 1.4 }}>
                  {weeklyChallenge.icon} Aura's Pick
                </h3>
              </div>
              <div style={{ padding: '6px 14px', borderRadius: 20, background: `${weeklyChallenge.color}15`, border: `1px solid ${weeklyChallenge.color}30` }}>
                <span style={{ fontSize: 12, color: weeklyChallenge.color, fontWeight: 600 }}>+{weeklyChallenge.reward} XP</span>
              </div>
            </div>
            <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7, marginBottom: 20 }}>{weeklyChallenge.text}</p>
            <div style={{ height: 1, background: `${weeklyChallenge.color}15`, marginBottom: 16 }} />
            <div style={{ display: 'flex', gap: 24 }}>
              {[['😊', `${greenDays}`, 'Green days'], ['🌙', `${avgSleep.toFixed(1)}`, 'Avg sleep'], ['🔥', `${streak}`, 'Day streak']].map(([icon, val, label]) => (
                <div key={label as string}>
                  <p style={{ fontSize: 18 }}>{icon}</p>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#E8EEF5', fontFamily: 'Playfair Display, serif' }}>{val}</p>
                  <p style={{ fontSize: 10, color: '#3A4A5E' }}>{label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}
        >
          {[
            { icon: '🏅', label: 'Badges Earned', value: `${unlockedCount}/${ALL_BADGES.length}`, color: '#E8A04A' },
            { icon: '📋', label: 'Total Check-ins', value: totalCheckins, color: '#4FC3A1' },
            { icon: '😊', label: 'Green Days', value: greenDays, color: '#86efac' },
            { icon: '🌸', label: 'Blooming Days', value: bloomingDays, color: '#f9a8d4' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
              style={{ padding: '16px 18px', borderRadius: 14, background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
              <p style={{ fontSize: 24, fontWeight: 300, fontFamily: 'Playfair Display, serif', color: s.color, lineHeight: 1, margin: 0 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: '#4A5A6E', marginTop: 4 }}>{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Badge Section */}
        <div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 16, gap: isMobile ? 12 : 0 }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 3, fontWeight: 600 }}>Badge Collection</p>
              <h2 style={{ fontSize: 20, fontFamily: 'Playfair Display, serif', color: '#E8EEF5' }}>Your Achievements</h2>
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', width: isMobile ? '100%' : 'auto', paddingBottom: isMobile ? 4 : 0 }}>
              {CATEGORIES.map(cat => (
                <motion.button key={cat.id} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '7px 14px', borderRadius: 10, border: `1px solid ${activeCategory === cat.id ? 'rgba(79,195,161,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    background: activeCategory === cat.id ? 'rgba(79,195,161,0.1)' : 'transparent',
                    color: activeCategory === cat.id ? '#4FC3A1' : '#4A5A6E', fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    whiteSpace: 'nowrap'
                  }}>
                  {cat.icon} {cat.label}
                </motion.button>
              ))}
            </div>
          </div>

          <motion.div layout style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12 }}>
            <AnimatePresence mode="popLayout">
              {filtered.map((badge, i) => (
                <BadgeCard key={badge.id} badge={badge} unlocked={badge.isUnlocked} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        </div>

        {totalCheckins === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ marginTop: 24, padding: isMobile ? '24px' : '28px 32px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(79,195,161,0.08), rgba(91,156,246,0.05))', border: '1px solid rgba(79,195,161,0.15)', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', gap: isMobile ? 16 : 0 }}>
            <div>
              <h3 style={{ fontSize: 18, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 6 }}>Start earning XP today</h3>
              <p style={{ fontSize: 13, color: '#5A6A7E' }}>Log your first check-in to earn 50 XP and unlock your first badge.</p>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/checkin')}
              style={{ padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)', color: '#080C12', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,195,161,0.3)', whiteSpace: 'nowrap', marginLeft: isMobile ? 0 : 24, width: isMobile ? '100%' : 'auto' }}>
              Log today →
            </motion.button>
          </motion.div>
        )}
      </main>
    </div>
  )
}