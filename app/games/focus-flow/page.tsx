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

type GamePhase = 'idle' | 'memorize' | 'recall' | 'result'

interface FallingObject {
  id: number
  x: number
  y: number
  color: string
  speed: number
  size: number
}

const COLORS = [
  { color: '#4FC3A1', label: 'green' },
  { color: '#E05C5C', label: 'red' },
  { color: '#5B9CF6', label: 'blue' },
  { color: '#E8A04A', label: 'yellow' },
  { color: '#A78BFA', label: 'purple' },
]

const GAME_DURATION = 60
let oid = 0

export default function FocusFlow() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [targetColor, setTargetColor] = useState(COLORS[0])
  const [objects, setObjects] = useState<FallingObject[]>([])
  const [score, setScore] = useState(0)
  const [caught, setCaught] = useState(0)
  const [wrongClicks, setWrongClicks] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [flashMsg, setFlashMsg] = useState('')
  const [showFlash, setShowFlash] = useState(false)

  const gameAreaRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number | undefined>(undefined)
  const lastSpawnRef = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const phaseRef = useRef(phase)
  const targetRef = useRef(targetColor)
  phaseRef.current = phase
  targetRef.current = targetColor

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/onboarding'); return }
      setUser(firebaseUser)
      setUserName(firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student')
      try {
        const res = await fetch(`/api/user?firebaseUid=${firebaseUser.uid}`)
        const ud = await res.json(); if (!ud.error) setUserData(ud)
      } catch (e) { console.error(e) }
    })
    return () => unsub()
  }, [])

  // Submit score on gameover
  useEffect(() => {
    if (phase !== 'gameover' || !user || score === 0) return
    submitGameScore({ userId: user.uid, userName, gameId: 'focus-flow', gameName: 'Focus Flow', score, metadata: { caught, wrongClicks, maxCombo } })
  }, [phase])

  const flash = (msg: string) => {
    setFlashMsg(msg); setShowFlash(true)
    setTimeout(() => setShowFlash(false), 700)
  }

  const startGame = () => {
    const tc = COLORS[Math.floor(Math.random() * COLORS.length)]
    setTargetColor(tc); targetRef.current = tc
    setObjects([]); setScore(0); setCaught(0); setWrongClicks(0)
    setCombo(0); setMaxCombo(0); setTimeLeft(GAME_DURATION)
    setPhase('playing'); phaseRef.current = 'playing'
    lastSpawnRef.current = 0
  }

  useEffect(() => {
    if (phase !== 'playing') return

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current!); setPhase('gameover'); return 0 }
        return t - 1
      })
    }, 1000)

    let last = performance.now()
    const loop = (now: number) => {
      if (phaseRef.current !== 'playing') return
      const dt = now - last; last = now
      if (now - lastSpawnRef.current > 1100) {
        lastSpawnRef.current = now
        const col = COLORS[Math.floor(Math.random() * COLORS.length)]
        const w = gameAreaRef.current?.offsetWidth || 600
        const sz = Math.random() * 18 + 38
        setObjects(prev => [...prev, { id: oid++, x: Math.random() * (w - sz), y: -sz, color: col.color, speed: Math.random() * 2 + 2, size: sz }])
      }
      setObjects(prev => {
        const h = gameAreaRef.current?.offsetHeight || 500
        return prev.map(o => ({ ...o, y: o.y + o.speed * (dt / 16) })).filter(o => o.y < h + 60)
      })
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)

    return () => { clearInterval(timerRef.current!); if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [phase])

  const handleClick = (e: React.MouseEvent, obj: FallingObject) => {
    e.stopPropagation()
    if (phaseRef.current !== 'playing') return
    setObjects(prev => prev.filter(o => o.id !== obj.id))
    if (obj.color === targetRef.current.color) {
      setCombo(c => { const nc = c + 1; setMaxCombo(m => Math.max(m, nc)); return nc })
      setScore(s => s + (combo >= 3 ? 20 : combo >= 2 ? 15 : 10))
      setCaught(c => c + 1)
      if (combo >= 2) flash(`🔥 ${combo + 1}x Combo!`)
    } else {
      setCombo(0); setScore(s => Math.max(0, s - 5)); setWrongClicks(w => w + 1)
      flash('✗ Wrong color!')
    }
  }

  const timerPct = (timeLeft / GAME_DURATION) * 100
  const timerColor = timeLeft > 15 ? '#4FC3A1' : timeLeft > 7 ? '#E8A04A' : '#E05C5C'
  const accuracy = (caught + wrongClicks) > 0 ? Math.round((caught / (caught + wrongClicks)) * 100) : 100

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      <div style={{ position: 'fixed', top: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,195,161,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <Sidebar userName={userName} userData={userData} />
      {isMobile && <BottomNav userName={userName} />}

      <main style={{ flex: 1, marginLeft: isMobile ? 0 : '220px', padding: isMobile ? '20px 16px' : '40px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, paddingBottom: isMobile ? 80 : 0 }}>
        <div style={{ width: '100%', maxWidth: 680, marginBottom: 24 }}>
          <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
            onClick={() => { if (animRef.current) cancelAnimationFrame(animRef.current); if (timerRef.current) clearInterval(timerRef.current); router.push('/games') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5A6E', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to Games
          </motion.button>
        </div>

        <div style={{ width: '100%', maxWidth: 680 }}>
          <div style={{ marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>🎯</div>
            <h1 style={{ fontSize: 30, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 6 }}>Focus Flow</h1>
            <p style={{ fontSize: 13, color: '#4A5A6E' }}>Click only the target color — ignore everything else</p>
          </div>

          {phase === 'idle' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ padding: '28px', borderRadius: 16, marginBottom: 24, textAlign: 'center', background: 'rgba(79,195,161,0.06)', border: '1px solid rgba(79,195,161,0.15)' }}>
                <p style={{ fontSize: 14, color: '#5A6A7E', lineHeight: 1.7 }}>
                  Colored circles fall from above. A <strong style={{ color: '#E8EEF5' }}>target color</strong> is assigned — click only those!
                  Wrong clicks cost <strong style={{ color: '#E05C5C' }}>−5 pts</strong>. Build combos for bonus points. You have <strong style={{ color: '#E8EEF5' }}>60 seconds</strong>.
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
                  style={{ padding: '16px 48px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)', color: '#080C12', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(79,195,161,0.35)' }}>
                  Start Game
                </motion.button>
              </div>
              <InlineLeaderboard gameId="focus-flow" color="#4FC3A1" />
            </motion.div>
          )}

          {phase === 'playing' && (
            <>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12, alignItems: 'center' }}>
                <div style={{ padding: '10px 16px', borderRadius: 12, flexShrink: 0, background: `${targetColor.color}18`, border: `1px solid ${targetColor.color}40`, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: targetColor.color, boxShadow: `0 0 10px ${targetColor.color}` }} />
                  <div>
                    <p style={{ fontSize: 9, color: '#3A4A5E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Catch</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: targetColor.color }}>THIS COLOR</p>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#3A4A5E' }}>Time left</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: timerColor }}>{timeLeft}s</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${timerPct}%`, background: timerColor }} transition={{ duration: 0.5 }} style={{ height: '100%', borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#4FC3A1', lineHeight: 1 }}>{score}</p>
                  <p style={{ fontSize: 9, color: '#3A4A5E', textTransform: 'uppercase' }}>Score</p>
                </div>
              </div>

              {combo >= 2 && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ marginBottom: 10, textAlign: 'center', fontSize: 12, color: '#E8A04A', fontWeight: 700 }}>
                  🔥 {combo}x Combo! {combo >= 3 ? '+20 per catch' : '+15 per catch'}
                </motion.div>
              )}

              <div ref={gameAreaRef} style={{ position: 'relative', height: 420, borderRadius: 20, overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <AnimatePresence>
                  {showFlash && (
                    <motion.div key={flashMsg} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                      style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)', fontSize: 20, fontWeight: 800, zIndex: 10, color: flashMsg.includes('✗') ? '#E05C5C' : '#E8A04A', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                      {flashMsg}
                    </motion.div>
                  )}
                </AnimatePresence>
                {objects.map(obj => (
                  <motion.div key={obj.id} whileTap={{ scale: 0.8 }}
                    style={{ position: 'absolute', left: obj.x, top: obj.y, width: obj.size, height: obj.size, borderRadius: '50%', background: obj.color, boxShadow: `0 0 ${obj.size * 0.4}px ${obj.color}80`, cursor: 'pointer', border: `2px solid ${obj.color}CC`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: obj.size * 0.4, color: 'rgba(255,255,255,0.9)', fontWeight: 900, userSelect: 'none' }}
                    onClick={(e) => handleClick(e, obj)}>
                    {obj.color === targetColor.color ? '★' : ''}
                  </motion.div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                <p style={{ fontSize: 11, color: '#3A4A5E' }}>✅ Caught: <strong style={{ color: '#4FC3A1' }}>{caught}</strong></p>
                <p style={{ fontSize: 11, color: '#3A4A5E' }}>❌ Wrong: <strong style={{ color: '#E05C5C' }}>{wrongClicks}</strong></p>
                <p style={{ fontSize: 11, color: '#3A4A5E' }}>⚡ Best Combo: <strong style={{ color: '#E8A04A' }}>{maxCombo}x</strong></p>
              </div>
            </>
          )}

          {phase === 'gameover' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              <div style={{ padding: '40px 32px', borderRadius: 20, marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 44, marginBottom: 8 }}>🎯</p>
                <p style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 4 }}>Time's Up!</p>
                <p style={{ fontSize: 40, fontWeight: 800, color: '#4FC3A1', marginBottom: 24 }}>{score} pts</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, padding: '20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
                  {[{ value: caught, label: 'Caught', color: '#4FC3A1' }, { value: `${accuracy}%`, label: 'Accuracy', color: '#5B9CF6' }, { value: wrongClicks, label: 'Misclicks', color: '#E05C5C' }, { value: `${maxCombo}x`, label: 'Best Combo', color: '#E8A04A' }].map(s => (
                    <div key={s.label}><p style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</p><p style={{ fontSize: 10, color: '#3A4A5E', textTransform: 'uppercase' }}>{s.label}</p></div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
                  style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #4FC3A1, #3DA88B)', color: '#080C12', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,195,161,0.3)' }}>
                  Play Again
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/games')}
                  style={{ padding: '14px 36px', borderRadius: 12, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#5A6A7E', fontSize: 14, fontWeight: 600 }}>
                  Exit
                </motion.button>
              </div>
              <InlineLeaderboard gameId="focus-flow" color="#4FC3A1" />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
