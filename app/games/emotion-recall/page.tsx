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

type GamePhase = 'idle' | 'show' | 'question' | 'result' | 'gameover'


const EMOTIONS = [
  { label: 'Happy', emoji: '😊', color: '#4FC3A1' },
  { label: 'Sad', emoji: '😢', color: '#5B9CF6' },
  { label: 'Angry', emoji: '😠', color: '#E05C5C' },
  { label: 'Anxious', emoji: '😰', color: '#E8A04A' },
  { label: 'Surprised', emoji: '😲', color: '#A78BFA' },
  { label: 'Disgusted', emoji: '🤢', color: '#4FC3A1' },
  { label: 'Scared', emoji: '😱', color: '#E05C5C' },
  { label: 'Calm', emoji: '😌', color: '#5B9CF6' },
  { label: 'Excited', emoji: '🤩', color: '#E8A04A' },
  { label: 'Tired', emoji: '😴', color: '#8B9BB0' },
  { label: 'Proud', emoji: '😤', color: '#A78BFA' },
  { label: 'Confused', emoji: '🤔', color: '#E8A04A' },
]

const ROUNDS = 8
const SHOW_MS = 600  // Each emoji shown for 600ms

type Question =
  | { type: 'first'; answer: string; choices: string[] }
  | { type: 'last'; answer: string; choices: string[] }
  | { type: 'count'; answer: number; choices: number[] }
  | { type: 'position'; answer: string; choices: string[]; position: number }
  | { type: 'wasPresent'; answer: 'Yes' | 'No'; choices: string[]; emotionLabel: string }

function generateRound(sequenceLen: number): { sequence: typeof EMOTIONS; question: Question } {
  const shuffled = [...EMOTIONS].sort(() => Math.random() - 0.5)
  const sequence = shuffled.slice(0, sequenceLen)

  // Pick question type
  const types = ['first', 'last', 'count', 'wasPresent'] as const
  const type = types[Math.floor(Math.random() * types.length)]

  const getWrongChoices = (correct: string, pool: string[], count = 2): string[] => {
    const wrongs = pool.filter(e => e !== correct).sort(() => Math.random() - 0.5).slice(0, count)
    return wrongs
  }

  if (type === 'first') {
    const answer = sequence[0].label
    const pool = EMOTIONS.map(e => e.label)
    const choices = [answer, ...getWrongChoices(answer, pool, 3)].sort(() => Math.random() - 0.5)
    return { sequence, question: { type: 'first', answer, choices } }
  }
  if (type === 'last') {
    const answer = sequence[sequence.length - 1].label
    const pool = EMOTIONS.map(e => e.label)
    const choices = [answer, ...getWrongChoices(answer, pool, 3)].sort(() => Math.random() - 0.5)
    return { sequence, question: { type: 'last', answer, choices } }
  }
  if (type === 'count') {
    const answer = sequence.length
    const choices = [answer, ...([answer - 1, answer + 1, answer - 2, answer + 2].filter(n => n > 0 && n !== answer).slice(0, 3))].sort(() => Math.random() - 0.5) as number[]
    return { sequence, question: { type: 'count', answer, choices } }
  }
  // wasPresent
  const isPresent = Math.random() > 0.5
  let targetEmotion
  if (isPresent) {
    targetEmotion = sequence[Math.floor(Math.random() * sequence.length)]
  } else {
    const absent = EMOTIONS.filter(e => !sequence.find(s => s.label === e.label))
    targetEmotion = absent[Math.floor(Math.random() * absent.length)]
  }
  const answer: 'Yes' | 'No' = isPresent ? 'Yes' : 'No'
  return { sequence, question: { type: 'wasPresent', answer, choices: ['Yes', 'No'], emotionLabel: targetEmotion.label } }
}

function getQuestionText(q: Question): string {
  if (q.type === 'first') return 'What was the FIRST emotion shown?'
  if (q.type === 'last') return 'What was the LAST emotion shown?'
  if (q.type === 'count') return 'How many emotions were in the sequence?'
  if (q.type === 'wasPresent') return `Was "${q.emotionLabel}" in the sequence?`
  return ''
}

function getAnswerString(q: Question): string {
  if (q.type === 'count') return String(q.answer)
  return String(q.answer)
}

export default function EmotionRecall() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [userData, setUserData] = useState<any>(null)

  const [phase, setPhase] = useState<GamePhase>('idle')
  const [round, setRound] = useState(0)
  const [sequence, setSequence] = useState<typeof EMOTIONS>([])
  const [showIdx, setShowIdx] = useState(-1)
  const [question, setQuestion] = useState<Question | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [resultCorrect, setResultCorrect] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

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
    submitGameScore({ userId: user.uid, userName, gameId: 'emotion-recall', gameName: 'Emotion Recall', score, metadata: { correctCount, rounds: ROUNDS } })
  }, [phase])

  const startRound = (roundNum: number) => {
    const seqLen = Math.min(3 + Math.floor(roundNum / 2), 7)
    const { sequence: seq, question: q } = generateRound(seqLen)
    setSequence(seq)
    setQuestion(q)
    setSelected(null)
    setShowIdx(0)
    setPhase('show')

    // Show each emoji one at a time
    let idx = 0
    const showNext = () => {
      idx++
      if (idx < seq.length) {
        setShowIdx(idx)
        timerRef.current = setTimeout(showNext, SHOW_MS)
      } else {
        // Brief pause then show question
        timerRef.current = setTimeout(() => {
          setShowIdx(-1)
          setPhase('question')
        }, 500)
      }
    }
    timerRef.current = setTimeout(showNext, SHOW_MS)
  }

  const startGame = () => {
    setScore(0); setCorrectCount(0); setRound(0)
    setPhase('show')
    startRound(0)
  }

  const handleAnswer = (choice: string) => {
    if (phase !== 'question' || selected) return
    setSelected(choice)
    const qAnswer = getAnswerString(question!)
    const isCorrect = choice === qAnswer
    setResultCorrect(isCorrect)
    if (isCorrect) {
      const pts = 10 + (round * 5)
      setScore(s => s + pts)
      setCorrectCount(c => c + 1)
    }
    setPhase('result')

    timerRef.current = setTimeout(() => {
      const nextRound = round + 1
      if (nextRound >= ROUNDS) {
        setPhase('gameover')
      } else {
        setRound(nextRound)
        startRound(nextRound)
      }
    }, 1800)
  }

  const accuracy = ROUNDS > 0 ? Math.round((correctCount / Math.max(round + (phase === 'gameover' ? 1 : 0), 1)) * 100) : 0
  const currentEmotion = sequence[showIdx]
  const progressPct = ((round + 1) / ROUNDS) * 100

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      <div style={{ position: 'fixed', top: '15%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <Sidebar userName={userName} userData={userData} />
      {isMobile && <BottomNav userName={userName} />}

      <main style={{ flex: 1, marginLeft: isMobile ? 0 : '220px', padding: isMobile ? '20px 16px' : '50px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, paddingBottom: isMobile ? 80 : 0 }}>
        <div style={{ width: '100%', maxWidth: 560, marginBottom: 28 }}>
          <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
            onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); router.push('/games') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5A6E', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to Games
          </motion.button>
        </div>

        <div style={{ width: '100%', maxWidth: 560 }}>
          {/* Header */}
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>💭</div>
            <h1 style={{ fontSize: 30, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 6 }}>Emotion Recall</h1>
            <p style={{ fontSize: 13, color: '#4A5A6E' }}>Watch the emotion sequence — then answer from memory</p>
          </div>

          {/* Idle */}
          {phase === 'idle' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ padding: '28px', borderRadius: 16, marginBottom: 24, textAlign: 'center', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
                <p style={{ fontSize: 14, color: '#5A6A7E', lineHeight: 1.7 }}>
                  A sequence of <strong style={{ color: '#E8EEF5' }}>emotion emojis</strong> will flash one by one. After the sequence, you'll answer a question about what you saw.
                  {' '}Complete <strong style={{ color: '#E8EEF5' }}>{ROUNDS} rounds</strong>. Sequences get longer as you progress!
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
                  style={{ padding: '16px 48px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #A78BFA, #8B6FD8)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(167,139,250,0.35)' }}>
                  Start Game
                </motion.button>
              </div>
              <InlineLeaderboard gameId="emotion-recall" color="#A78BFA" />
            </motion.div>
          )}

          {/* Progress bar (during game) */}
          {(phase === 'show' || phase === 'question' || phase === 'result') && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <p style={{ fontSize: 11, color: '#3A4A5E', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Round {round + 1} of {ROUNDS}</p>
                <p style={{ fontSize: 11, color: '#A78BFA', fontWeight: 600 }}>{score} pts</p>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <motion.div animate={{ width: `${progressPct}%` }} transition={{ duration: 0.4 }} style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #A78BFA, #8B6FD8)' }} />
              </div>
            </div>
          )}

          {/* Show phase — Display emoji */}
          {phase === 'show' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#3A4A5E', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 20 }}>Watch carefully…</p>
              <div style={{ position: 'relative', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AnimatePresence mode="wait">
                  {currentEmotion && (
                    <motion.div key={showIdx} initial={{ opacity: 0, scale: 0.6, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.6, y: -20 }} transition={{ duration: 0.2 }}
                      style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 90, marginBottom: 16, filter: 'drop-shadow(0 0 20px rgba(167,139,250,0.4))' }}>{currentEmotion.emoji}</div>
                      <div style={{ padding: '6px 20px', borderRadius: 20, display: 'inline-block', background: `${currentEmotion.color}18`, border: `1px solid ${currentEmotion.color}40` }}>
                        <p style={{ fontSize: 14, color: currentEmotion.color, fontWeight: 600 }}>{currentEmotion.label}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Mini sequence dots */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                {sequence.map((_, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', transition: 'all 0.3s', background: i <= showIdx ? '#A78BFA' : 'rgba(255,255,255,0.08)', boxShadow: i === showIdx ? '0 0 8px #A78BFA' : 'none' }} />
                ))}
              </div>
            </motion.div>
          )}

          {/* Question phase */}
          {(phase === 'question' || phase === 'result') && question && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ padding: '24px', borderRadius: 16, marginBottom: 20, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.18)', textAlign: 'center' }}>
                <p style={{ fontSize: 11, color: '#3A4A5E', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>Question</p>
                <p style={{ fontSize: 20, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', lineHeight: 1.4 }}>{getQuestionText(question)}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {(question.type === 'count'
                  ? (question.choices as number[]).map(String)
                  : question.choices as string[]
                ).map(choice => {
                  const isSelected = selected === choice
                  const isCorrect = choice === getAnswerString(question)
                  let bg = 'rgba(255,255,255,0.03)'
                  let border = 'rgba(255,255,255,0.08)'
                  let color = '#C8D4E0'
                  if (phase === 'result') {
                    if (isCorrect) { bg = 'rgba(79,195,161,0.12)'; border = 'rgba(79,195,161,0.4)'; color = '#4FC3A1' }
                    else if (isSelected && !isCorrect) { bg = 'rgba(224,92,92,0.1)'; border = 'rgba(224,92,92,0.3)'; color = '#E05C5C' }
                  } else if (isSelected) {
                    bg = 'rgba(167,139,250,0.12)'; border = 'rgba(167,139,250,0.4)'; color = '#A78BFA'
                  }
                  return (
                    <motion.button key={choice} whileHover={phase === 'question' ? { scale: 1.03 } : {}} whileTap={phase === 'question' ? { scale: 0.97 } : {}}
                      onClick={() => handleAnswer(choice)}
                      disabled={phase === 'result'}
                      style={{ padding: '18px', borderRadius: 12, background: bg, border: `1px solid ${border}`, color, fontSize: 14, fontWeight: 600, cursor: phase === 'question' ? 'pointer' : 'default', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      {phase === 'result' && isCorrect && <span>✓</span>}
                      {phase === 'result' && isSelected && !isCorrect && <span>✗</span>}
                      {(() => {
                        const em = EMOTIONS.find(e => e.label === choice)
                        return em ? `${em.emoji} ${choice}` : choice
                      })()}
                    </motion.button>
                  )
                })}
              </div>

              {phase === 'result' && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', marginTop: 16, fontSize: 14, fontWeight: 600, color: resultCorrect ? '#4FC3A1' : '#E05C5C' }}>
                  {resultCorrect ? `✓ Correct! +${10 + round * 5} pts` : '✗ Not quite — moving on…'}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Game Over */}
          {phase === 'gameover' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              <div style={{ padding: '40px 32px', borderRadius: 20, marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 44, marginBottom: 8 }}>💭</p>
                <p style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 4 }}>Game Complete!</p>
                <p style={{ fontSize: 40, fontWeight: 800, color: '#A78BFA', marginBottom: 24 }}>{score} pts</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, padding: '20px', borderRadius: 12, background: 'rgba(255,255,255,0.02)' }}>
                  {[{ value: `${correctCount}/${ROUNDS}`, label: 'Correct', color: '#4FC3A1' }, { value: `${accuracy}%`, label: 'Accuracy', color: '#5B9CF6' }, { value: score > 500 ? '🧠 Sharp' : score > 300 ? '💪 Good' : '📈 Keep Going', label: 'Rating', color: '#A78BFA' }].map(s => (
                    <div key={s.label}><p style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</p><p style={{ fontSize: 10, color: '#3A4A5E', textTransform: 'uppercase' }}>{s.label}</p></div>
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
              <InlineLeaderboard gameId="emotion-recall" color="#A78BFA" />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
