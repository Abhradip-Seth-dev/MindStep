'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Sidebar from '@/components/Sidebar'
import { submitGameScore } from '@/lib/submitScore'
import InlineLeaderboard from '@/components/InlineLeaderboard'

type GamePhase = 'idle' | 'memorize' | 'recall' | 'result'

const GRID_SIZE = 4
const TOTAL_CELLS = GRID_SIZE * GRID_SIZE

function generatePattern(count: number): number[] {
  const cells = Array.from({ length: TOTAL_CELLS }, (_, i) => i)
  const shuffled = cells.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

const LEVELS = [
  { level: 1, count: 3, showMs: 1800, label: 'Warm Up' },
  { level: 2, count: 4, showMs: 1600, label: 'Easy' },
  { level: 3, count: 5, showMs: 1400, label: 'Medium' },
  { level: 4, count: 6, showMs: 1200, label: 'Hard' },
  { level: 5, count: 7, showMs: 1000, label: 'Expert' },
  { level: 6, count: 8, showMs: 900, label: 'Master' },
]

export default function MemoryMatrix() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [userData, setUserData] = useState<any>(null)

  const [phase, setPhase] = useState<GamePhase>('idle')
  const [levelIdx, setLevelIdx] = useState(0)
  const [pattern, setPattern] = useState<number[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [showPattern, setShowPattern] = useState(false)
  const [resultMsg, setResultMsg] = useState('')
  const [totalRounds, setTotalRounds] = useState(0)
  const [correctRounds, setCorrectRounds] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/onboarding'); return }
      setUser(firebaseUser)
      setUserName(firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student')
      try {
        const res = await fetch(`/api/user?firebaseUid=${firebaseUser.uid}`)
        const ud = await res.json()
        if (!ud.error) setUserData(ud)
      } catch (e) { console.error(e) }
    })
    return () => unsub()
  }, [])


  const startRound = useCallback((lvlIdx: number) => {
    const cfg = LEVELS[lvlIdx]
    const p = generatePattern(cfg.count)
    setPattern(p)
    setSelected([])
    setShowPattern(true)
    setPhase('memorize')
    setCountdown(Math.ceil(cfg.showMs / 1000))

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setShowPattern(false)
      setPhase('recall')
      setCountdown(0)
    }, cfg.showMs)
  }, [])

  const startGame = () => {
    setScore(0)
    setLives(3)
    setLevelIdx(0)
    setTotalRounds(0)
    setCorrectRounds(0)
    startRound(0)
  }

  const handleCellClick = (idx: number) => {
    if (phase !== 'recall') return
    if (selected.includes(idx)) return

    const newSelected = [...selected, idx]
    setSelected(newSelected)
    const cfg = LEVELS[levelIdx]

    if (newSelected.length === cfg.count) {
      // Check answer
      const correct = pattern.every(p => newSelected.includes(p))
      setTotalRounds(t => t + 1)

      if (correct) {
        setCorrectRounds(c => c + 1)
        const pts = (levelIdx + 1) * 10
        setScore(s => s + pts)
        setResultMsg(`+${pts} pts — Perfect!`)
        setPhase('result')

        setTimeout(() => {
          const nextLvl = Math.min(levelIdx + 1, LEVELS.length - 1)
          setLevelIdx(nextLvl)
          startRound(nextLvl)
        }, 1200)
      } else {
        const newLives = lives - 1
        setLives(newLives)
        setResultMsg(newLives > 0 ? `Wrong! ${newLives} ${newLives === 1 ? 'life' : 'lives'} left` : 'Game Over!')
        setPhase('result')

        if (newLives <= 0) {
          // Game over — stay on result screen
        } else {
          setTimeout(() => {
            const prevLvl = Math.max(levelIdx - 1, 0)
            setLevelIdx(prevLvl)
            startRound(prevLvl)
          }, 1400)
        }
      }
    }
  }

  const accuracy = totalRounds > 0 ? Math.round((correctRounds / totalRounds) * 100) : 0
  const isGameOver = phase === 'result' && lives <= 0
  const cfg = LEVELS[levelIdx]

  // Submit score when game ends
  useEffect(() => {
    if (!isGameOver || !user || score === 0) return
    submitGameScore({ userId: user.uid, userName, gameId: 'memory-matrix', gameName: 'Memory Matrix', score, metadata: { accuracy, correctRounds, totalRounds, maxLevel: cfg.label } })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameOver])

  const getCellState = (idx: number) => {
    if (phase === 'memorize' && showPattern && pattern.includes(idx)) return 'lit'
    if (phase === 'recall' && selected.includes(idx)) {
      if (phase === 'recall') return 'selected'
    }
    if (phase === 'result') {
      if (pattern.includes(idx) && selected.includes(idx)) return 'correct'
      if (pattern.includes(idx) && !selected.includes(idx)) return 'missed'
      if (!pattern.includes(idx) && selected.includes(idx)) return 'wrong'
    }
    return 'idle'
  }

  const cellColors: Record<string, string> = {
    idle: 'rgba(255,255,255,0.04)',
    lit: 'rgba(91,156,246,0.7)',
    selected: 'rgba(91,156,246,0.35)',
    correct: 'rgba(79,195,161,0.6)',
    missed: 'rgba(232,160,74,0.5)',
    wrong: 'rgba(224,92,92,0.5)',
  }
  const cellBorders: Record<string, string> = {
    idle: 'rgba(255,255,255,0.07)',
    lit: 'rgba(91,156,246,0.9)',
    selected: 'rgba(91,156,246,0.6)',
    correct: 'rgba(79,195,161,0.8)',
    missed: 'rgba(232,160,74,0.8)',
    wrong: 'rgba(224,92,92,0.8)',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      <div style={{
        position: 'fixed', top: '15%', right: '10%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(91,156,246,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <Sidebar userName={userName} userData={userData} />

      <main style={{
        flex: 1, marginLeft: '220px', padding: '60px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', zIndex: 1,
      }}>
        {/* Back */}
        <div style={{ width: '100%', maxWidth: 640, marginBottom: 32 }}>
          <motion.button
            whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/games')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#4A5A6E', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            ← Back to Games
          </motion.button>
        </div>

        <div style={{ width: '100%', maxWidth: 640 }}>
          {/* Header */}
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🧩</div>
            <h1 style={{
              fontSize: 32, fontFamily: 'Playfair Display, serif',
              color: '#E8EEF5', marginBottom: 8,
            }}>
              Memory Matrix
            </h1>
            <p style={{ fontSize: 14, color: '#4A5A6E' }}>
              Memorize the highlighted tiles, then tap them from memory
            </p>
          </div>

          {/* Stats bar */}
          {phase !== 'idle' && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                display: 'flex', justifyContent: 'space-between',
                marginBottom: 28, padding: '16px 24px', borderRadius: 14,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#5B9CF6' }}>{score}</p>
                <p style={{ fontSize: 10, color: '#3A4A5E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Score</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#E8EEF5' }}>{cfg.label}</p>
                <p style={{ fontSize: 10, color: '#3A4A5E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Level</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22 }}>{'❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, 3 - lives))}</p>
                <p style={{ fontSize: 10, color: '#3A4A5E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Lives</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#4FC3A1' }}>{accuracy}%</p>
                <p style={{ fontSize: 10, color: '#3A4A5E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Accuracy</p>
              </div>
            </motion.div>
          )}

          {/* Phase indicator */}
          {phase !== 'idle' && !isGameOver && (
            <motion.p
              key={phase + resultMsg}
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: 'center', marginBottom: 20, fontSize: 14, fontWeight: 500,
                color: phase === 'memorize' ? '#5B9CF6'
                  : phase === 'recall' ? '#4FC3A1'
                  : resultMsg.includes('Perfect') ? '#4FC3A1'
                  : '#E8A04A',
              }}
            >
              {phase === 'memorize' && `👁 Memorize the pattern...`}
              {phase === 'recall' && `🎯 Tap the ${cfg.count} tiles you saw`}
              {phase === 'result' && resultMsg}
            </motion.p>
          )}

          {/* Idle screen */}
          {phase === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', marginBottom: 32 }}
            >
              <div style={{
                padding: '28px', borderRadius: 16, marginBottom: 24,
                background: 'rgba(91,156,246,0.06)',
                border: '1px solid rgba(91,156,246,0.15)',
              }}>
                <p style={{ fontSize: 14, color: '#5A6A7E', lineHeight: 1.7 }}>
                  A pattern of tiles will flash on the grid. Study them, then tap all the tiles from memory.
                  You have <strong style={{ color: '#E8EEF5' }}>3 lives</strong>. Advance through 6 levels as the challenge grows!
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={startGame}
                style={{
                  padding: '16px 48px', borderRadius: 14, border: 'none',
                  background: 'linear-gradient(135deg, #5B9CF6, #4A84E0)',
                  color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 24px rgba(91,156,246,0.35)',
                }}
              >
                Start Game
              </motion.button>
              <InlineLeaderboard gameId="memory-matrix" color="#5B9CF6" />
            </motion.div>
          )}

          {/* Game Over */}
          {isGameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', marginBottom: 32 }}
            >
              <div style={{
                padding: '32px', borderRadius: 20, marginBottom: 24,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🏁</p>
                <p style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 8 }}>
                  Game Over
                </p>
                <p style={{ fontSize: 15, color: '#4A5A6E', marginBottom: 20 }}>
                  Final Score: <strong style={{ color: '#5B9CF6', fontSize: 20 }}>{score}</strong>
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
                  <div>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#4FC3A1' }}>{accuracy}%</p>
                    <p style={{ fontSize: 11, color: '#3A4A5E' }}>Accuracy</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#E8EEF5' }}>{correctRounds}/{totalRounds}</p>
                    <p style={{ fontSize: 11, color: '#3A4A5E' }}>Rounds Won</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#A78BFA' }}>{cfg.label}</p>
                    <p style={{ fontSize: 11, color: '#3A4A5E' }}>Max Level</p>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={startGame}
                  style={{
                    padding: '14px 36px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #5B9CF6, #4A84E0)',
                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(91,156,246,0.3)',
                  }}
                >
                  Play Again
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/games')}
                  style={{
                    padding: '14px 36px', borderRadius: 12, cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    color: '#5A6A7E', fontSize: 14, fontWeight: 600,
                  }}
                >
                  Exit
                </motion.button>
              </div>
              <InlineLeaderboard gameId="memory-matrix" color="#5B9CF6" />
            </motion.div>
          )}

          {/* Grid */}
          {(phase !== 'idle') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gap: 10, maxWidth: 480, margin: '0 auto',
              }}
            >
              {Array.from({ length: TOTAL_CELLS }, (_, idx) => {
                const state = getCellState(idx)
                return (
                  <motion.div
                    key={idx}
                    whileHover={phase === 'recall' ? { scale: 1.05 } : {}}
                    whileTap={phase === 'recall' ? { scale: 0.93 } : {}}
                    animate={{
                      background: cellColors[state],
                      borderColor: cellBorders[state],
                      boxShadow: state === 'lit'
                        ? '0 0 20px rgba(91,156,246,0.5)'
                        : state === 'correct'
                        ? '0 0 16px rgba(79,195,161,0.4)'
                        : 'none',
                    }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleCellClick(idx)}
                    style={{
                      aspectRatio: '1', borderRadius: 10,
                      border: `1px solid ${cellBorders[state]}`,
                      cursor: phase === 'recall' ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {state === 'lit' && (
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity }}
                        style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', opacity: 0.8 }}
                      />
                    )}
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
