'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import { useIsMobile } from '@/lib/hooks'
import { submitGameScore } from '@/lib/submitScore'
import InlineLeaderboard from '@/components/InlineLeaderboard'

const PADS = [
  { id: 0, color: '#E05C5C', label: 'Top Left',    pos: { top: '8%',  left: '8%',  right: '52%', bottom: '52%' } },
  { id: 1, color: '#5B9CF6', label: 'Top Right',   pos: { top: '8%',  left: '52%', right: '8%',  bottom: '52%' } },
  { id: 2, color: '#4FC3A1', label: 'Bot Left',    pos: { top: '52%', left: '8%',  right: '52%', bottom: '8%'  } },
  { id: 3, color: '#E8A04A', label: 'Bot Right',   pos: { top: '52%', left: '52%', right: '8%',  bottom: '8%'  } },
]

const FLASH_MS = 500
const GAP_MS   = 200

type Phase = 'idle' | 'watching' | 'repeating' | 'correct' | 'wrong' | 'gameover'

export default function PatternPulse() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [userData, setUserData] = useState<any>(null)

  const [phase, setPhase] = useState<Phase>('idle')
  const [sequence, setSequence] = useState<number[]>([])
  const [playerIdx, setPlayerIdx] = useState(0)
  const [lit, setLit] = useState<number | null>(null)
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [bestRound, setBestRound] = useState(0)
  const [lives, setLives] = useState(3)
  const [speed, setSpeed] = useState(1)   // multiplier
  const phaseRef = useRef<Phase>('idle')
  phaseRef.current = phase

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push('/onboarding'); return }
      setUser(u)
      setUserName(u.displayName || u.email?.split('@')[0] || 'Student')
      try { const r = await fetch(`/api/user?firebaseUid=${u.uid}`); const d = await r.json(); if (!d.error) setUserData(d) } catch {}
    })
    return () => unsub()
  }, [])

  // Submit score on gameover
  useEffect(() => {
    if (phase !== 'gameover' || !user || score === 0) return
    submitGameScore({ userId: user.uid, userName, gameId: 'pattern-pulse', gameName: 'Pattern Pulse', score, metadata: { bestRound } })
  }, [phase])

  const playSequence = (seq: number[], spd: number) => {
    setPhase('watching')
    phaseRef.current = 'watching'
    let i = 0
    const flashMs = Math.max(180, Math.floor(FLASH_MS / spd))
    const gapMs   = Math.max(80,  Math.floor(GAP_MS   / spd))

    const step = () => {
      if (i >= seq.length) {
        setTimeout(() => {
          if (phaseRef.current === 'watching') {
            setLit(null)
            setPhase('repeating')
            phaseRef.current = 'repeating'
            setPlayerIdx(0)
          }
        }, gapMs)
        return
      }
      setLit(null)
      setTimeout(() => {
        setLit(seq[i])
        setTimeout(() => {
          setLit(null)
          i++
          setTimeout(step, gapMs)
        }, flashMs)
      }, gapMs)
    }
    step()
  }

  const startGame = () => {
    const first = Math.floor(Math.random() * 4)
    const seq = [first]
    setSequence(seq); setRound(1); setScore(0); setLives(3); setSpeed(1); setPlayerIdx(0)
    setTimeout(() => playSequence(seq, 1), 600)
  }

  const handlePadClick = (padId: number) => {
    if (phase !== 'repeating') return
    const expected = sequence[playerIdx]

    if (padId === expected) {
      // Correct tap
      const nextIdx = playerIdx + 1
      if (nextIdx === sequence.length) {
        // Completed the round!
        const pts = sequence.length * 10
        setScore(s => s + pts)
        setBestRound(b => Math.max(b, round))
        setPhase('correct')
        phaseRef.current = 'correct'

        setTimeout(() => {
          const nextRound = round + 1
          const newSpd = nextRound >= 8 ? 1.6 : nextRound >= 5 ? 1.3 : 1
          setSpeed(newSpd)
          setRound(nextRound)
          const next = [...sequence, Math.floor(Math.random() * 4)]
          setSequence(next)
          playSequence(next, newSpd)
        }, 800)
      } else {
        setPlayerIdx(nextIdx)
      }
    } else {
      // Wrong!
      const newLives = lives - 1
      setLives(newLives)
      setLit(padId)    // flash the wrong one red briefly
      setPhase('wrong')
      phaseRef.current = 'wrong'
      setBestRound(b => Math.max(b, round - 1))

      setTimeout(() => setLit(null), 400)

      if (newLives <= 0) {
        setTimeout(() => setPhase('gameover'), 600)
      } else {
        // Replay same sequence
        setTimeout(() => {
          setPlayerIdx(0)
          playSequence(sequence, speed)
        }, 1000)
      }
    }
  }

  const speedLabel = speed >= 1.6 ? 'Expert' : speed >= 1.3 ? 'Fast' : 'Normal'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      <div style={{ position: 'fixed', top: '15%', right: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <Sidebar userName={userName} userData={userData} />
      {isMobile && <BottomNav userName={userName} />}

      <main style={{ flex: 1, marginLeft: isMobile ? 0 : '220px', padding: isMobile ? '20px 16px' : '50px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, paddingBottom: isMobile ? 80 : 0 }}>
        <div style={{ width: '100%', maxWidth: 560, marginBottom: 24 }}>
          <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/games')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5A6E', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to Games
          </motion.button>
        </div>

        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🎵</div>
            <h1 style={{ fontSize: 30, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 6 }}>Pattern Pulse</h1>
            <p style={{ fontSize: 13, color: '#4A5A6E' }}>Watch the sequence flash — then repeat it from memory</p>
          </div>

          {/* Stats bar (during game) */}
          {phase !== 'idle' && phase !== 'gameover' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, padding: '14px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#A78BFA' }}>{round}</p>
                <p style={{ fontSize: 9, color: '#3A4A5E', textTransform: 'uppercase' }}>Round</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#E8EEF5' }}>{score}</p>
                <p style={{ fontSize: 9, color: '#3A4A5E', textTransform: 'uppercase' }}>Score</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20 }}>{'❤️'.repeat(lives)}{'🖤'.repeat(Math.max(0, 3 - lives))}</p>
                <p style={{ fontSize: 9, color: '#3A4A5E', textTransform: 'uppercase' }}>Lives</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: speed >= 1.3 ? '#E8A04A' : '#4FC3A1' }}>{speedLabel}</p>
                <p style={{ fontSize: 9, color: '#3A4A5E', textTransform: 'uppercase' }}>Speed</p>
              </div>
            </motion.div>
          )}

          {/* Status message */}
          {(phase === 'watching' || phase === 'repeating' || phase === 'correct' || phase === 'wrong') && (
            <motion.p key={phase} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, marginBottom: 16,
                color: phase === 'correct' ? '#4FC3A1' : phase === 'wrong' ? '#E05C5C' : phase === 'repeating' ? '#A78BFA' : '#5A6A7E' }}>
              {phase === 'watching' && '👁 Watch the sequence…'}
              {phase === 'repeating' && `🎯 Your turn! (${playerIdx + 1}/${sequence.length})`}
              {phase === 'correct' && '✓ Perfect! Next round…'}
              {phase === 'wrong' && (lives > 0 ? `✗ Wrong! ${lives} ${lives === 1 ? 'life' : 'lives'} left — replaying…` : '✗ Game Over!')}
            </motion.p>
          )}

          {/* Idle screen */}
          {phase === 'idle' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
              <div style={{ padding: '24px', borderRadius: 16, marginBottom: 24, textAlign: 'center', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
                <p style={{ fontSize: 14, color: '#5A6A7E', lineHeight: 1.7 }}>
                  Colored pads light up in a sequence. <strong style={{ color: '#E8EEF5' }}>Watch carefully</strong>, then tap the pads in the same order.
                  Each round adds one more step. You have <strong style={{ color: '#E8EEF5' }}>3 lives</strong>. Speed increases after round 5!
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
                  style={{ padding: '16px 48px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #A78BFA, #8B6FD8)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(167,139,250,0.35)' }}>
                  Start Game
                </motion.button>
              </div>
              <InlineLeaderboard gameId="pattern-pulse" color="#A78BFA" />
            </motion.div>
          )}

          {/* Game board */}
          {phase !== 'idle' && phase !== 'gameover' && (
            <div style={{ position: 'relative', width: '100%', paddingBottom: '80%', borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              {PADS.map(pad => {
                const isLit = lit === pad.id
                return (
                  <motion.button
                    key={pad.id}
                    onClick={() => handlePadClick(pad.id)}
                    animate={{
                      background: isLit ? pad.color : `${pad.color}18`,
                      boxShadow: isLit ? `inset 0 0 0 3px ${pad.color}, 0 0 40px ${pad.color}80` : `inset 0 0 0 1px ${pad.color}30`,
                    }}
                    transition={{ duration: 0.08 }}
                    whileHover={phase === 'repeating' ? { filter: 'brightness(1.2)' } : {}}
                    whileTap={phase === 'repeating' ? { scale: 0.96 } : {}}
                    style={{
                      position: 'absolute', ...pad.pos,
                      border: 'none', borderRadius: 14,
                      cursor: phase === 'repeating' ? 'pointer' : 'default',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {isLit && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0.8 }}
                        animate={{ scale: 1.3, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ width: 50, height: 50, borderRadius: '50%', background: '#fff' }}
                      />
                    )}
                  </motion.button>
                )
              })}

              {/* Centre dividers */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 12, background: '#080C12', transform: 'translateX(-50%)', zIndex: 2 }} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 12, background: '#080C12', transform: 'translateY(-50%)', zIndex: 2 }} />
              <div style={{ position: 'absolute', top: '50%', left: '50%', width: 24, height: 24, borderRadius: '50%', background: '#080C12', transform: 'translate(-50%,-50%)', zIndex: 3 }} />
            </div>
          )}

          {/* Sequence dots */}
          {(phase === 'watching' || phase === 'repeating') && sequence.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
              {sequence.map((_, i) => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%', transition: 'all 0.2s',
                  background: i < playerIdx ? '#4FC3A1' : i === playerIdx && phase === 'repeating' ? '#A78BFA' : 'rgba(255,255,255,0.08)',
                  boxShadow: i === playerIdx && phase === 'repeating' ? '0 0 8px #A78BFA' : 'none',
                }} />
              ))}
            </div>
          )}

          {/* Game over */}
          {phase === 'gameover' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              <div style={{ padding: '40px 32px', borderRadius: 20, marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 44, marginBottom: 8 }}>🎵</p>
                <p style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 4 }}>Game Over!</p>
                <p style={{ fontSize: 42, fontWeight: 800, color: '#A78BFA', marginBottom: 24 }}>{score} pts</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, padding: '20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
                  {[
                    { value: bestRound, label: 'Best Round', color: '#A78BFA' },
                    { value: score, label: 'Total Score', color: '#5B9CF6' },
                    { value: bestRound >= 10 ? '🧠 Sharp' : bestRound >= 6 ? '💪 Good' : '📈 Keep Going', label: 'Rating', color: '#4FC3A1' },
                  ].map(s => (
                    <div key={s.label}>
                      <p style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</p>
                      <p style={{ fontSize: 10, color: '#3A4A5E', textTransform: 'uppercase' }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
                  style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #A78BFA, #8B6FD8)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(167,139,250,0.3)' }}>
                  Play Again
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/games')}
                  style={{ padding: '14px 36px', borderRadius: 12, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#5A6A7E', fontSize: 14, fontWeight: 600 }}>
                  Exit
                </motion.button>
              </div>
              <InlineLeaderboard gameId="pattern-pulse" color="#A78BFA" />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
