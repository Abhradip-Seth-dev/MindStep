import { db } from '@/lib/firebase'
import {
  collection, addDoc, query, where,
  getDocs, orderBy, limit, Timestamp,
} from 'firebase/firestore'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, userName, gameId, gameName, score, metadata } = body
    if (!userId || !gameId || score === undefined) {
      return Response.json({ error: 'userId, gameId and score required' }, { status: 400 })
    }

    const now = new Date()
    const date = now.toISOString().split('T')[0]

    const scoresRef = collection(db, 'gameScores')

    // Check if user already submitted a HIGHER score for this game today
    // We still allow new submission — we just track best per day
    const doc = await addDoc(scoresRef, {
      userId,
      userName: userName || 'Anonymous',
      gameId,
      gameName: gameName || gameId,
      score,
      metadata: metadata || {},
      date,
      timestamp: now.toISOString(),
    })

    return Response.json({ success: true, id: doc.id })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const gameId    = searchParams.get('gameId')
    const period    = searchParams.get('period') || 'today'   // today | week | alltime
    const userId    = searchParams.get('userId')              // to find user's own rank
    const limitNum  = parseInt(searchParams.get('limit') || '20')

    if (!gameId) return Response.json({ error: 'gameId required' }, { status: 400 })

    const scoresRef = collection(db, 'gameScores')

    // Build time filter
    let afterDate: string | null = null
    const today = new Date()
    if (period === 'today') {
      afterDate = today.toISOString().split('T')[0]
    } else if (period === 'week') {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      afterDate = weekAgo.toISOString().split('T')[0]
    }

    // Fetch scores for this game
    let q
    if (afterDate && period === 'today') {
      q = query(scoresRef, where('gameId', '==', gameId), where('date', '==', afterDate))
    } else {
      q = query(scoresRef, where('gameId', '==', gameId))
    }

    const snap = await getDocs(q)
    const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

    // Filter by week if needed (date comparison)
    let filtered = all
    if (period === 'week' && afterDate) {
      filtered = all.filter((s: any) => s.date >= afterDate!)
    }

    // Deduplicate: keep best score per user
    const bestByUser = new Map<string, any>()
    for (const entry of filtered) {
      const existing = bestByUser.get(entry.userId)
      if (!existing || entry.score > existing.score) {
        bestByUser.set(entry.userId, entry)
      }
    }

    // Sort by score descending and take top N
    const sorted = Array.from(bestByUser.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limitNum)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))

    // Find requesting user's rank (if not in top N)
    let myRank = null
    if (userId) {
      const allSorted = Array.from(bestByUser.values()).sort((a, b) => b.score - a.score)
      const myIdx = allSorted.findIndex((e: any) => e.userId === userId)
      if (myIdx !== -1) myRank = { rank: myIdx + 1, ...allSorted[myIdx] }
    }

    return Response.json({ leaderboard: sorted, myRank, total: bestByUser.size })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
