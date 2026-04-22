'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

interface LeaderEntry {
  rank: number
  userId: string
  userName: string
  score: number
  metadata?: any
}

interface InlineLeaderboardProps {
  gameId: string
  color: string
}

const MEDAL = ['🥇', '🥈', '🥉']
function getRankColor(rank: number, defaultColor: string) {
  if (rank === 1) return '#FFD700'
  if (rank === 2) return '#C0C0C0'
  if (rank === 3) return '#CD7F32'
  return defaultColor
}

export default function InlineLeaderboard({ gameId, color }: InlineLeaderboardProps) {
  const [entries, setEntries] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [myRank, setMyRank] = useState<LeaderEntry | null>(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    let active = true
    const fetchScores = async () => {
      try {
        const uid = user ? `&userId=${user.uid}` : ''
        const res = await fetch(`/api/games/scores?gameId=${gameId}&period=today&limit=5${uid}`)
        const data = await res.json()
        if (active && !data.error) {
          setEntries(data.leaderboard || [])
          if (data.myRank) setMyRank(data.myRank)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchScores()
    return () => { active = false }
  }, [gameId, user])

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ width: 24, height: 24, border: `2px solid ${color}40`, borderTopColor: color, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <style>{'@keyframes spin { 100% { transform: rotate(360deg); } }'}</style>
      </div>
    )
  }

  if (entries.length === 0) {
    return null
  }

  const inTopList = myRank ? entries.some(e => e.userId === user?.uid) : false

  return (
    <div style={{ 
      marginTop: 24, padding: '16px 20px', borderRadius: 16, 
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <h3 style={{ fontSize: 13, color: '#8B9BB0', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, textAlign: 'center', fontWeight: 600 }}>
        Today's Top Players
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry, i) => {
          const isMe = entry.userId === user?.uid
          return (
            <motion.div key={entry.userId} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 12,
                background: isMe ? `${color}15` : 'rgba(255,255,255,0.03)',
                border: isMe ? `1px solid ${color}40` : '1px solid transparent'
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: entry.rank <= 3 ? 16 : 13, fontWeight: 700, color: getRankColor(entry.rank, color), width: 24, textAlign: 'center' }}>
                  {entry.rank <= 3 ? MEDAL[entry.rank - 1] : `#${entry.rank}`}
                </span>
                <span style={{ fontSize: 13, fontWeight: isMe ? 600 : 400, color: isMe ? '#E8EEF5' : '#C8D4E0' }}>
                  {entry.userName} {isMe && <span style={{ color, fontSize: 10 }}>(You)</span>}
                </span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: entry.rank <= 3 ? getRankColor(entry.rank, color) : isMe ? color : '#E8EEF5', fontFamily: 'Playfair Display, serif' }}>
                {entry.score.toLocaleString()}
              </span>
            </motion.div>
          )
        })}

        {myRank && !inTopList && (
          <>
            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', margin: '4px 0' }} />
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 12,
                background: `${color}15`, border: `1px solid ${color}40`
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color, width: 24, textAlign: 'center' }}>#{myRank.rank}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#E8EEF5' }}>{myRank.userName} <span style={{ color, fontSize: 10 }}>(You)</span></span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'Playfair Display, serif' }}>{myRank.score.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
