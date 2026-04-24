'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Sidebar from '@/components/Sidebar'

const GAMES = [
  {
    id: 'memory-matrix',
    title: 'Memory Matrix',
    description: 'A grid of tiles flashes briefly — recall which ones lit up. Sharpens working memory and spatial recall.',
    emoji: '🧩',
    color: '#5B9CF6',
    gradient: 'linear-gradient(135deg, rgba(91,156,246,0.18), rgba(91,156,246,0.04))',
    border: 'rgba(91,156,246,0.25)',
    glow: 'rgba(91,156,246,0.3)',
    trains: ['Working Memory', 'Spatial Recall', 'Focus'],
    difficulty: 'Medium',
    duration: '2–4 min',
    path: '/games/memory-matrix',
  },
  {
    id: 'focus-flow',
    title: 'Focus Flow',
    description: 'Catch falling objects of one color while ignoring all others. Trains sustained attention and impulse control.',
    emoji: '🎯',
    color: '#4FC3A1',
    gradient: 'linear-gradient(135deg, rgba(79,195,161,0.18), rgba(79,195,161,0.04))',
    border: 'rgba(79,195,161,0.25)',
    glow: 'rgba(79,195,161,0.3)',
    trains: ['Attention', 'Impulse Control', 'Reaction Time'],
    difficulty: 'Easy → Hard',
    duration: '3 min',
    path: '/games/focus-flow',
  },
  {
    id: 'emotion-recall',
    title: 'Emotion Recall',
    description: 'A sequence of emotion emojis flashes — then answer questions about what you saw. Boosts emotional intelligence.',
    emoji: '💭',
    color: '#A78BFA',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(167,139,250,0.04))',
    border: 'rgba(167,139,250,0.25)',
    glow: 'rgba(167,139,250,0.3)',
    trains: ['Emotional IQ', 'Sequence Memory', 'Pattern Recognition'],
    difficulty: 'Easy',
    duration: '2–3 min',
    path: '/games/emotion-recall',
  },
  {
    id: 'speed-math',
    title: 'Speed Math',
    description: 'Solve arithmetic problems as fast as you can. Adaptive difficulty pushes you harder as you improve.',
    emoji: '⚡',
    color: '#5B9CF6',
    gradient: 'linear-gradient(135deg, rgba(91,156,246,0.18), rgba(91,156,246,0.04))',
    border: 'rgba(91,156,246,0.25)',
    glow: 'rgba(91,156,246,0.3)',
    trains: ['Processing Speed', 'Mental Arithmetic', 'Focus'],
    difficulty: 'Easy → Expert',
    duration: '1 min',
    path: '/games/speed-math',
  },
  {
    id: 'word-weaver',
    title: 'Word Weaver',
    description: 'Given 7 letters, form as many valid words as possible in 90 seconds. Longer words score more points.',
    emoji: '📝',
    color: '#E8A04A',
    gradient: 'linear-gradient(135deg, rgba(232,160,74,0.18), rgba(232,160,74,0.04))',
    border: 'rgba(232,160,74,0.25)',
    glow: 'rgba(232,160,74,0.3)',
    trains: ['Verbal Fluency', 'Vocabulary', 'Creative Thinking'],
    difficulty: 'Medium',
    duration: '90 sec',
    path: '/games/word-weaver',
  },
  {
    id: 'pattern-pulse',
    title: 'Pattern Pulse',
    description: 'Colored pads flash in a sequence. Watch carefully and repeat the pattern from memory. Sequences get longer!',
    emoji: '🎵',
    color: '#A78BFA',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(167,139,250,0.04))',
    border: 'rgba(167,139,250,0.25)',
    glow: 'rgba(167,139,250,0.3)',
    trains: ['Sequential Memory', 'Auditory-Visual Sync', 'Reaction'],
    difficulty: 'Easy → Hard',
    duration: 'Endless',
    path: '/games/pattern-pulse',
  },
]

export default function GamesHub() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userName, setUserName] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const [hoveredGame, setHoveredGame] = useState<string | null>(null)
  const [recGameId, setRecGameId] = useState<string | null>(null)
  const [showRecBanner, setShowRecBanner] = useState(false)

  useEffect(() => {
    const rec = searchParams.get('rec')
    if (rec) {
      setRecGameId(rec)
      setShowRecBanner(true)
      // Auto-dismiss banner after 8s
      const t = setTimeout(() => setShowRecBanner(false), 8000)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/onboarding'); return }
      setUserName(firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student')
      try {
        const res = await fetch(`/api/user?firebaseUid=${firebaseUser.uid}`)
        const ud = await res.json()
        if (!ud.error) setUserData(ud)
      } catch (e) { console.error(e) }
    })
    return () => unsub()
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      {/* Ambient orbs */}
      <div style={{
        position: 'fixed', top: '10%', right: '15%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(91,156,246,0.06) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div style={{
        position: 'fixed', bottom: '10%', left: '25%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,195,161,0.05) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <Sidebar userName={userName} userData={userData} />

      <main style={{ flex: 1, marginLeft: '220px', padding: '60px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 56 }}>
          <p style={{
            fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#5B9CF6', fontWeight: 600, marginBottom: 10,
          }}>
            Brain Training
          </p>
          <h1 style={{
            fontSize: 42, fontFamily: 'Playfair Display, serif',
            color: '#E8EEF5', lineHeight: 1.15, marginBottom: 12, fontWeight: 600,
          }}>
            Mind Games
          </h1>
          <p style={{ fontSize: 15, color: '#4A5A6E', lineHeight: 1.7, maxWidth: 480 }}>
            Short, science-backed games designed to strengthen your cognitive abilities. Play daily to track your progress over time.
          </p>
        </motion.div>

        {/* Mood recommendation banner */}
        <AnimatePresence>
          {showRecBanner && recGameId && (() => {
            const recGame = GAMES.find(g => g.id === recGameId)
            if (!recGame) return null
            return (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4 }}
                style={{
                  marginBottom: 24, padding: '16px 20px', borderRadius: 16,
                  background: `linear-gradient(135deg, ${recGame.color}12, ${recGame.color}06)`,
                  border: `1px solid ${recGame.color}30`,
                  display: 'flex', alignItems: 'center', gap: 16,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: `${recGame.color}15`,
                  border: `1px solid ${recGame.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20,
                }}>
                  {recGame.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: recGame.color, flexShrink: 0 }}
                    />
                    <p style={{ fontSize: 12, fontWeight: 600, color: recGame.color }}>Aura recommends for your mood</p>
                  </div>
                  <p style={{ fontSize: 13, color: '#C8D4E0', fontWeight: 500 }}>
                    {recGame.title} — {recGame.trains[0]} · {recGame.trains[1]}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  onClick={() => router.push(recGame.path)}
                  style={{
                    padding: '8px 18px', borderRadius: 10, border: 'none',
                    background: `linear-gradient(135deg, ${recGame.color}, ${recGame.color}BB)`,
                    color: '#080C12', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', whiteSpace: 'nowrap',
                    boxShadow: `0 4px 16px ${recGame.color}30`,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Play now →
                </motion.button>
                <button
                  onClick={() => setShowRecBanner(false)}
                  style={{
                    background: 'none', border: 'none',
                    color: '#3A4A5E', fontSize: 18, cursor: 'pointer',
                    lineHeight: 1, padding: '0 4px', flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </motion.div>
            )
          })()}
        </AnimatePresence>

        {/* Daily challenge banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            marginBottom: 48, padding: '20px 24px', borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(91,156,246,0.1), rgba(167,139,250,0.08))',
            border: '1px solid rgba(91,156,246,0.2)',
            display: 'flex', alignItems: 'center', gap: 20,
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'rgba(91,156,246,0.15)',
            border: '1px solid rgba(91,156,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            ⚡
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#C8D4E0', marginBottom: 3 }}>
              Daily Brain Challenge
            </p>
            <p style={{ fontSize: 12, color: '#4A5A6E' }}>
              Play any game today to keep your mental fitness streak alive. Each session trains a different cognitive skill.
            </p>
          </div>
          <div style={{
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(91,156,246,0.15)',
            border: '1px solid rgba(91,156,246,0.25)',
            fontSize: 12, color: '#5B9CF6', fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            Today's Challenge
          </div>
        </motion.div>

        {/* Game cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {GAMES.map((game, i) => {
            const isRecommended = game.id === recGameId
            return (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              onHoverStart={() => setHoveredGame(game.id)}
              onHoverEnd={() => setHoveredGame(null)}
              onClick={() => router.push(game.path)}
              style={{
                padding: '32px', borderRadius: 20, cursor: 'pointer',
                background: game.gradient,
                border: `1px solid ${hoveredGame === game.id || isRecommended ? game.border : 'rgba(255,255,255,0.06)'}`,
                transition: 'border 0.3s, box-shadow 0.3s, transform 0.2s',
                boxShadow: hoveredGame === game.id || isRecommended ? `0 8px 40px ${game.glow}` : 'none',
                transform: hoveredGame === game.id ? 'translateY(-4px)' : 'none',
                position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Glow orb */}
              <div style={{
                position: 'absolute', top: -20, right: -20,
                width: 120, height: 120, borderRadius: '50%',
                background: `radial-gradient(circle, ${game.color}18 0%, transparent 70%)`,
                pointerEvents: 'none',
              }} />

              {/* Recommended badge */}
              {isRecommended && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute', top: 14, right: 14,
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20,
                    background: `${game.color}20`,
                    border: `1px solid ${game.color}50`,
                    zIndex: 2,
                  }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: 5, height: 5, borderRadius: '50%', background: game.color }}
                  />
                  <span style={{ fontSize: 9, color: game.color, fontWeight: 700, letterSpacing: '0.08em' }}>
                    AURA PICK
                  </span>
                </motion.div>
              )}

              {/* Emoji + difficulty */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div style={{
                  width: 54, height: 54, borderRadius: 14,
                  background: `${game.color}15`,
                  border: `1px solid ${game.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26,
                }}>
                  {game.emoji}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: `${game.color}15`,
                    border: `1px solid ${game.color}25`,
                    fontSize: 10, color: game.color, fontWeight: 600,
                    marginBottom: 4, display: 'inline-block',
                  }}>
                    {game.difficulty}
                  </div>
                  <p style={{ fontSize: 10, color: '#3A4A5E' }}>⏱ {game.duration}</p>
                </div>
              </div>

              {/* Title & description */}
              <h2 style={{
                fontSize: 20, fontFamily: 'Playfair Display, serif',
                color: '#E8EEF5', marginBottom: 10, fontWeight: 600,
              }}>
                {game.title}
              </h2>
              <p style={{ fontSize: 13, color: '#4A5A6E', lineHeight: 1.65, marginBottom: 24 }}>
                {game.description}
              </p>

              {/* Skills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
                {game.trains.map(skill => (
                  <span key={skill} style={{
                    padding: '3px 10px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: 10, color: '#5A6A7E', fontWeight: 500,
                  }}>
                    {skill}
                  </span>
                ))}
              </div>

              {/* Play button */}
              <motion.div
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  padding: '13px 20px', borderRadius: 12, textAlign: 'center',
                  background: `linear-gradient(135deg, ${game.color}, ${game.color}AA)`,
                  color: '#080C12', fontSize: 13, fontWeight: 700,
                  boxShadow: `0 4px 20px ${game.color}30`,
                  cursor: 'pointer',
                }}
              >
                Play Now →
              </motion.div>
            </motion.div>
            )
          })}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          style={{ marginTop: 48, fontSize: 12, color: '#2A3547', textAlign: 'center' }}
        >
          All games are designed to complement your daily mental health check-in. Consistent play improves cognitive resilience over time.
        </motion.p>
      </main>
    </div>
  )
}
