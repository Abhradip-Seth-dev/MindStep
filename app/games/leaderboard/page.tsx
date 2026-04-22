'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import Sidebar from '@/components/Sidebar'

const GAMES = [
  { id: 'memory-matrix', name: 'Memory Matrix', emoji: '🧩', color: '#5B9CF6' },
  { id: 'focus-flow',    name: 'Focus Flow',    emoji: '🎯', color: '#4FC3A1' },
  { id: 'emotion-recall',name: 'Emotion Recall',emoji: '💭', color: '#A78BFA' },
  { id: 'speed-math',    name: 'Speed Math',    emoji: '⚡', color: '#5B9CF6' },
  { id: 'word-weaver',   name: 'Word Weaver',   emoji: '📝', color: '#E8A04A' },
  { id: 'pattern-pulse', name: 'Pattern Pulse', emoji: '🎵', color: '#A78BFA' },
]

const PERIODS = [
  { id: 'today', label: 'Today' },
  { id: 'week',  label: 'This Week' },
  { id: 'alltime', label: 'All Time' },
]

const MEDAL = ['🥇', '🥈', '🥉']

function getRankColor(rank: number) {
  if (rank === 1) return '#FFD700'
  if (rank === 2) return '#C0C0C0'
  if (rank === 3) return '#CD7F32'
  return '#4A5A6E'
}

interface LeaderEntry {
  rank: number
  userId: string
  userName: string
  score: number
  metadata?: any
  date?: string
}

export default function Leaderboard() {
  const router = useRouter()
  const [user, setUser]       = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [userData, setUserData] = useState<any>(null)

  const [activeGame,   setActiveGame]   = useState(GAMES[0].id)
  const [activePeriod, setActivePeriod] = useState('today')
  const [entries, setEntries]           = useState<LeaderEntry[]>([])
  const [myRank,  setMyRank]            = useState<LeaderEntry | null>(null)
  const [total,   setTotal]             = useState(0)
  const [loading, setLoading]           = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) { router.push('/onboarding'); return }
      setUser(firebaseUser)
      setUserName(firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student')
      try {
        const res = await fetch(`/api/user?firebaseUid=${firebaseUser.uid}`)
        const ud = await res.json()
        if (!ud.error) setUserData(ud)
      } catch {}
    })
    return () => unsub()
  }, [])

  const fetchLeaderboard = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const url = `/api/games/scores?gameId=${activeGame}&period=${activePeriod}&userId=${user.uid}&limit=20`
      const res = await fetch(url)
      const data = await res.json()
      if (!data.error) {
        setEntries(data.leaderboard || [])
        setMyRank(data.myRank || null)
        setTotal(data.total || 0)
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [user, activeGame, activePeriod])

  useEffect(() => { fetchLeaderboard() }, [fetchLeaderboard])

  const activeGameData = GAMES.find(g => g.id === activeGame)!
  const inTopList = myRank ? entries.some(e => e.userId === user?.uid) : false

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C12' }}>
      {/* Ambient */}
      <div style={{ position: 'fixed', top: '10%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${activeGameData.color}08 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0, transition: 'background 0.5s' }} />

      <Sidebar userName={userName} userData={userData} />

      <main style={{ flex: 1, marginLeft: '220px', padding: '50px 60px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40 }}>
          <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/games')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4A5A6E', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            ← Back to Games
          </motion.button>
          <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: activeGameData.color, fontWeight: 600, marginBottom: 8 }}>
            Mind Games
          </p>
          <h1 style={{ fontSize: 38, fontFamily: 'Playfair Display, serif', color: '#E8EEF5', marginBottom: 10, fontWeight: 600 }}>
            Leaderboard
          </h1>
          <p style={{ fontSize: 14, color: '#4A5A6E' }}>
            See how you rank against other players across each game.
          </p>
        </motion.div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
          {/* Left — game selector */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            style={{ width: 220, flexShrink: 0 }}>
            <p style={{ fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#2A3A4E', marginBottom: 12, fontWeight: 600 }}>
              Select Game
            </p>
            {GAMES.map(g => (
              <motion.button key={g.id} whileHover={{ x: 4 }} whileTap={{ scale: 0.97 }}
                onClick={() => setActiveGame(g.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 12, marginBottom: 4, border: 'none',
                  background: activeGame === g.id ? `${g.color}12` : 'transparent',
                  outline: activeGame === g.id ? `1px solid ${g.color}30` : '1px solid transparent',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${g.color}18`, border: `1px solid ${g.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {g.emoji}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: activeGame === g.id ? 600 : 400, color: activeGame === g.id ? g.color : '#5A6A7E', marginBottom: 1 }}>{g.name}</p>
                  {activeGame === g.id && (
                    <p style={{ fontSize: 10, color: '#3A4A5E' }}>{total} player{total !== 1 ? 's' : ''}</p>
                  )}
                </div>
              </motion.button>
            ))}

            {/* Play button */}
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => router.push(`/games/${activeGame}`)}
              style={{ marginTop: 12, width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${activeGameData.color}, ${activeGameData.color}BB)`, color: '#080C12', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 20px ${activeGameData.color}30` }}>
              Play {activeGameData.emoji} Now
            </motion.button>
          </motion.div>

          {/* Right — leaderboard */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ flex: 1 }}>
            {/* Period tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24, padding: '4px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
              {PERIODS.map(p => (
                <motion.button key={p.id} whileTap={{ scale: 0.96 }}
                  onClick={() => setActivePeriod(p.id)}
                  style={{
                    padding: '8px 20px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: activePeriod === p.id ? 600 : 400,
                    background: activePeriod === p.id ? activeGameData.color : 'transparent',
                    color: activePeriod === p.id ? '#080C12' : '#4A5A6E',
                    transition: 'all 0.2s',
                  }}>
                  {p.label}
                </motion.button>
              ))}
            </div>

            {/* Top 3 podium */}
            {!loading && entries.length >= 3 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', gap: 12, marginBottom: 28, alignItems: 'flex-end', justifyContent: 'center' }}>
                {/* 2nd place */}
                <PodiumCard entry={entries[1]} rank={2} color={activeGameData.color} isMe={entries[1]?.userId === user?.uid} />
                {/* 1st place */}
                <PodiumCard entry={entries[0]} rank={1} color={activeGameData.color} isMe={entries[0]?.userId === user?.uid} tall />
                {/* 3rd place */}
                <PodiumCard entry={entries[2]} rank={3} color={activeGameData.color} isMe={entries[2]?.userId === user?.uid} />
              </motion.div>
            )}

            {/* Full list */}
            <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 100px', padding: '12px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 10, color: '#2A3A4E', textTransform: 'uppercase', letterSpacing: '0.12em' }}>#</p>
                <p style={{ fontSize: 10, color: '#2A3A4E', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Player</p>
                <p style={{ fontSize: 10, color: '#2A3A4E', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'right' }}>Score</p>
              </div>

              {/* Loading */}
              {loading && (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${activeGameData.color}40`, borderTopColor: activeGameData.color, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 13, color: '#3A4A5E' }}>Loading scores…</p>
                </div>
              )}

              {/* Empty state */}
              {!loading && entries.length === 0 && (
                <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>{activeGameData.emoji}</p>
                  <p style={{ fontSize: 16, color: '#E8EEF5', marginBottom: 8, fontFamily: 'Playfair Display, serif' }}>No scores yet</p>
                  <p style={{ fontSize: 13, color: '#3A4A5E', marginBottom: 20 }}>Be the first to play and claim the #1 spot!</p>
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => router.push(`/games/${activeGame}`)}
                    style={{ padding: '12px 28px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${activeGameData.color}, ${activeGameData.color}BB)`, color: '#080C12', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    Play Now →
                  </motion.button>
                </div>
              )}

              {/* Rows */}
              {!loading && entries.map((entry, i) => {
                const isMe = entry.userId === user?.uid
                return (
                  <motion.div key={entry.userId + i}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{
                      display: 'grid', gridTemplateColumns: '48px 1fr 100px',
                      padding: '14px 20px', alignItems: 'center',
                      borderBottom: i < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: isMe ? `${activeGameData.color}08` : 'transparent',
                      transition: 'background 0.2s',
                    }}>
                    {/* Rank */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {entry.rank <= 3
                        ? <span style={{ fontSize: 20 }}>{MEDAL[entry.rank - 1]}</span>
                        : <span style={{ fontSize: 13, fontWeight: 700, color: getRankColor(entry.rank), fontFamily: 'Playfair Display, serif' }}>#{entry.rank}</span>
                      }
                    </div>

                    {/* Player */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: isMe
                          ? `linear-gradient(135deg, ${activeGameData.color}50, ${activeGameData.color}30)`
                          : 'rgba(255,255,255,0.06)',
                        border: isMe ? `1px solid ${activeGameData.color}50` : '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700,
                        color: isMe ? activeGameData.color : '#5A6A7E',
                      }}>
                        {(entry.userName || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: isMe ? 600 : 400, color: isMe ? '#E8EEF5' : '#C8D4E0', marginBottom: 1 }}>
                          {entry.userName} {isMe && <span style={{ fontSize: 10, color: activeGameData.color, fontWeight: 600 }}>(You)</span>}
                        </p>
                        <p style={{ fontSize: 10, color: '#3A4A5E' }}>{entry.date || ''}</p>
                      </div>
                    </div>

                    {/* Score */}
                    <p style={{ fontSize: 17, fontWeight: 700, color: entry.rank <= 3 ? getRankColor(entry.rank) : isMe ? activeGameData.color : '#C8D4E0', textAlign: 'right', fontFamily: 'Playfair Display, serif' }}>
                      {entry.score.toLocaleString()}
                    </p>
                  </motion.div>
                )
              })}
            </div>

            {/* My rank — if not in top list */}
            {!loading && myRank && !inTopList && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                style={{ marginTop: 12, padding: '14px 20px', borderRadius: 14, background: `${activeGameData.color}08`, border: `1px solid ${activeGameData.color}25`, display: 'grid', gridTemplateColumns: '48px 1fr 100px', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: activeGameData.color }}>#{myRank.rank}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${activeGameData.color}30`, border: `1px solid ${activeGameData.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: activeGameData.color }}>
                    {(myRank.userName || 'A')[0].toUpperCase()}
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#E8EEF5' }}>{myRank.userName} <span style={{ fontSize: 10, color: activeGameData.color }}>(You)</span></p>
                </div>
                <p style={{ fontSize: 17, fontWeight: 700, color: activeGameData.color, textAlign: 'right', fontFamily: 'Playfair Display, serif' }}>{myRank.score.toLocaleString()}</p>
              </motion.div>
            )}

            {/* No score yet for user */}
            {!loading && !myRank && user && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                style={{ marginTop: 16, padding: '16px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 13, color: '#5A6A7E', marginBottom: 2 }}>You haven't played this game {activePeriod === 'today' ? 'today' : activePeriod === 'week' ? 'this week' : 'yet'}.</p>
                  <p style={{ fontSize: 11, color: '#3A4A5E' }}>Play now to get on the board!</p>
                </div>
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={() => router.push(`/games/${activeGame}`)}
                  style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: `${activeGameData.color}18`, color: activeGameData.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  Play →
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

// Podium card component
function PodiumCard({ entry, rank, color, isMe, tall }: { entry: LeaderEntry; rank: number; color: string; isMe: boolean; tall?: boolean }) {
  const heights = { 1: 100, 2: 72, 3: 56 }
  const podiumH = heights[rank as 1|2|3] || 56
  return (
    <div style={{ textAlign: 'center', flex: tall ? '0 0 160px' : '0 0 140px' }}>
      {/* Avatar */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: tall ? 28 : 22 }}>{MEDAL[rank - 1]}</span>
      </div>
      <div style={{ width: tall ? 52 : 44, height: tall ? 52 : 44, borderRadius: '50%', margin: '0 auto 6px', background: isMe ? `${color}30` : 'rgba(255,255,255,0.08)', border: isMe ? `2px solid ${color}60` : '2px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: tall ? 20 : 16, fontWeight: 700, color: isMe ? color : '#5A6A7E' }}>
        {(entry?.userName || '?')[0].toUpperCase()}
      </div>
      <p style={{ fontSize: 11, fontWeight: 600, color: isMe ? color : '#C8D4E0', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>
        {entry?.userName || '—'}
      </p>
      <p style={{ fontSize: tall ? 16 : 13, fontWeight: 800, color: getRankColor(rank), marginBottom: 6, fontFamily: 'Playfair Display, serif' }}>
        {entry?.score?.toLocaleString() || '0'}
      </p>
      {/* Podium block */}
      <div style={{ height: podiumH, borderRadius: '8px 8px 0 0', background: rank === 1 ? `linear-gradient(180deg, ${color}30, ${color}15)` : 'rgba(255,255,255,0.04)', border: `1px solid ${rank === 1 ? `${color}30` : 'rgba(255,255,255,0.06)'}`, borderBottom: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 18, fontWeight: 800, color: getRankColor(rank), fontFamily: 'Playfair Display, serif' }}>#{rank}</p>
      </div>
    </div>
  )
}
