'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import { useIsMobile } from '@/lib/hooks'
import { submitGameScore } from '@/lib/submitScore'
import InlineLeaderboard from '@/components/InlineLeaderboard'

const GAME_DURATION = 60
type Op = '+' | '−' | '×'

function generateProblem(level: number): { a: number; b: number; op: Op; answer: number; choices: number[] } {
  const ops: Op[] = level < 3 ? ['+', '−'] : level < 5 ? ['+', '−', '×'] : ['+', '−', '×']
  const op = ops[Math.floor(Math.random() * ops.length)]

  let a: number, b: number, answer: number
  if (op === '+') {
    const max = level < 3 ? 20 : level < 5 ? 50 : 99
    a = Math.floor(Math.random() * max) + 1
    b = Math.floor(Math.random() * max) + 1
    answer = a + b
  } else if (op === '−') {
    const max = level < 3 ? 20 : level < 5 ? 50 : 99
    a = Math.floor(Math.random() * max) + 5
    b = Math.floor(Math.random() * (a - 1)) + 1
    answer = a - b
  } else {
    const maxA = level < 4 ? 9 : 12
    const maxB = level < 4 ? 9 : 12
    a = Math.floor(Math.random() * maxA) + 2
    b = Math.floor(Math.random() * maxB) + 2
    answer = a * b
  }

  // Generate 3 wrong choices near the correct answer
  const wrongs = new Set<number>()
  while (wrongs.size < 3) {
    const offset = Math.floor(Math.random() * 10) + 1
    const w = Math.random() > 0.5 ? answer + offset : answer - offset
    if (w !== answer && w > 0) wrongs.add(w)
  }
  const choices = [answer, ...Array.from(wrongs)].sort(() => Math.random() - 0.5)
  return { a, b, op, answer, choices }
}

export default function SpeedMath() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [userData, setUserData] = useState<any>(null)

  const [phase, setPhase] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [problem, setProblem] = useState(() => generateProblem(1))
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [level, setLevel] = useState(1)
  const [feedback, setFeedback] = useState<{ msg: string; correct: boolean } | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const levelRef = useRef(1)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/onboarding'); return }
      setUser(u)
      setUserName(u.displayName || u.email?.split('@')[0] || 'Student')
      try { const r = await fetch(`/api/user?firebaseUid=${u.uid}`); const d = await r.json(); if (!d.error) setUserData(d) } catch {}
    })
    return () => unsub()
  }, [])

  // Submit score when game ends
  useEffect(() => {
    if (phase !== 'gameover' || !user || score === 0) return
    submitGameScore({ userId: user.uid, userName, gameId: 'speed-math', gameName: 'Speed Math', score, metadata: { correct, wrong, maxStreak, level } })
  }, [phase])

  const nextProblem = useCallback((lvl: number) => {
    setProblem(generateProblem(lvl))
    setSelectedChoice(null)
    setFeedback(null)
  }, [])

  const startGame = () => {
    setScore(0); setStreak(0); setMaxStreak(0)
    setCorrect(0); setWrong(0); setLevel(1); levelRef.current = 1
    setTimeLeft(GAME_DURATION); setFeedback(null); setSelectedChoice(null)
    setProblem(generateProblem(1))
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setPhase('gameover'); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [phase])

  const handleChoice = (choice: number) => {
    if (selectedChoice !== null || phase !== 'playing') return
    setSelectedChoice(choice)
    const isCorrect = choice === problem.answer

    if (isCorrect) {
      const newStreak = streak + 1
      setStreak(newStreak)
      setMaxStreak(m => Math.max(m, newStreak))
      setCorrect(c => c + 1)
      const pts = newStreak >= 5 ? 25 : newStreak >= 3 ? 20 : 15
      setScore(s => s + pts)
      // Level up every 3 correct
      const newCorrect = correct + 1
      if (newCorrect % 3 === 0) {
        const newLvl = Math.min(level + 1, 6)
        setLevel(newLvl); levelRef.current = newLvl
      }
      setFeedback({ msg: newStreak >= 3 ? `🔥 ${newStreak} Streak! +${pts}pts` : `✓ +${pts} pts`, correct: true })
    } else {
      setStreak(0); setWrong(w => w + 1)
      setScore(s => Math.max(0, s - 5))
      setFeedback({ msg: `✗ Answer was ${problem.answer}`, correct: false })
    }

    setTimeout(() => nextProblem(levelRef.current), 900)
  }

  const timerPct = (timeLeft / GAME_DURATION) * 100
  const timerColor = timeLeft > 15 ? '#5B9CF6' : timeLeft > 7 ? '#E8A04A' : '#E05C5C'
  const accuracy = (correct + wrong) > 0 ? Math.round((correct / (correct + wrong)) * 100) : 0
  const levelLabels = ['', 'Easy', 'Easy+', 'Medium', 'Medium+', 'Hard', 'Expert']

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      <div style={{ position: 'fixed', top: '15%', right: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(91,156,246,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <Sidebar userName={userName} userData={userData} />
      {isMobile && <BottomNav userName={userName} />}

      <main style={{ flex: 1, marginLeft: isMobile ? 0 : '220px', padding: isMobile ? '20px 16px' : '50px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, paddingBottom: isMobile ? 80 : 0 }}>
        <div style={{ width: '100%', maxWidth: 560, marginBottom: 28 }}>
          <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
            onClick={() => { clearInterval(timerRef.current!); router.push('/games') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5A6E', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to Games
          </motion.button>
        </div>

        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>⚡</div>
            <h1 style={{ fontSize: 30, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 6 }}>Speed Math</h1>
            <p style={{ fontSize: 13, color: '#4A5A6E' }}>Solve as many problems as you can in 60 seconds</p>
          </div>

          {phase === 'idle' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ padding: '28px', borderRadius: 16, marginBottom: 24, textAlign: 'center', background: 'rgba(91,156,246,0.06)', border: '1px solid rgba(91,156,246,0.15)' }}>
                <p style={{ fontSize: 14, color: '#5A6A7E', lineHeight: 1.7 }}>
                  Tap the correct answer to each math problem as fast as you can.
                  Build a streak for bonus points — <strong style={{ color: '#E8EEF5' }}>3 streak = +20 pts</strong>, <strong style={{ color: '#E8EEF5' }}>5 streak = +25 pts</strong>.
                  Wrong answers cost <strong style={{ color: '#E05C5C' }}>−5 pts</strong>. Difficulty increases as you go!
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
                  style={{ padding: '16px 48px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #5B9CF6, #4A84E0)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(91,156,246,0.35)' }}>
                  Start Game
                </motion.button>
              </div>
              <InlineLeaderboard gameId="speed-math" color="#5B9CF6" />
            </motion.div>
          )}

          {phase === 'playing' && (
            <>
              {/* HUD */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: '#3A4A5E' }}>Level: <strong style={{ color: '#5B9CF6' }}>{levelLabels[level]}</strong></span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: timerColor }}>{timeLeft}s</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${timerPct}%`, background: timerColor }} transition={{ duration: 0.5 }} style={{ height: '100%', borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 26, fontWeight: 700, color: '#5B9CF6', lineHeight: 1 }}>{score}</p>
                  <p style={{ fontSize: 9, color: '#3A4A5E', textTransform: 'uppercase' }}>Score</p>
                </div>
              </div>

              {/* Streak */}
              {streak >= 2 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', fontSize: 12, color: '#E8A04A', fontWeight: 700, marginBottom: 10 }}>
                  🔥 {streak} Streak!
                </motion.p>
              )}

              {/* Problem card */}
              <AnimatePresence mode="wait">
                <motion.div key={problem.a + problem.op + problem.b}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.18 }}
                  style={{ padding: '40px 32px', borderRadius: 20, marginBottom: 20, textAlign: 'center', background: 'rgba(91,156,246,0.06)', border: '1px solid rgba(91,156,246,0.18)' }}>
                  <p style={{ fontSize: 52, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', fontWeight: 600, letterSpacing: '-1px' }}>
                    {problem.a} {problem.op} {problem.b}
                  </p>
                  <p style={{ fontSize: 20, color: '#3A4A5E', marginTop: 6 }}>= ?</p>
                </motion.div>
              </AnimatePresence>

              {/* Feedback */}
              <AnimatePresence>
                {feedback && (
                  <motion.p key={feedback.msg} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: feedback.correct ? '#4FC3A1' : '#E05C5C', marginBottom: 12 }}>
                    {feedback.msg}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Choices */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {problem.choices.map((c, i) => {
                  const isSelected = selectedChoice === c
                  const isCorrect = c === problem.answer
                  let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.08)', color = '#C8D4E0'
                  if (selectedChoice !== null) {
                    if (isCorrect) { bg = 'rgba(79,195,161,0.12)'; border = 'rgba(79,195,161,0.4)'; color = '#4FC3A1' }
                    else if (isSelected) { bg = 'rgba(224,92,92,0.1)'; border = 'rgba(224,92,92,0.3)'; color = '#E05C5C' }
                  }
                  return (
                    <motion.button key={i} whileHover={selectedChoice === null ? { scale: 1.04 } : {}} whileTap={selectedChoice === null ? { scale: 0.96 } : {}}
                      onClick={() => handleChoice(c)}
                      style={{ padding: '22px', borderRadius: 14, background: bg, border: `1px solid ${border}`, color, fontSize: 26, fontWeight: 700, cursor: selectedChoice === null ? 'pointer' : 'default', transition: 'all 0.2s', fontFamily: 'Playfair Display, serif' }}>
                      {c}
                    </motion.button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                <p style={{ fontSize: 11, color: '#3A4A5E' }}>✅ Correct: <strong style={{ color: '#4FC3A1' }}>{correct}</strong></p>
                <p style={{ fontSize: 11, color: '#3A4A5E' }}>❌ Wrong: <strong style={{ color: '#E05C5C' }}>{wrong}</strong></p>
                <p style={{ fontSize: 11, color: '#3A4A5E' }}>🔥 Best: <strong style={{ color: '#E8A04A' }}>{maxStreak}x</strong></p>
              </div>
            </>
          )}

          {phase === 'gameover' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              <div style={{ padding: '40px 32px', borderRadius: 20, marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 44, marginBottom: 8 }}>⚡</p>
                <p style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 4 }}>Time's Up!</p>
                <p style={{ fontSize: 42, fontWeight: 800, color: '#5B9CF6', marginBottom: 24 }}>{score} pts</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
                  {[{ value: correct, label: 'Correct', color: '#4FC3A1' }, { value: `${accuracy}%`, label: 'Accuracy', color: '#5B9CF6' }, { value: wrong, label: 'Wrong', color: '#E05C5C' }, { value: `${maxStreak}x`, label: 'Best Streak', color: '#E8A04A' }].map(s => (
                    <div key={s.label}><p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p><p style={{ fontSize: 10, color: '#3A4A5E', textTransform: 'uppercase' }}>{s.label}</p></div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
                  style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #5B9CF6, #4A84E0)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(91,156,246,0.3)' }}>
                  Play Again
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/games')}
                  style={{ padding: '14px 36px', borderRadius: 12, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#5A6A7E', fontSize: 14, fontWeight: 600 }}>
                  Exit
                </motion.button>
              </div>
              <InlineLeaderboard gameId="speed-math" color="#5B9CF6" />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
