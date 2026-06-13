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

// A solid common-word dictionary for finding valid words
const WORD_LIST = new Set([
  'cat','bat','rat','mat','sat','hat','fat','pat','vat','tap',
  'cap','cup','cut','car','bar','tar','jar','war','far','ear',
  'eat','oat','oak','oar','aim','air','arc','arm','art','ash',
  'ask','ace','age','ago','aid','ail','ale','ant','ape','apt',
  'arc','are','ark','urn','use','nap','map','lap','gap','sap',
  'rap','trap','tray','pray','play','clay','slay','fray','gray','bray',
  'trip','trim','grip','drip','grit','spit','spit','spin','skin','skip',
  'slip','slim','slit','slid','slap','slat','slam','plan','clan','clam',
  'clap','clad','flag','flat','flap','flan','fan','fun','run','sun',
  'gun','bun','nun','pun','dun','ton','son','don','con','bon',
  'hop','top','cop','pop','mop','lop','sop','drop','prop','crop',
  'stop','shop','chop','flop','slop','plop','snap','span','scan',
  'star','scar','spar','stab','scab','crab','grab','drab','blab',
  'plan','plate','place','plane','plant','plank','plain','claim','chair','chain',
  'chart','charm','chase','cheap','cheat','chest','chief','child','china','chips',
  'chip','tip','nip','lip','hip','dip','rip','zip','whip','ship',
  'turn','burn','earn','learn','fern','tern','heron','stern','first','bird',
  'dirt','girl','swirl','twirl','birth','mirth','girth','shirt','skirt','quirk',
  'park','dark','mark','bark','hark','lark','yarn','barn','darn','harm',
  'farm','calm','palm','balm','half','calf','talk','walk','salt','malt',
  'halt','tall','ball','call','fall','hall','mall','wall','bull','full',
  'pull','dull','gull','hull','lull','mull','null','skull','spell','shelf',
  'shell','shelf','shelf','bell','cell','dell','fell','hell','jell','sell',
  'tell','well','yell','belt','felt','melt','pelt','welt','bent','cent',
  'dent','gent','kent','lent','rent','sent','tent','vent','went','best',
  'fest','jest','nest','pest','rest','test','vest','west','zest','bed',
  'red','fed','led','wed','get','let','met','net','pet','set',
  'vet','wet','yet','big','dig','fig','gig','jig','pig','rig',
  'wig','bit','fit','hit','kit','lit','pit','sit','wit','bog',
  'cog','dog','fog','hog','jog','log','tug','bug','dug','hug',
  'jug','mug','pug','rug','tug','bus','pus','gush','bush','hush',
  'lush','mush','rush','brush','crush','flush','plush','slush','trust','burst',
  'must','just','dust','gust','rust','bust','cust','lust','hunt','bunt',
  'runt','punt','dunk','funk','gunk','hunk','junk','punk','sunk','stun',
  'spun','shun','snub','stub','club','grub','snag','stag','flag','shag',
  'brag','drag','crag','slag','slab','jab','cab','dab','gab','lab',
  'nab','tab','jam','ham','ram','yam','dam','cam','clam','sham','tram',
  'gram','dram','pram','swam','cram','span','than','plan','scan','bran',
  'clan','flan','man','ban','can','fan','ran','tan','van','pan',
  'sin','tin','win','bin','din','fin','gin','kin','pin','yin',
  'inn','thin','grin','twin','chin','shin','when','then','wren','open',
  'even','oven','raven','given','risen','token','woken','spoken','broken','frozen',
  'stone','phone','drone','bone','cone','hone','lone','tone','zone','clone',
  'zone','home','dome','some','come','roam','foam','loam','poem','woke',
  'joke','poke','coke','folk','yolk','jolt','bolt','colt','molt','volt',
  'gold','bold','cold','fold','hold','mold','old','sold','told','road',
  'load','toad','mode','node','code','rode','lode','bode','ode','pole',
  'hole','role','sole','mole','vole','bowl','fowl','howl','jowl','owl',
  'growl','prowl','scowl','trowl','round','found','sound','bound','mound','pound',
  'wound','hound','loud','cloud','proud','shroud','bout','gout','lout','out',
  'pout','rout','snout','stout','trout','shout','clout','flout','spout','tout',
  'youth','south','mouth','truth','booth','tooth','both','broth','froth','sloth',
  'cloth','moth','goth','froth','growth','throw','flow','glow','slow','know',
  'show','blow','crow','grow','prow','stow','snow','tow','row','sow',
  'vow','bow','cow','how','now','wow','plow','allow','below','elbow',
  'oblong','along','belong','prong','strong','throng','wrong','song','long','gong',
])

function shuffle(arr: string[]): string[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

// Pick a starting pool of 7-8 letters that have many valid sub-words
const LETTER_POOLS = [
  'STARING', 'PAINTER', 'PLANETS', 'SPARENT', 'CLATRES', 'GRANITE',
  'ROASTED', 'CREATED', 'PLAYERS', 'MINERAL', 'COASTAL', 'LANTERS',
  'BLISTER', 'CLUSTER', 'PLASTER', 'POINTER', 'MONSTER', 'CAPTAIN',
  'HUNTING', 'TURNING', 'BURNING', 'EARNING', 'HELPING', 'MELTING',
  'RESTING', 'TESTING', 'LASTING', 'BASTING', 'CASTING', 'FASTING',
]

function getValidWords(letters: string): string[] {
  const pool = letters.toLowerCase().split('')
  const found: string[] = []
  for (const word of WORD_LIST) {
    if (word.length < 3) continue
    const needed = word.split('')
    const temp = [...pool]
    let ok = true
    for (const ch of needed) {
      const idx = temp.indexOf(ch)
      if (idx === -1) { ok = false; break }
      temp.splice(idx, 1)
    }
    if (ok) found.push(word)
  }
  return found
}

const GAME_DURATION = 90

export default function WordWeaver() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [userData, setUserData] = useState<any>(null)

  const [phase, setPhase] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [letters, setLetters] = useState<string[]>([])
  const [baseWord, setBaseWord] = useState('')
  const [validWords, setValidWords] = useState<Set<string>>(new Set())
  const [foundWords, setFoundWords] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [shake, setShake] = useState(false)
  const [lastWord, setLastWord] = useState<{ word: string; pts: number; ok: boolean } | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
    submitGameScore({ userId: user.uid, userName, gameId: 'word-weaver', gameName: 'Word Weaver', score, metadata: { wordsFound: foundWords.length } })
  }, [phase])

  const startGame = useCallback(() => {
    const pool = LETTER_POOLS[Math.floor(Math.random() * LETTER_POOLS.length)]
    const valid = getValidWords(pool)
    setBaseWord(pool)
    setLetters(shuffle(pool.split('')))
    setValidWords(new Set(valid))
    setFoundWords([])
    setInput('')
    setScore(0)
    setTimeLeft(GAME_DURATION)
    setLastWord(null)
    setPhase('playing')
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

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

  const submitWord = () => {
    const word = input.trim().toLowerCase()
    setInput('')
    if (word.length < 3) return

    if (foundWords.includes(word)) {
      setLastWord({ word, pts: 0, ok: false })
      triggerShake(); return
    }
    if (!validWords.has(word)) {
      setLastWord({ word, pts: 0, ok: false })
      triggerShake(); return
    }
    // Valid!
    const pts = word.length <= 3 ? 5 : word.length === 4 ? 10 : word.length === 5 ? 15 : word.length === 6 ? 25 : 40
    setFoundWords(f => [word, ...f])
    setScore(s => s + pts)
    setLastWord({ word, pts, ok: true })
    inputRef.current?.focus()
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 500)
  }

  const handleLetterClick = (ch: string, idx: number) => {
    if (phase !== 'playing') return
    setInput(prev => prev + ch)
    inputRef.current?.focus()
  }

  const reshuffleLetters = () => setLetters(shuffle(baseWord.split('')))

  const timerPct = (timeLeft / GAME_DURATION) * 100
  const timerColor = timeLeft > 20 ? '#4FC3A1' : timeLeft > 10 ? '#E8A04A' : '#E05C5C'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      <div style={{ position: 'fixed', top: '15%', right: '8%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,160,74,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <Sidebar userName={userName} userData={userData} />
      {isMobile && <BottomNav userName={userName} />}

      <main style={{ flex: 1, marginLeft: isMobile ? 0 : '220px', padding: isMobile ? '20px 16px' : '50px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1, paddingBottom: isMobile ? 80 : 0 }}>
        <div style={{ width: '100%', maxWidth: 620, marginBottom: 28 }}>
          <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
            onClick={() => { clearInterval(timerRef.current!); router.push('/games') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5A6E', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Back to Games
          </motion.button>
        </div>

        <div style={{ width: '100%', maxWidth: 620 }}>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 6 }}>📝</div>
            <h1 style={{ fontSize: 30, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 6 }}>Word Weaver</h1>
            <p style={{ fontSize: 13, color: '#4A5A6E' }}>Form as many words as you can from the given letters</p>
          </div>

          {phase === 'idle' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ padding: '28px', borderRadius: 16, marginBottom: 24, textAlign: 'center', background: 'rgba(232,160,74,0.06)', border: '1px solid rgba(232,160,74,0.15)' }}>
                <p style={{ fontSize: 14, color: '#5A6A7E', lineHeight: 1.7 }}>
                  You'll be given <strong style={{ color: '#E8EEF5' }}>7 letters</strong>. Type any word that can be formed using those letters.
                  Longer words = more points. <strong style={{ color: '#E8EEF5' }}>3 letters = 5 pts</strong>, <strong style={{ color: '#E8EEF5' }}>5 letters = 15 pts</strong>, <strong style={{ color: '#E8EEF5' }}>7+ letters = 40 pts</strong>.
                  You have <strong style={{ color: '#E8EEF5' }}>90 seconds</strong>!
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
                  style={{ padding: '16px 48px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #E8A04A, #D4893B)', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(232,160,74,0.35)' }}>
                  Start Game
                </motion.button>
              </div>
              <InlineLeaderboard gameId="word-weaver" color="#E8A04A" />
            </motion.div>
          )}

          {phase === 'playing' && (
            <>
              {/* HUD */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: '#3A4A5E' }}>Words found: <strong style={{ color: '#E8A04A' }}>{foundWords.length}</strong></span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: timerColor }}>{timeLeft}s</span>
                  </div>
                  <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${timerPct}%`, background: timerColor }} transition={{ duration: 0.5 }} style={{ height: '100%', borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 26, fontWeight: 700, color: '#E8A04A', lineHeight: 1 }}>{score}</p>
                  <p style={{ fontSize: 9, color: '#3A4A5E', textTransform: 'uppercase' }}>Score</p>
                </div>
              </div>

              {/* Letter tiles */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {letters.map((ch, i) => (
                  <motion.button key={i}
                    whileHover={{ y: -4, scale: 1.12 }} whileTap={{ scale: 0.92 }}
                    onClick={() => handleLetterClick(ch, i)}
                    style={{ width: 54, height: 60, borderRadius: 12, border: '1px solid rgba(232,160,74,0.3)', background: 'rgba(232,160,74,0.08)', color: '#E8A04A', fontSize: 20, fontWeight: 800, cursor: 'pointer', fontFamily: 'Playfair Display, serif', boxShadow: '0 4px 12px rgba(232,160,74,0.1)', transition: 'all 0.15s' }}>
                    {ch}
                  </motion.button>
                ))}
              </div>

              {/* Reshuffle */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={reshuffleLetters}
                  style={{ background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '5px 14px', color: '#3A4A5E', fontSize: 11, cursor: 'pointer' }}>
                  🔀 Shuffle letters
                </motion.button>
              </div>

              {/* Input */}
              <motion.div animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}} transition={{ duration: 0.35 }} style={{ marginBottom: 16 }}>
                <div style={{ position: 'relative', display: 'flex', gap: 10 }}>
                  <input ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && submitWord()}
                    placeholder="Type a word…"
                    style={{ flex: 1, padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(232,160,74,0.25)', color: '#E8EEF5', fontSize: 18, fontWeight: 600, outline: 'none', fontFamily: 'Playfair Display, serif', letterSpacing: '2px' }} />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={submitWord}
                    style={{ padding: '0 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #E8A04A, #D4893B)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    Submit
                  </motion.button>
                </div>
              </motion.div>

              {/* Feedback */}
              <AnimatePresence>
                {lastWord && (
                  <motion.p key={lastWord.word} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, marginBottom: 12, color: lastWord.ok ? '#4FC3A1' : '#E05C5C' }}>
                    {lastWord.ok ? `✓ "${lastWord.word.toUpperCase()}" +${lastWord.pts} pts` : `✗ "${lastWord.word.toUpperCase()}" — ${foundWords.includes(lastWord.word) ? 'already found' : 'not a valid word'}`}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Found words */}
              {foundWords.length > 0 && (
                <div style={{ padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', maxHeight: 160, overflowY: 'auto' }}>
                  <p style={{ fontSize: 10, color: '#3A4A5E', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Found words</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {foundWords.map(w => (
                      <span key={w} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(79,195,161,0.1)', border: '1px solid rgba(79,195,161,0.2)', color: '#4FC3A1', fontSize: 11, fontWeight: 600 }}>
                        {w.toUpperCase()} ({w.length <= 3 ? '+5' : w.length === 4 ? '+10' : w.length === 5 ? '+15' : w.length === 6 ? '+25' : '+40'})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {phase === 'gameover' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              <div style={{ padding: '40px 32px', borderRadius: 20, marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p style={{ fontSize: 44, marginBottom: 8 }}>📝</p>
                <p style={{ fontSize: 28, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 4 }}>Time's Up!</p>
                <p style={{ fontSize: 42, fontWeight: 800, color: '#E8A04A', marginBottom: 16 }}>{score} pts</p>
                <p style={{ fontSize: 14, color: '#4A5A6E', marginBottom: 20 }}>You found <strong style={{ color: '#E8EEF5' }}>{foundWords.length}</strong> word{foundWords.length !== 1 ? 's' : ''}!</p>
                {foundWords.length > 0 && (
                  <div style={{ textAlign: 'left', padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', marginBottom: 8 }}>
                    <p style={{ fontSize: 10, color: '#3A4A5E', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Words found</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {foundWords.map(w => (
                        <span key={w} style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(79,195,161,0.1)', border: '1px solid rgba(79,195,161,0.2)', color: '#4FC3A1', fontSize: 11, fontWeight: 600 }}>
                          {w.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startGame}
                  style={{ padding: '14px 36px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #E8A04A, #D4893B)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(232,160,74,0.3)' }}>
                  Play Again
                </motion.button>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => router.push('/games')}
                  style={{ padding: '14px 36px', borderRadius: 12, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#5A6A7E', fontSize: 14, fontWeight: 600 }}>
                  Exit
                </motion.button>
              </div>
              <InlineLeaderboard gameId="word-weaver" color="#E8A04A" />
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
