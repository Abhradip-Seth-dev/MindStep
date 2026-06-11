'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { useUser } from '@/lib/UserContext'

// ── Mood-triggered game recommendation engine ──────────────────────────────
const GAME_META: Record<string, { title: string; emoji: string; color: string; path: string; gradient: string; border: string }> = {
  'memory-matrix': {
    title: 'Memory Matrix', emoji: '🧩', color: '#5B9CF6', path: '/games/memory-matrix',
    gradient: 'linear-gradient(135deg, rgba(91,156,246,0.18), rgba(91,156,246,0.04))', border: 'rgba(91,156,246,0.3)',
  },
  'focus-flow': {
    title: 'Focus Flow', emoji: '🎯', color: '#4FC3A1', path: '/games/focus-flow',
    gradient: 'linear-gradient(135deg, rgba(79,195,161,0.18), rgba(79,195,161,0.04))', border: 'rgba(79,195,161,0.3)',
  },
  'emotion-recall': {
    title: 'Emotion Recall', emoji: '💭', color: '#A78BFA', path: '/games/emotion-recall',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(167,139,250,0.04))', border: 'rgba(167,139,250,0.3)',
  },
  'speed-math': {
    title: 'Speed Math', emoji: '⚡', color: '#5B9CF6', path: '/games/speed-math',
    gradient: 'linear-gradient(135deg, rgba(91,156,246,0.18), rgba(91,156,246,0.04))', border: 'rgba(91,156,246,0.3)',
  },
  'word-weaver': {
    title: 'Word Weaver', emoji: '📝', color: '#E8A04A', path: '/games/word-weaver',
    gradient: 'linear-gradient(135deg, rgba(232,160,74,0.18), rgba(232,160,74,0.04))', border: 'rgba(232,160,74,0.3)',
  },
  'pattern-pulse': {
    title: 'Pattern Pulse', emoji: '🎵', color: '#A78BFA', path: '/games/pattern-pulse',
    gradient: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(167,139,250,0.04))', border: 'rgba(167,139,250,0.3)',
  },
}

type Recommendation = { gameId: string; reason: string; insight: string }

function getGameRecommendation(answers: any): Recommendation {
  const { emotion, sleep, pressure } = answers
  if (sleep <= 3) return { gameId: 'word-weaver', reason: 'Your sleep was very low — Word Weaver is gentle on a tired mind.', insight: 'Language games activate the brain without overwhelming it.' }
  if (pressure >= 8 && emotion !== 'Good') return { gameId: 'emotion-recall', reason: `High pressure detected — Emotion Recall helps you slow down and reset.`, insight: 'Grounding exercises reduce cortisol and restore focus.' }
  switch (emotion) {
    case 'Good': return sleep >= 7 ? { gameId: 'speed-math', reason: 'You\'re in a great state with solid sleep — time to push your limits.', insight: 'Peak mood + good rest = your highest cognitive performance window.' } : { gameId: 'memory-matrix', reason: 'You\'re feeling good — a solid memory challenge to match your energy.', insight: 'Working memory peaks when your mood is positive.' }
    case 'Okay': return { gameId: 'memory-matrix', reason: 'A balanced state is great for focused memory training.', insight: 'Neutral moods support steady, deliberate cognitive work.' }
    case 'Tired': return { gameId: 'word-weaver', reason: 'Low effort, still stimulating — perfect for a tired brain.', insight: 'Verbal fluency tasks drain less energy than pattern-based games.' }
    case 'Anxious': return { gameId: 'emotion-recall', reason: 'Emotion Recall grounds you in the present moment — exactly what you need.', insight: 'Mindful observation of emotions reduces anxiety signals in the brain.' }
    case 'Flat': return { gameId: 'pattern-pulse', reason: 'Rhythmic and stimulating — Pattern Pulse will wake your brain up.', insight: 'Sequential pattern games activate dopamine circuits and lift mood.' }
    case 'Overwhelmed': return { gameId: 'focus-flow', reason: 'Simple, calming, one thing at a time. That\'s Focus Flow.', insight: 'Directed attention exercises reduce cognitive overload within minutes.' }
    default: return { gameId: 'memory-matrix', reason: 'A great all-round brain challenge for any mood.', insight: 'Consistent memory training builds long-term cognitive resilience.' }
  }
}

const EMOTIONS = [
  { label: 'Good', color: '#4FC3A1', emoji: '😊' },
  { label: 'Okay', color: '#5B9CF6', emoji: '😐' },
  { label: 'Tired', color: '#8B9BB0', emoji: '😴' },
  { label: 'Anxious', color: '#E8A04A', emoji: '😰' },
  { label: 'Flat', color: '#A78BFA', emoji: '😶' },
  { label: 'Overwhelmed', color: '#E05C5C', emoji: '😵' },
]

const QUESTIONS = [
  { id: 'sleep', number: '01', label: 'Sleep Quality', question: 'How well did you sleep last night?', hint: 'Consider both duration and how rested you feel.', type: 'slider', low: 'Terrible', high: 'Perfect', reverse: false },
  { id: 'socialEnergy', number: '02', label: 'Social Energy', question: 'How connected did you feel to people today?', hint: 'Did you want to be around others, or did you withdraw?', type: 'slider', low: 'Isolated', high: 'Connected', reverse: false },
  { id: 'pressure', number: '03', label: 'Academic Pressure', question: 'How much pressure did you feel today?', hint: 'Deadlines, exams, assignments — how heavy did it feel?', type: 'slider', low: 'None', high: 'Crushing', reverse: true },
  { id: 'ate', number: '04', label: 'Nutrition', question: 'Did you eat properly today?', hint: 'Regular meals matter more than you think for your mood.', type: 'toggle' },
  { id: 'emotion', number: '05', label: 'Current Emotion', question: 'How do you feel right now, in this moment?', hint: 'Pick the one that fits closest. There are no wrong answers.', type: 'emotion' },
  { id: 'notes', number: '06', label: 'One Sentence', question: 'Anything you want Aura to know?', hint: 'Optional — one sentence about your day, a worry, or something good that happened.', type: 'notes' },
]

// ── Main Component ────────────────────────────────────────────────────────
export default function CheckIn() {
  const router = useRouter()
  const { user, userData, loading } = useUser()
  const [currentQ, setCurrentQ] = useState(0)
  const [startTime] = useState(() => Date.now())
  const [answers, setAnswers] = useState<any>({ sleep: 5, socialEnergy: 5, pressure: 5, ate: 'yes', emotion: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [showRecommendation, setShowRecommendation] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!loading && !user) { router.push('/onboarding'); return }
    const checkStatus = async () => {
      if (user) {
        try {
          const today = new Date().toISOString().split('T')[0]
          const res = await fetch(`/api/checkin?userId=${user.uid}&date=${today}`)
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) setAlreadyDone(true)
        } catch (e) { console.error(e) }
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
        body: JSON.stringify({ userId: user.uid, ...answers, startTime, endTime: Date.now() }),
      })
      const result = await res.json()
      if (!res.ok) {
        if (result.error === 'Already checked in today') setAlreadyDone(true)
        else setSubmitError(result.error || 'Something went wrong. Please try again.')
        return
      }
      setDone(true)
      setTimeout(() => setShowRecommendation(true), 2500)
    } catch (err) {
      console.error(err)
      setSubmitError('Network error. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  const q = QUESTIONS[currentQ]
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100
  const canProceed = q.type === 'emotion' ? !!answers.emotion : true  // notes is always optional

  // Dynamic Background Color based on slider value
  const activeColor = useMemo(() => {
    if (q.type === 'emotion') {
      const em = EMOTIONS.find(e => e.label === answers.emotion)
      return em ? em.color : '#A78BFA'
    }
    if (q.type === 'toggle') {
      return answers.ate === 'yes' ? '#4FC3A1' : answers.ate === 'somewhat' ? '#E8A04A' : '#E05C5C'
    }
    const val = answers[q.id]
    // 1-10 mapping. If reverse is true, 1 is green, 10 is red.
    const isBad = q.reverse ? val >= 7 : val <= 4
    const isNeutral = q.reverse ? (val >= 4 && val <= 6) : (val >= 5 && val <= 6)
    if (isBad) return '#E05C5C'
    if (isNeutral) return '#E8A04A'
    return '#4FC3A1'
  }, [currentQ, answers])

  if (loading) return null

  if (alreadyDone) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(79,195,161,0.1)', border: '1px solid rgba(79,195,161,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32 }}>✓</div>
          <h2 style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 8 }}>Already logged today</h2>
          <p style={{ fontSize: 14, color: '#5A6A7E', marginBottom: 28, lineHeight: 1.6 }}>You've already checked in today. Come back tomorrow to keep your streak alive.</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/dashboard')}
            style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)', color: '#080C12', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,195,161,0.3)' }}>
            Back to dashboard →
          </motion.button>
        </motion.div>
      </div>
    )
  }

  if (done) {
    const rec = getGameRecommendation(answers)
    const game = GAME_META[rec.gameId]
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'fixed', top: '10%', right: '10%', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${game.color}08 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0, transition: 'background 0.8s ease' }} />
        <main style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <AnimatePresence mode="wait">
            {!showRecommendation ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85, y: -20, transition: { duration: 0.4 } }}>
                <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(79,195,161,0.12)', border: '1px solid rgba(79,195,161,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 0 60px rgba(79,195,161,0.2)' }}>
                  <span style={{ fontSize: 40 }}>✓</span>
                </motion.div>
                <h2 style={{ fontSize: 36, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 16 }}>Check-in Complete</h2>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
                  <span style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(91,156,246,0.1)', border: '1px solid rgba(91,156,246,0.2)', color: '#5B9CF6', fontSize: 13, fontWeight: 600 }}>+50 XP</span>
                  <span style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(232,160,74,0.1)', border: '1px solid rgba(232,160,74,0.2)', color: '#E8A04A', fontSize: 13, fontWeight: 600 }}>🔥 Streak +1</span>
                </div>
                <p style={{ fontSize: 14, color: '#4FC3A1', fontWeight: 500 }}>🌱 A new seed was planted in your Mind Garden!</p>
              </motion.div>
            ) : (
              <motion.div key="recommendation" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} style={{ maxWidth: 480, padding: '0 24px' }}>
                <p style={{ fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: game.color, fontWeight: 600, marginBottom: 10 }}>Aura recommends</p>
                <h2 style={{ fontSize: 30, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 6, fontWeight: 600 }}>Based on how you're feeling</h2>
                <p style={{ fontSize: 13, color: '#4A5A6E', lineHeight: 1.6, marginBottom: 32 }}>{rec.reason}</p>
                <motion.div whileHover={{ y: -4 }} style={{ padding: '32px', borderRadius: 24, background: game.gradient, border: `1px solid ${game.border}`, marginBottom: 28, position: 'relative', overflow: 'hidden', boxShadow: `0 16px 60px ${game.color}20`, textAlign: 'left' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: `${game.color}15`, border: `1px solid ${game.color}30`, marginBottom: 20 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: game.color }} />
                    <span style={{ fontSize: 10, color: game.color, fontWeight: 600, letterSpacing: '0.1em' }}>{answers.emotion.toUpperCase()} MOOD</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, flexShrink: 0, background: `${game.color}15`, border: `1px solid ${game.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>{game.emoji}</div>
                    <div>
                      <h3 style={{ fontSize: 22, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 4, fontWeight: 600 }}>{game.title}</h3>
                      <p style={{ fontSize: 12, color: '#5A6A7E', lineHeight: 1.5 }}>{rec.insight}</p>
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push(`${game.path}?rec=mood`)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${game.color}, ${game.color}BB)`, color: '#080C12', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 24px ${game.color}40` }}>
                    Play {game.title} now →
                  </motion.button>
                </motion.div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', fontSize: 13, color: '#5A6A7E', cursor: 'pointer' }}>Go to dashboard →</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', position: 'relative' }}>
      
      {/* Dynamic Ambient Glow */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40vh', background: `radial-gradient(ellipse at top, ${activeColor}15 0%, transparent 70%)`, transition: 'background 0.8s ease-in-out' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '60vh', background: `radial-gradient(ellipse at bottom, ${activeColor}08 0%, transparent 70%)`, transition: 'background 0.8s ease-in-out' }} />
      </div>

      {/* Back Button */}
      <button onClick={() => router.push('/dashboard')} style={{ position: 'absolute', top: 32, left: 32, zIndex: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 16px', borderRadius: 12, color: '#5A6A7E', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>←</span> Dashboard
      </button>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          
          {/* Progress Indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 48, justifyContent: 'center' }}>
            {QUESTIONS.map((_, i) => (
              <div key={i} style={{ height: 4, width: 40, borderRadius: 2, background: i <= currentQ ? activeColor : 'rgba(255,255,255,0.06)', transition: 'all 0.4s ease', boxShadow: i === currentQ ? `0 0 12px ${activeColor}50` : 'none' }} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }} transition={{ duration: 0.4 }} style={{ textAlign: 'center' }}>
              
              <p style={{ fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: activeColor, marginBottom: 12, fontWeight: 600, transition: 'color 0.4s ease' }}>
                {q.number} — {q.label}
              </p>
              <h2 style={{ fontSize: 36, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', lineHeight: 1.3, marginBottom: 16, fontWeight: 600 }}>{q.question}</h2>
              <p style={{ fontSize: 15, color: '#5A6A7E', lineHeight: 1.6, marginBottom: 48 }}>{q.hint}</p>

              {/* Answer Input Area */}
              <div style={{ marginBottom: 64 }}>
                {q.type === 'slider' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
                      <span style={{ fontSize: 72, fontWeight: 300, fontFamily: 'Playfair Display, serif', color: activeColor, lineHeight: 1, transition: 'color 0.4s ease' }}>{answers[q.id]}</span>
                      <span style={{ fontSize: 20, color: '#4A5A6E' }}>/ 10</span>
                    </div>
                    <div style={{ position: 'relative', padding: '10px 0' }}>
                      <input type="range" min="1" max="10" value={answers[q.id]} onChange={(e) => setAnswers({ ...answers, [q.id]: parseInt(e.target.value) })}
                        style={{ width: '100%', height: 8, borderRadius: 4, outline: 'none', cursor: 'pointer', appearance: 'none', background: `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${(answers[q.id] - 1) / 9 * 100}%, rgba(255,255,255,0.08) ${(answers[q.id] - 1) / 9 * 100}%)`, transition: 'background 0.1s' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '0 4px' }}>
                        <span style={{ fontSize: 12, color: '#4A5A6E' }}>{q.low}</span>
                        <span style={{ fontSize: 12, color: '#4A5A6E' }}>{q.high}</span>
                      </div>
                    </div>
                  </div>
                )}

                {q.type === 'toggle' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {[{ value: 'yes', label: 'Yes, properly', emoji: '✅' }, { value: 'somewhat', label: 'Somewhat', emoji: '🟡' }, { value: 'no', label: 'Not really', emoji: '❌' }].map((opt) => (
                      <motion.button key={opt.value} whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={() => setAnswers({ ...answers, ate: opt.value })}
                        style={{ padding: '24px 12px', borderRadius: 20, border: answers.ate === opt.value ? `1px solid ${activeColor}50` : '1px solid rgba(255,255,255,0.06)', background: answers.ate === opt.value ? `${activeColor}15` : 'rgba(255,255,255,0.02)', color: answers.ate === opt.value ? activeColor : '#4A5A6E', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>{opt.emoji}</div>
                        <div style={{ fontSize: 13, fontWeight: answers.ate === opt.value ? 600 : 400 }}>{opt.label}</div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {q.type === 'emotion' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    {EMOTIONS.map((emotion) => (
                      <motion.button key={emotion.label} whileHover={{ y: -4 }} whileTap={{ scale: 0.96 }} onClick={() => setAnswers({ ...answers, emotion: emotion.label })}
                        style={{ padding: '24px 12px', borderRadius: 20, border: answers.emotion === emotion.label ? `1px solid ${emotion.color}50` : '1px solid rgba(255,255,255,0.05)', background: answers.emotion === emotion.label ? `${emotion.color}15` : 'rgba(255,255,255,0.02)', color: answers.emotion === emotion.label ? emotion.color : '#4A5A6E', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: answers.emotion === emotion.label ? `0 8px 32px ${emotion.color}20` : 'none' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>{emotion.emoji}</div>
                        <div style={{ fontSize: 13, fontWeight: answers.emotion === emotion.label ? 600 : 400 }}>{emotion.label}</div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {q.type === 'notes' && (
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={answers.notes}
                      onChange={(e) => setAnswers({ ...answers, notes: e.target.value.slice(0, 200) })}
                      placeholder="e.g. &quot;I have a big exam tomorrow and I'm nervous about it.&quot;"
                      rows={4}
                      style={{
                        width: '100%', padding: '20px', borderRadius: 20, resize: 'none',
                        background: 'rgba(255,255,255,0.03)', border: `1px solid ${activeColor}30`,
                        color: '#E8EEF5', fontSize: 15, fontFamily: 'Inter, sans-serif',
                        outline: 'none', lineHeight: 1.7, boxSizing: 'border-box',
                        transition: 'border-color 0.3s ease',
                      }}
                      onFocus={(e) => e.target.style.borderColor = `${activeColor}70`}
                      onBlur={(e) => e.target.style.borderColor = `${activeColor}30`}
                    />
                    <div style={{
                      position: 'absolute', bottom: 12, right: 16,
                      fontSize: 11, color: answers.notes.length > 180 ? '#E8A04A' : '#3A4A5E',
                    }}>
                      {answers.notes.length}/200
                    </div>
                    <p style={{ fontSize: 12, color: '#3A4A5E', marginTop: 10, textAlign: 'center' }}>
                      ✦ Aura will read this before your next conversation
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                {currentQ > 0 && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCurrentQ(currentQ - 1)}
                    style={{ padding: '16px 32px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5A6A7E', fontSize: 15, cursor: 'pointer' }}>
                    Back
                  </motion.button>
                )}
                {currentQ < QUESTIONS.length - 1 ? (
                  <motion.button whileHover={{ scale: 1.05, boxShadow: `0 8px 32px ${activeColor}40` }} whileTap={{ scale: 0.95 }} onClick={() => setCurrentQ(currentQ + 1)}
                    style={{ padding: '16px 48px', borderRadius: 100, border: 'none', background: activeColor, color: '#080C12', fontSize: 15, fontWeight: 700, cursor: 'pointer', transition: 'background 0.4s ease, box-shadow 0.4s ease' }}>
                    Continue →
                  </motion.button>
                ) : (
                  <motion.button whileHover={{ scale: 1.05, boxShadow: `0 8px 32px ${activeColor}40` }} whileTap={{ scale: 0.95 }} onClick={handleSubmit} disabled={!canProceed || submitting}
                    style={{ padding: '16px 48px', borderRadius: 100, border: 'none', background: canProceed ? activeColor : 'rgba(255,255,255,0.05)', color: canProceed ? '#080C12' : '#3A4A5E', fontSize: 15, fontWeight: 700, cursor: canProceed ? 'pointer' : 'not-allowed', transition: 'all 0.4s ease' }}>
                    {submitting ? 'Saving...' : 'Finish Check-in ✓'}
                  </motion.button>
                )}
              </div>
              
              {submitError && (
                <div style={{ marginTop: 24, padding: '12px', borderRadius: 12, background: 'rgba(224,92,92,0.1)', color: '#E05C5C', fontSize: 14 }}>
                  ⚠️ {submitError}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}