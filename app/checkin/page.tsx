'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/UserContext'
import { useIsMobile } from '@/lib/hooks'
import type { MWPQQuestion } from '@/lib/questions'

// ── Game recommendation (kept for post-checkin screen) ─────────────────────
const GAME_META: Record<string, { title: string; emoji: string; color: string; path: string; gradient: string; border: string }> = {
  'memory-matrix': { title: 'Memory Matrix', emoji: '🧩', color: '#5B9CF6', path: '/games/memory-matrix', gradient: 'linear-gradient(135deg, rgba(91,156,246,0.18), rgba(91,156,246,0.04))', border: 'rgba(91,156,246,0.3)' },
  'focus-flow': { title: 'Focus Flow', emoji: '🎯', color: '#4FC3A1', path: '/games/focus-flow', gradient: 'linear-gradient(135deg, rgba(79,195,161,0.18), rgba(79,195,161,0.04))', border: 'rgba(79,195,161,0.3)' },
  'emotion-recall': { title: 'Emotion Recall', emoji: '💭', color: '#A78BFA', path: '/games/emotion-recall', gradient: 'linear-gradient(135deg, rgba(167,139,250,0.18), rgba(167,139,250,0.04))', border: 'rgba(167,139,250,0.3)' },
}

// ── Color helpers ───────────────────────────────────────────────────────────
function getScoreColor(value: number, max: number): string {
  const pct = value / max
  if (pct >= 0.7) return '#4FC3A1'
  if (pct >= 0.4) return '#E8A04A'
  return '#E05C5C'
}

// ── Question Input Components ───────────────────────────────────────────────
function FrequencySlider({ question, value, onChange, color }: {
  question: MWPQQuestion; value: number; onChange: (v: number) => void; color: string
}) {
  const labels = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
  const pct = ((value - 1) / 4) * 100
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
        <span style={{ fontSize: 72, fontWeight: 300, fontFamily: 'Playfair Display, serif', color, lineHeight: 1, transition: 'color 0.4s' }}>{value}</span>
        <span style={{ fontSize: 20, color: '#4A5A6E' }}>/ 5</span>
      </div>
      <p style={{ fontSize: 14, color, marginBottom: 16, fontWeight: 600, transition: 'color 0.4s' }}>{labels[value - 1]}</p>
      <input
        type="range" min="1" max="5" value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: '100%', height: 8, borderRadius: 4, outline: 'none', cursor: 'pointer', appearance: 'none', background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, rgba(255,255,255,0.08) ${pct}%)`, transition: 'background 0.1s' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        {labels.map((l, i) => (
          <span key={i} style={{ fontSize: 10, color: '#3A4A5E' }}>{l}</span>
        ))}
      </div>
    </div>
  )
}

function QualitySlider({ question, value, onChange, color }: {
  question: MWPQQuestion; value: number; onChange: (v: number) => void; color: string
}) {
  const labels = ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent']
  const pct = ((value - 1) / 4) * 100
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
        <span style={{ fontSize: 64, fontWeight: 300, fontFamily: 'Playfair Display, serif', color, lineHeight: 1, transition: 'color 0.4s' }}>{labels[value - 1]}</span>
      </div>
      <input
        type="range" min="1" max="5" value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        style={{ width: '100%', height: 8, borderRadius: 4, outline: 'none', cursor: 'pointer', appearance: 'none', background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, rgba(255,255,255,0.08) ${pct}%)`, transition: 'background 0.1s' }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
        {labels.map((l, i) => (
          <span key={i} style={{ fontSize: 10, color: '#3A4A5E' }}>{l}</span>
        ))}
      </div>
    </div>
  )
}

function ChoiceSelector({ question, value, onChange, color }: {
  question: MWPQQuestion; value: number; onChange: (v: number) => void; color: string
}) {
  const options = question.options ?? []
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {options.map((opt, i) => (
        <motion.button
          key={i}
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onChange(i)}
          style={{
            padding: '18px 24px', borderRadius: 16, textAlign: 'left',
            border: value === i ? `1px solid ${color}50` : '1px solid rgba(255,255,255,0.07)',
            background: value === i ? `${color}15` : 'rgba(255,255,255,0.02)',
            color: value === i ? color : '#5A6A7E',
            fontSize: 14, fontWeight: value === i ? 600 : 400,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            display: 'flex', alignItems: 'center', gap: 14,
            transition: 'all 0.2s',
          }}
        >
          <div style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            border: value === i ? `2px solid ${color}` : '2px solid rgba(255,255,255,0.2)',
            background: value === i ? color : 'transparent',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {value === i && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#080C12' }} />}
          </div>
          {opt}
        </motion.button>
      ))}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CheckIn() {
  const router = useRouter()
  const { user, userData, loading } = useUser()
  const isMobile = useIsMobile()

  const [questions, setQuestions] = useState<MWPQQuestion[]>([])
  const [phase, setPhase] = useState<'baseline' | 'daily'>('baseline')
  const [baselineDaysCompleted, setBaselineDaysCompleted] = useState(0)
  const [loadingQuestions, setLoadingQuestions] = useState(true)

  const [currentQ, setCurrentQ] = useState(0)
  const [startTime] = useState(() => Date.now())
  // answers: map of questionId → numeric value (1-5 for scale, index for choice)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [alreadyDone, setAlreadyDone] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [mwpqResult, setMwpqResult] = useState<any>(null)

  // ── Fetch today's questions ──────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !user) { router.push('/onboarding'); return }
    if (!user) return

    const fetchQuestions = async () => {
      try {
        // Check if already done today
        const today = new Date().toISOString().split('T')[0]
        const checkinRes = await fetch(`/api/checkin?userId=${user.uid}&date=${today}`)
        const checkinData = await checkinRes.json()
        if (Array.isArray(checkinData) && checkinData.length > 0) {
          setAlreadyDone(true)
          setLoadingQuestions(false)
          return
        }

        // Fetch today's question set
        const res = await fetch(`/api/questions?userId=${user.uid}`)
        const data = await res.json()

        if (data.error) {
          console.error('Failed to load questions:', data.error)
          setLoadingQuestions(false)
          return
        }

        setQuestions(data.questions)
        setPhase(data.phase)
        setBaselineDaysCompleted(data.baselineDaysCompleted)

        // Initialize all answers to the middle value (3)
        const defaultAnswers: Record<string, number> = {}
        for (const q of data.questions) {
          defaultAnswers[q.id] = q.type === 'yes_no' || q.type === 'multiple_choice' ? -1 : 3
        }
        setAnswers(defaultAnswers)
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingQuestions(false)
      }
    }

    fetchQuestions()
  }, [user, loading, router])

  const currentQuestion = questions[currentQ]
  const currentValue = currentQuestion ? (answers[currentQuestion.id] ?? (currentQuestion.type === 'yes_no' || currentQuestion.type === 'multiple_choice' ? -1 : 3)) : 3

  const activeColor = useMemo(() => {
    if (!currentQuestion) return '#4FC3A1'
    if (currentQuestion.type === 'frequency_scale' || currentQuestion.type === 'quality_scale') {
      return getScoreColor(currentValue, 5)
    }
    if (currentValue >= 0) return '#4FC3A1'
    return '#A78BFA'
  }, [currentQuestion, currentValue])

  const canProceed = useMemo(() => {
    if (!currentQuestion) return false
    if (currentQuestion.type === 'yes_no' || currentQuestion.type === 'multiple_choice') {
      return currentValue >= 0
    }
    return true
  }, [currentQuestion, currentValue])

  const handleAnswer = useCallback((questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }, [])

  const handleSubmit = async () => {
    if (!user) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const mwpqAnswers = questions.map(q => ({
        questionId: q.id,
        value: answers[q.id] ?? 3,
      }))

      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          mwpqAnswers,
          phase,
          notes: notes.trim(),
          startTime,
          endTime: Date.now(),
        }),
      })
      const result = await res.json()

      if (!res.ok) {
        if (result.error === 'Already checked in today') setAlreadyDone(true)
        else setSubmitError(result.error || 'Something went wrong. Please try again.')
        return
      }

      setMwpqResult(result)
      setDone(true)
    } catch (err) {
      console.error(err)
      setSubmitError('Network error. Please check your connection.')
    } finally {
      setSubmitting(false)
    }
  }

  const categoryLabel: Record<string, string> = {
    mood: '🌊 Mood',
    anxiety_stress: '⚡ Stress',
    sleep_energy: '🌙 Sleep & Energy',
    cognitive: '🧠 Focus',
    social: '👥 Social',
    productivity: '📋 Productivity',
    quality_of_life: '✨ Quality of Life',
    emotional_regulation: '💎 Emotional Regulation',
    burnout: '🔥 Burnout',
    resilience: '🌱 Resilience',
    purpose: '🎯 Purpose',
  }

  // ── Already done state ───────────────────────────────────────────────────
  if (alreadyDone) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
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

  // ── Done / Results state ─────────────────────────────────────────────────
  if (done && mwpqResult) {
    const status: string = mwpqResult.mwpqStatus ?? 'stable'
    const score: number = mwpqResult.overallScore ?? 3.5
    const domainScores: Record<string, number> = mwpqResult.domainScores ?? {}
    const isCalibrating = status === 'calibrating'
    const newBaselineDay = mwpqResult.baselineDaysCompleted ?? baselineDaysCompleted + 1

    const statusMeta: Record<string, { color: string; emoji: string; label: string; desc: string }> = {
      calibrating: { color: '#5B9CF6', emoji: '🔬', label: 'Calibrating', desc: `Day ${newBaselineDay} of 7 complete. Aura is learning your patterns.` },
      stable: { color: '#4FC3A1', emoji: '🌿', label: 'Stable', desc: 'You\'re doing well. Keep up the good work.' },
      drifting: { color: '#E8A04A', emoji: '🌊', label: 'Drifting', desc: 'Some areas are shifting. Keep checking in.' },
      needs_attention: { color: '#E8A04A', emoji: '⚠️', label: 'Needs Attention', desc: 'MindStep has noticed some patterns. Your wellbeing matters.' },
      alert: { color: '#E05C5C', emoji: '🔴', label: 'Alert', desc: 'Some areas need care. The counselling centre may reach out.' },
    }

    const meta = statusMeta[status] ?? statusMeta.stable
    const game = GAME_META['focus-flow']

    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ position: 'fixed', top: '10%', right: '10%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${meta.color}08 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
          <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 3, repeat: Infinity }}
            style={{ width: 100, height: 100, borderRadius: '50%', background: `${meta.color}15`, border: `1px solid ${meta.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 44, boxShadow: `0 0 60px ${meta.color}20` }}>
            {meta.emoji}
          </motion.div>

          <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: meta.color, marginBottom: 8, fontWeight: 600 }}>Check-in Complete</p>
          <h2 style={{ fontSize: 36, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 8, fontWeight: 600 }}>{meta.label}</h2>
          <p style={{ fontSize: 14, color: '#5A6A7E', marginBottom: 24, lineHeight: 1.6 }}>{meta.desc}</p>

          {/* XP & Streak badges */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
            <span style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(91,156,246,0.1)', border: '1px solid rgba(91,156,246,0.2)', color: '#5B9CF6', fontSize: 13, fontWeight: 600 }}>+50 XP</span>
            <span style={{ padding: '6px 14px', borderRadius: 20, background: 'rgba(232,160,74,0.1)', border: '1px solid rgba(232,160,74,0.2)', color: '#E8A04A', fontSize: 13, fontWeight: 600 }}>🔥 Streak +1</span>
          </div>

          {/* Baseline progress bar (only during calibration) */}
          {isCalibrating && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              style={{ padding: '20px', borderRadius: 16, background: 'rgba(91,156,246,0.06)', border: '1px solid rgba(91,156,246,0.15)', marginBottom: 24, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 12, color: '#5B9CF6', fontWeight: 600 }}>Baseline Calibration</p>
                <p style={{ fontSize: 12, color: '#3A4A5E' }}>{newBaselineDay} / 7 days</p>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${(newBaselineDay / 7) * 100}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #5B9CF6, #4FC3A1)', boxShadow: '0 0 8px rgba(91,156,246,0.6)' }} />
              </div>
              <p style={{ fontSize: 11, color: '#3A4A5E', marginTop: 8 }}>
                {newBaselineDay >= 7 ? '🎉 Calibration complete! Your wellness profile is ready.' : `${7 - newBaselineDay} more days until your personal baseline is ready.`}
              </p>
            </motion.div>
          )}

          {/* Domain scores (show after calibration) */}
          {!isCalibrating && Object.keys(domainScores).length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ padding: '20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3A4A5E', fontWeight: 600, marginBottom: 14 }}>Today's Domain Scores</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(domainScores).map(([domain, score]: [string, any]) => {
                  const col = getScoreColor(score, 5)
                  const pct = (score / 5) * 100
                  return (
                    <div key={domain}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: '#8B9BB0' }}>{categoryLabel[domain] ?? domain}</span>
                        <span style={{ fontSize: 12, color: col, fontWeight: 600 }}>{score.toFixed(1)}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                          style={{ height: '100%', borderRadius: 2, background: col }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push('/dashboard')}
              style={{ padding: '14px 28px', borderRadius: 14, background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)', color: '#080C12', fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,195,161,0.3)' }}>
              Back to Dashboard →
            </motion.button>
            <button onClick={() => router.push('/companion')} style={{ background: 'none', border: 'none', fontSize: 13, color: '#5A6A7E', cursor: 'pointer' }}>
              Talk to Aura about today →
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading || loadingQuestions) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(79,195,161,0.1)', borderTop: '2px solid #4FC3A1' }} />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#5A6A7E' }}>Could not load questions. Please refresh.</p>
      </div>
    )
  }

  const q = questions[currentQ]
  const qVal = answers[q.id] ?? (q.type === 'yes_no' || q.type === 'multiple_choice' ? -1 : 3)
  const progress = ((currentQ) / questions.length) * 100
  const isLastQ = currentQ === questions.length - 1

  // Is this a "notes" step? We add a notes question at the very end artificially
  const isNotesStep = currentQ === questions.length

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12', position: 'relative' }}>
      {/* Dynamic ambient glow */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '40vh', background: `radial-gradient(ellipse at top, ${activeColor}15 0%, transparent 70%)`, transition: 'background 0.8s ease-in-out' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '50%', transform: 'translateX(-50%)', width: '80vw', height: '60vh', background: `radial-gradient(ellipse at bottom, ${activeColor}08 0%, transparent 70%)`, transition: 'background 0.8s ease-in-out' }} />
      </div>

      {/* Back button */}
      <button onClick={() => router.push('/dashboard')} style={{ position: 'absolute', top: isMobile ? 20 : 32, left: isMobile ? 16 : 32, zIndex: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '8px 16px', borderRadius: 12, color: '#5A6A7E', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>←</span> Dashboard
      </button>

      {/* Phase + day badge */}
      {phase === 'baseline' && (
        <div style={{ position: 'absolute', top: isMobile ? 20 : 32, right: isMobile ? 16 : 32, zIndex: 10, padding: '6px 14px', borderRadius: 20, background: 'rgba(91,156,246,0.1)', border: '1px solid rgba(91,156,246,0.2)' }}>
          <span style={{ fontSize: 11, color: '#5B9CF6', fontWeight: 600 }}>🔬 Calibration Day {baselineDaysCompleted + 1}/7</span>
        </div>
      )}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, padding: isMobile ? '80px 16px 40px' : '80px 40px 40px' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>

          {/* Progress bar */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#3A4A5E' }}>Question {currentQ + 1} of {questions.length}</span>
              <span style={{ fontSize: 11, color: activeColor, fontWeight: 600 }}>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
                style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${activeColor}, ${activeColor}80)`, boxShadow: `0 0 8px ${activeColor}60` }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: 'center' }}
            >
              <p style={{ fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: activeColor, marginBottom: 12, fontWeight: 600, transition: 'color 0.4s' }}>
                {categoryLabel[q.category] ?? q.category}
              </p>
              <h2 style={{ fontSize: isMobile ? 24 : 32, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', lineHeight: 1.35, marginBottom: 12, fontWeight: 600 }}>
                {q.text}
              </h2>
              {q.hint && (
                <p style={{ fontSize: 14, color: '#4A5A6E', lineHeight: 1.6, marginBottom: 40, maxWidth: 420, margin: '0 auto 40px' }}>
                  {q.hint}
                </p>
              )}

              {/* Answer Input */}
              <div style={{ marginBottom: 48 }}>
                {q.type === 'frequency_scale' && (
                  <FrequencySlider question={q} value={qVal === -1 ? 3 : qVal} onChange={v => handleAnswer(q.id, v)} color={activeColor} />
                )}
                {q.type === 'quality_scale' && (
                  <QualitySlider question={q} value={qVal === -1 ? 3 : qVal} onChange={v => handleAnswer(q.id, v)} color={activeColor} />
                )}
                {(q.type === 'yes_no' || q.type === 'multiple_choice') && (
                  <ChoiceSelector question={q} value={qVal} onChange={v => handleAnswer(q.id, v)} color={activeColor} />
                )}
              </div>

              {/* Notes field shown on last question */}
              {isLastQ && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
                  <p style={{ fontSize: 12, color: '#5A6A7E', marginBottom: 10 }}>Optional: Anything you want Aura to know?</p>
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value.slice(0, 200))}
                      placeholder={'e.g. "I have an exam tomorrow and I\'m nervous"'}
                      rows={3}
                      style={{
                        width: '100%', padding: '16px', borderRadius: 16, resize: 'none',
                        background: 'rgba(255,255,255,0.03)', border: `1px solid ${activeColor}30`,
                        color: '#E8EEF5', fontSize: 14, fontFamily: 'Inter, sans-serif',
                        outline: 'none', lineHeight: 1.7, boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: notes.length > 180 ? '#E8A04A' : '#3A4A5E' }}>
                      {notes.length}/200
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Navigation */}
              <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                {currentQ > 0 && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCurrentQ(q => q - 1)}
                    style={{ padding: '16px 32px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#5A6A7E', fontSize: 15, cursor: 'pointer' }}>
                    Back
                  </motion.button>
                )}
                {!isLastQ ? (
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: `0 8px 32px ${activeColor}40` }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => canProceed && setCurrentQ(q => q + 1)}
                    style={{ padding: '16px 48px', borderRadius: 100, border: 'none', background: canProceed ? activeColor : 'rgba(255,255,255,0.05)', color: canProceed ? '#080C12' : '#3A4A5E', fontSize: 15, fontWeight: 700, cursor: canProceed ? 'pointer' : 'not-allowed', transition: 'all 0.4s' }}>
                    Continue →
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: `0 8px 32px ${activeColor}40` }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={!canProceed || submitting}
                    style={{ padding: '16px 48px', borderRadius: 100, border: 'none', background: canProceed ? activeColor : 'rgba(255,255,255,0.05)', color: canProceed ? '#080C12' : '#3A4A5E', fontSize: 15, fontWeight: 700, cursor: canProceed ? 'pointer' : 'not-allowed', transition: 'all 0.4s' }}>
                    {submitting ? 'Saving...' : 'Finish Check-in ✓'}
                  </motion.button>
                )}
              </div>

              {submitError && (
                <div style={{ marginTop: 20, padding: '12px', borderRadius: 12, background: 'rgba(224,92,92,0.1)', color: '#E05C5C', fontSize: 14 }}>
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