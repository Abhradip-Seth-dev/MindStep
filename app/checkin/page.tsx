'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { useUser } from '@/lib/UserContext'
import Sidebar from '@/components/Sidebar'

// ── Mood-triggered game recommendation engine ──────────────────────────────
const GAME_META: Record<string, { title: string; emoji: string; color: string; path: string; gradient: string; border: string }> = {
  'memory-matrix': {
    title: 'Memory Matrix', emoji: '🧩', color: '#5B9CF6',
    path: '/games/memory-matrix',
    gradient: 'linear-gradient(135deg, rgba(91,156,246,0.18), rgba(91,156,246,0.04))',
    border: 'rgba(91,156,246,0.3)',
  },
  'focus-flow': {
    title: 'Focus Flow', emoji: '🎯', color: '#4FC3A1',
    path: '/games/focus-flow',
    gradient: 'linear-gradient(135deg, rgba(79,195,161,0.18), rgba(79,195,161,0.04))',
    border: 'rgba(79,195,161,0.3)',
  },
  'emotion-recall': {
    title: 'Emotion Recall', emoji: '💭', color: '#A78BFA',
    path: '/games/emotion-recall',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(167,139,250,0.04))',
    border: 'rgba(167,139,250,0.3)',
  },
  'speed-math': {
    title: 'Speed Math', emoji: '⚡', color: '#5B9CF6',
    path: '/games/speed-math',
    gradient: 'linear-gradient(135deg, rgba(91,156,246,0.18), rgba(91,156,246,0.04))',
    border: 'rgba(91,156,246,0.3)',
  },
  'word-weaver': {
    title: 'Word Weaver', emoji: '📝', color: '#E8A04A',
    path: '/games/word-weaver',
    gradient: 'linear-gradient(135deg, rgba(232,160,74,0.18), rgba(232,160,74,0.04))',
    border: 'rgba(232,160,74,0.3)',
  },
  'pattern-pulse': {
    title: 'Pattern Pulse', emoji: '🎵', color: '#A78BFA',
    path: '/games/pattern-pulse',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(167,139,250,0.04))',
    border: 'rgba(167,139,250,0.3)',
  },
}

type Recommendation = {
  gameId: string
  reason: string
  insight: string
}

function getGameRecommendation(answers: {
  emotion: string
  sleep: number
  pressure: number
  socialEnergy: number
  ate: string
}): Recommendation {
  const { emotion, sleep, pressure } = answers

  // Hard override: very low sleep → always Word Weaver (lowest cognitive demand)
  if (sleep <= 3) {
    return {
      gameId: 'word-weaver',
      reason: 'Your sleep was very low — Word Weaver is gentle on a tired mind.',
      insight: 'Language games activate the brain without overwhelming it.',
    }
  }

  // Hard override: very high pressure + not feeling good → Emotion Recall (calming)
  if (pressure >= 8 && emotion !== 'Good') {
    return {
      gameId: 'emotion-recall',
      reason: `High pressure detected — Emotion Recall helps you slow down and reset.`,
      insight: 'Grounding exercises reduce cortisol and restore focus.',
    }
  }

  // Emotion-based recommendations
  switch (emotion) {
    case 'Good':
      // Peak state — push them hard
      if (sleep >= 7) {
        return {
          gameId: 'speed-math',
          reason: 'You\'re in a great state with solid sleep — the perfect time to push your limits.',
          insight: 'Peak mood + good rest = your highest cognitive performance window.',
        }
      }
      return {
        gameId: 'memory-matrix',
        reason: 'You\'re feeling good — a solid memory challenge to match your energy.',
        insight: 'Working memory peaks when your mood is positive.',
      }

    case 'Okay':
      return {
        gameId: 'memory-matrix',
        reason: 'A balanced state is great for focused memory training.',
        insight: 'Neutral moods support steady, deliberate cognitive work.',
      }

    case 'Tired':
      return {
        gameId: 'word-weaver',
        reason: 'Low effort, still stimulating — perfect for a tired brain.',
        insight: 'Verbal fluency tasks drain less energy than pattern-based games.',
      }

    case 'Anxious':
      return {
        gameId: 'emotion-recall',
        reason: 'Emotion Recall grounds you in the present moment — exactly what you need.',
        insight: 'Mindful observation of emotions reduces anxiety signals in the brain.',
      }

    case 'Flat':
      return {
        gameId: 'pattern-pulse',
        reason: 'Rhythmic and stimulating — Pattern Pulse will wake your brain up.',
        insight: 'Sequential pattern games activate dopamine circuits and lift mood.',
      }

    case 'Overwhelmed':
      return {
        gameId: 'focus-flow',
        reason: 'Simple, calming, one thing at a time. That\'s Focus Flow.',
        insight: 'Directed attention exercises reduce cognitive overload within minutes.',
      }

    default:
      return {
        gameId: 'memory-matrix',
        reason: 'A great all-round brain challenge for any mood.',
        insight: 'Consistent memory training builds long-term cognitive resilience.',
      }
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const EMOTIONS = [
  { label: 'Good', color: '#4FC3A1', emoji: '😊' },
  { label: 'Okay', color: '#5B9CF6', emoji: '😐' },
  { label: 'Tired', color: '#8B9BB0', emoji: '😴' },
  { label: 'Anxious', color: '#E8A04A', emoji: '😰' },
  { label: 'Flat', color: '#A78BFA', emoji: '😶' },
  { label: 'Overwhelmed', color: '#E05C5C', emoji: '😵' },
]

const QUESTIONS = [
  {
    id: 'sleep',
    number: '01',
    label: 'Sleep Quality',
    question: 'How well did you sleep last night?',
    hint: 'Consider both duration and how rested you feel.',
    color: '#5B9CF6',
    gradient: 'linear-gradient(135deg, rgba(91,156,246,0.15), rgba(91,156,246,0.03))',
    border: 'rgba(91,156,246,0.2)',
    type: 'slider',
    low: 'Terrible',
    high: 'Perfect',
  },
  {
    id: 'socialEnergy',
    number: '02',
    label: 'Social Energy',
    question: 'How connected did you feel to people today?',
    hint: 'Did you want to be around others, or did you withdraw?',
    color: '#4FC3A1',
    gradient: 'linear-gradient(135deg, rgba(79,195,161,0.15), rgba(79,195,161,0.03))',
    border: 'rgba(79,195,161,0.2)',
    type: 'slider',
    low: 'Isolated',
    high: 'Connected',
  },
  {
    id: 'pressure',
    number: '03',
    label: 'Academic Pressure',
    question: 'How much pressure did you feel today?',
    hint: 'Deadlines, exams, assignments — how heavy did it feel?',
    color: '#E8A04A',
    gradient: 'linear-gradient(135deg, rgba(232,160,74,0.15), rgba(232,160,74,0.03))',
    border: 'rgba(232,160,74,0.2)',
    type: 'slider',
    low: 'None',
    high: 'Crushing',
  },
  {
    id: 'ate',
    number: '04',
    label: 'Nutrition',
    question: 'Did you eat properly today?',
    hint: 'Regular meals matter more than you think for your mood.',
    color: '#A78BFA',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(167,139,250,0.03))',
    border: 'rgba(167,139,250,0.2)',
    type: 'toggle',
  },
  {
    id: 'emotion',
    number: '05',
    label: 'Current Emotion',
    question: 'How do you feel right now, in this moment?',
    hint: 'Pick the one that fits closest. There are no wrong answers.',
    color: '#E05C5C',
    gradient: 'linear-gradient(135deg, rgba(224,92,92,0.15), rgba(224,92,92,0.03))',
    border: 'rgba(224,92,92,0.2)',
    type: 'emotion',
  },
]

export default function CheckIn() {
  const router = useRouter()
  const { user, userData, loading } = useUser()
  const userName = user ? (user.displayName || user.email?.split('@')[0] || 'Student') : 'Student'
  const [currentQ, setCurrentQ] = useState(0)
  const [startTime] = useState(() => Date.now())
  const [answers, setAnswers] = useState({
    sleep: 5,
    socialEnergy: 5,
    pressure: 5,
    ate: 'yes',
    emotion: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [showRecommendation, setShowRecommendation] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/onboarding')
      return
    }

    const checkStatus = async () => {
      if (user) {
        try {
          const today = new Date().toISOString().split('T')[0]
          const res = await fetch(`/api/checkin?userId=${user.uid}&date=${today}`)
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setAlreadyDone(true)
          }
        } catch (e) {
          console.error(e)
        }
      }
    }
    checkStatus()
  }, [user, loading, router])

  const handleSubmit = async () => {
    if (!answers.emotion || !user) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          ...answers,
          startTime,
          endTime: Date.now(),
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        // Already checked in today or server error
        if (result.error === 'Already checked in today') {
          setAlreadyDone(true)
        } else {
          setSubmitError(result.error || 'Something went wrong. Please try again.')
        }
        return
      }
      setDone(true)
      // Phase 1: show success tick for 1.5s, then reveal recommendation
      setTimeout(() => setShowRecommendation(true), 1500)
    } catch (err) {
      console.error(err)
      setSubmitError('Network error. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  const q = QUESTIONS[currentQ]
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100
  const canProceed = q.type === 'emotion' ? !!answers.emotion : true

  if (alreadyDone) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
        <Sidebar userName={userName} userData={userData} />
        <main style={{
          flex: 1, marginLeft: '220px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', maxWidth: 400 }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(79,195,161,0.1)',
              border: '1px solid rgba(79,195,161,0.3)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px', fontSize: 32,
            }}>
              ✓
            </div>
            <h2 style={{
              fontSize: 28, fontFamily: 'Playfair Display, serif',
              color: '#E8EEF5', marginBottom: 8,
            }}>
              Already logged today
            </h2>
            <p style={{
              fontSize: 14, color: '#5A6A7E',
              marginBottom: 28, lineHeight: 1.6,
            }}>
              You've already checked in today. Come back tomorrow to keep your streak alive.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '12px 28px', borderRadius: 12,
                background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)',
                color: '#080C12', fontSize: 14, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(79,195,161,0.3)',
              }}
            >
              Back to dashboard →
            </motion.button>
          </motion.div>
        </main>
      </div>
    )
  }

  if (done) {
    const rec = getGameRecommendation(answers)
    const game = GAME_META[rec.gameId]

    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
        {/* Ambient glow tied to recommended game color */}
        <div style={{
          position: 'fixed', top: '10%', right: '10%',
          width: 600, height: 600, borderRadius: '50%',
          background: `radial-gradient(circle, ${game.color}08 0%, transparent 70%)`,
          pointerEvents: 'none', zIndex: 0,
          transition: 'background 0.8s ease',
        }} />

        <Sidebar userName={userName} userData={userData} />
        <main style={{
          flex: 1, marginLeft: '220px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 1,
        }}>
          <AnimatePresence mode="wait">
            {!showRecommendation ? (
              /* ── Phase 1: Success tick ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.4 } }}
                style={{ textAlign: 'center' }}
              >
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    width: 100, height: 100, borderRadius: '50%',
                    background: 'rgba(79,195,161,0.12)',
                    border: '1px solid rgba(79,195,161,0.4)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 28px',
                    boxShadow: '0 0 60px rgba(79,195,161,0.2)',
                  }}
                >
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                    stroke="#4FC3A1" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                </motion.div>
                <h2 style={{
                  fontSize: 36, fontFamily: 'Playfair Display, serif',
                  color: '#E8EEF5', marginBottom: 8,
                }}>
                  Logged successfully
                </h2>
                <p style={{ fontSize: 14, color: '#5A6A7E' }}>
                  Analysing your check-in...
                </p>
              </motion.div>
            ) : (
              /* ── Phase 2: Mood-triggered recommendation ── */
              <motion.div
                key="recommendation"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ textAlign: 'center', maxWidth: 480, padding: '0 24px' }}
              >
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p style={{
                    fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
                    color: game.color, fontWeight: 600, marginBottom: 10,
                  }}>
                    Aura recommends
                  </p>
                  <h2 style={{
                    fontSize: 30, fontFamily: 'Playfair Display, serif',
                    color: '#E8EEF5', marginBottom: 6, fontWeight: 600, lineHeight: 1.25,
                  }}>
                    Based on how you're feeling
                  </h2>
                  <p style={{ fontSize: 13, color: '#4A5A6E', lineHeight: 1.6, marginBottom: 32 }}>
                    {rec.reason}
                  </p>
                </motion.div>

                {/* Game card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  style={{
                    padding: '32px', borderRadius: 24,
                    background: game.gradient,
                    border: `1px solid ${game.border}`,
                    marginBottom: 28, position: 'relative', overflow: 'hidden',
                    boxShadow: `0 16px 60px ${game.color}20`,
                  }}
                >
                  {/* Glow orb */}
                  <div style={{
                    position: 'absolute', top: -30, right: -30,
                    width: 160, height: 160, borderRadius: '50%',
                    background: `radial-gradient(circle, ${game.color}18 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />

                  {/* Emotion badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 12px', borderRadius: 20,
                    background: `${game.color}15`,
                    border: `1px solid ${game.color}30`,
                    marginBottom: 20,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: game.color }} />
                    <span style={{ fontSize: 10, color: game.color, fontWeight: 600, letterSpacing: '0.1em' }}>
                      {answers.emotion.toUpperCase()} MOOD
                    </span>
                  </div>

                  {/* Game info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: 16, flexShrink: 0,
                      background: `${game.color}15`,
                      border: `1px solid ${game.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 30,
                    }}>
                      {game.emoji}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{
                        fontSize: 22, fontFamily: 'Playfair Display, serif',
                        color: '#E8EEF5', marginBottom: 4, fontWeight: 600,
                      }}>
                        {game.title}
                      </h3>
                      <p style={{ fontSize: 12, color: '#5A6A7E', lineHeight: 1.5 }}>
                        {rec.insight}
                      </p>
                    </div>
                  </div>

                  {/* Play button */}
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => router.push(`${game.path}?rec=mood`)}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                      background: `linear-gradient(135deg, ${game.color}, ${game.color}BB)`,
                      color: '#080C12', fontSize: 14, fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: `0 6px 24px ${game.color}40`,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Play {game.title} now →
                  </motion.button>
                </motion.div>

                {/* Secondary action */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}
                >
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => router.push(`/games?rec=${rec.gameId}`)}
                    style={{
                      padding: '10px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#5A6A7E', fontSize: 13, cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Browse all games
                  </motion.button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    style={{
                      background: 'none', border: 'none',
                      fontSize: 12, color: '#3A4A5E',
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Go to dashboard →
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>

      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: '20%', right: '10%',
        width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${q.color}08 0%, transparent 70%)`,
        pointerEvents: 'none', transition: 'background 0.6s ease', zIndex: 0,
      }} />

      <Sidebar userName={userName} userData={userData} />

      <main style={{
        flex: 1, marginLeft: '220px',
        minHeight: '100vh', display: 'flex',
        position: 'relative', zIndex: 1,
      }}>

        {/* Left — Question panel */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center', padding: '60px',
          maxWidth: 600,
        }}>

          {/* Progress */}
          <div style={{ marginBottom: 48 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 10,
            }}>
              <p style={{
                fontSize: 11, letterSpacing: '0.15em',
                textTransform: 'uppercase', color: '#3A4A5E',
              }}>
                Daily check-in
              </p>
              <p style={{ fontSize: 12, color: '#3A4A5E' }}>
                {currentQ + 1} / {QUESTIONS.length}
              </p>
            </div>
            <div style={{
              height: 2, borderRadius: 1,
              background: 'rgba(255,255,255,0.05)', overflow: 'hidden',
            }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  height: '100%', borderRadius: 1,
                  background: `linear-gradient(90deg, ${q.color}, ${q.color}88)`,
                  boxShadow: `0 0 8px ${q.color}60`,
                }}
              />
            </div>
          </div>

          {/* Steps indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 48 }}>
            {QUESTIONS.map((item, i) => (
              <div
                key={i}
                style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: i <= currentQ ? item.color : 'rgba(255,255,255,0.06)',
                  transition: 'background 0.3s',
                  boxShadow: i === currentQ ? `0 0 8px ${item.color}80` : 'none',
                }}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p style={{
                fontSize: 11, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: q.color,
                marginBottom: 8, fontWeight: 600,
              }}>
                {q.number} — {q.label}
              </p>

              <h2 style={{
                fontSize: 32, fontFamily: 'Playfair Display, serif',
                color: '#E8EEF5', lineHeight: 1.25,
                marginBottom: 12, fontWeight: 600,
              }}>
                {q.question}
              </h2>

              <p style={{
                fontSize: 14, color: '#4A5A6E',
                lineHeight: 1.7, marginBottom: 40,
              }}>
                {q.hint}
              </p>

              {/* Answer input */}
              <div style={{
                padding: '28px', borderRadius: 20,
                background: q.gradient,
                border: `1px solid ${q.border}`,
                marginBottom: 40,
              }}>

                {/* Slider */}
                {q.type === 'slider' && (
                  <div>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 20,
                    }}>
                      <span style={{ fontSize: 12, color: '#4A5A6E' }}>{q.low}</span>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{
                          fontSize: 52, fontWeight: 300,
                          fontFamily: 'Playfair Display, serif',
                          color: q.color, lineHeight: 1,
                        }}>
                          {(answers as any)[q.id]}
                        </span>
                        <span style={{ fontSize: 16, color: '#4A5A6E' }}>/ 10</span>
                      </div>
                      <span style={{ fontSize: 12, color: '#4A5A6E' }}>{q.high}</span>
                    </div>
                    <input
                      type="range" min="1" max="10"
                      value={(answers as any)[q.id]}
                      onChange={(e) =>
                        setAnswers({ ...answers, [q.id]: parseInt(e.target.value) })
                      }
                      style={{
                        width: '100%', height: 6, borderRadius: 3,
                        outline: 'none', cursor: 'pointer',
                        background: `linear-gradient(to right, ${q.color} 0%, ${q.color} ${((answers as any)[q.id] - 1) / 9 * 100}%, rgba(255,255,255,0.08) ${((answers as any)[q.id] - 1) / 9 * 100}%)`,
                        accentColor: q.color,
                      }}
                    />
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginTop: 8, padding: '0 2px',
                    }}>
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                        <span key={n} style={{
                          fontSize: 10,
                          color: (answers as any)[q.id] >= n ? q.color : '#2A3547',
                          fontWeight: (answers as any)[q.id] === n ? 600 : 400,
                          transition: 'color 0.2s',
                        }}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toggle */}
                {q.type === 'toggle' && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { value: 'yes', label: 'Yes, properly', emoji: '✅' },
                      { value: 'somewhat', label: 'Somewhat', emoji: '🟡' },
                      { value: 'no', label: 'Not really', emoji: '❌' },
                    ].map((opt) => (
                      <motion.button
                        key={opt.value}
                        whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setAnswers({ ...answers, ate: opt.value })}
                        style={{
                          flex: 1, padding: '20px 12px', borderRadius: 14,
                          border: answers.ate === opt.value
                            ? '1px solid rgba(167,139,250,0.4)'
                            : '1px solid rgba(255,255,255,0.06)',
                          background: answers.ate === opt.value
                            ? 'rgba(167,139,250,0.12)'
                            : 'rgba(255,255,255,0.02)',
                          color: answers.ate === opt.value ? '#A78BFA' : '#4A5A6E',
                          cursor: 'pointer', textAlign: 'center',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ fontSize: 24, marginBottom: 8 }}>{opt.emoji}</div>
                        <div style={{
                          fontSize: 12,
                          fontWeight: answers.ate === opt.value ? 500 : 400,
                        }}>
                          {opt.label}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Emotion */}
                {q.type === 'emotion' && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 10,
                  }}>
                    {EMOTIONS.map((emotion) => (
                      <motion.button
                        key={emotion.label}
                        whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}
                        onClick={() => setAnswers({ ...answers, emotion: emotion.label })}
                        style={{
                          padding: '18px 12px', borderRadius: 14,
                          border: answers.emotion === emotion.label
                            ? `1px solid ${emotion.color}50`
                            : '1px solid rgba(255,255,255,0.05)',
                          background: answers.emotion === emotion.label
                            ? `${emotion.color}12`
                            : 'rgba(255,255,255,0.02)',
                          color: answers.emotion === emotion.label
                            ? emotion.color : '#4A5A6E',
                          cursor: 'pointer', textAlign: 'center',
                          transition: 'all 0.2s',
                          boxShadow: answers.emotion === emotion.label
                            ? `0 4px 20px ${emotion.color}20` : 'none',
                        }}
                      >
                        <div style={{ fontSize: 22, marginBottom: 6 }}>{emotion.emoji}</div>
                        <div style={{
                          fontSize: 12,
                          fontWeight: answers.emotion === emotion.label ? 500 : 400,
                        }}>
                          {emotion.label}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 12 }}>
                {currentQ > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentQ(currentQ - 1)}
                    style={{
                      padding: '14px 24px', borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.07)',
                      background: 'rgba(255,255,255,0.03)',
                      color: '#5A6A7E', fontSize: 14, cursor: 'pointer',
                    }}
                  >
                    ← Back
                  </motion.button>
                )}

                {currentQ < QUESTIONS.length - 1 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentQ(currentQ + 1)}
                    style={{
                      flex: 1, padding: '14px 24px', borderRadius: 12,
                      border: 'none',
                      background: `linear-gradient(135deg, ${q.color}, ${q.color}BB)`,
                      color: '#080C12', fontSize: 14, fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: `0 4px 20px ${q.color}30`,
                    }}
                  >
                    Next →
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSubmit}
                    disabled={!canProceed || submitting}
                    style={{
                      flex: 1, padding: '14px 24px', borderRadius: 12,
                      border: 'none',
                      background: canProceed
                        ? 'linear-gradient(135deg, #4FC3A1, #3DA88B)'
                        : 'rgba(255,255,255,0.05)',
                      color: canProceed ? '#080C12' : '#3A4A5E',
                      fontSize: 14, fontWeight: 600,
                      cursor: canProceed ? 'pointer' : 'not-allowed',
                      boxShadow: canProceed ? '0 4px 20px rgba(79,195,161,0.3)' : 'none',
                      transition: 'all 0.3s',
                    }}
                  >
                    {submitting ? 'Saving...' : 'Submit check-in ✓'}
                  </motion.button>
                )}
              </div>

              {/* Error message */}
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    marginTop: 16, padding: '12px 16px', borderRadius: 10,
                    background: 'rgba(224,92,92,0.1)',
                    border: '1px solid rgba(224,92,92,0.25)',
                    color: '#E05C5C', fontSize: 13, lineHeight: 1.5,
                  }}
                >
                  ⚠️ {submitError}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right — Visual panel */}
        <div style={{
          width: 380, borderLeft: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexDirection: 'column',
          padding: '60px 40px', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '30%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 300, height: 300, borderRadius: '50%',
            background: `radial-gradient(circle, ${q.color}10 0%, transparent 70%)`,
            transition: 'background 0.6s ease', pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{
              fontSize: 11, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: '#3A4A5E', marginBottom: 20,
            }}>
              All questions
            </p>

            {QUESTIONS.map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ x: 4 }}
                onClick={() => i <= currentQ && setCurrentQ(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 14px', borderRadius: 12, marginBottom: 6,
                  cursor: i <= currentQ ? 'pointer' : 'default',
                  background: i === currentQ ? `${item.color}08` : 'transparent',
                  border: i === currentQ
                    ? `1px solid ${item.color}20`
                    : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: i < currentQ
                    ? `${item.color}20`
                    : i === currentQ
                    ? `${item.color}15`
                    : 'rgba(255,255,255,0.03)',
                  border: i < currentQ
                    ? `1px solid ${item.color}50`
                    : i === currentQ
                    ? `1px solid ${item.color}40`
                    : '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                  fontSize: 10,
                  color: i < currentQ ? item.color : '#3A4A5E',
                  fontWeight: 600,
                }}>
                  {i < currentQ ? '✓' : item.number}
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: 12,
                    fontWeight: i === currentQ ? 500 : 400,
                    color: i === currentQ
                      ? item.color
                      : i < currentQ ? '#5A6A7E' : '#2A3547',
                    marginBottom: 1,
                  }}>
                    {item.label}
                  </p>
                  {i < currentQ && (
                    <p style={{ fontSize: 11, color: '#3A4A5E' }}>
                      {item.id === 'sleep' && `${answers.sleep} / 10`}
                      {item.id === 'socialEnergy' && `${answers.socialEnergy} / 10`}
                      {item.id === 'pressure' && `${answers.pressure} / 10`}
                      {item.id === 'ate' && answers.ate}
                      {item.id === 'emotion' && answers.emotion}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div style={{
            marginTop: 'auto', padding: '16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
            position: 'relative', zIndex: 1,
          }}>
            <p style={{
              fontSize: 11, color: '#3A4A5E',
              lineHeight: 1.7, fontStyle: 'italic',
            }}>
              "Your answers today contribute to your personal baseline. After 7 days, MindStep will know what's normal for you."
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}