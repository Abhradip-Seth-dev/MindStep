import { db } from '@/lib/firebaseAdmin'
import { verifyAuth } from '@/lib/firebaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, userName, gameId, gameName, score, metadata } = body
    if (!userId || !gameId || score === undefined) {
      return Response.json({ error: 'userId, gameId and score required' }, { status: 400 })
    }

    const authResult = await verifyAuth(req, userId)
    if ('error' in authResult) return Response.json({ error: authResult.error }, { status: 403 })

    const now = new Date()
    const date = now.toISOString().split('T')[0]

    const docRef = await db.collection('gameScores').add({
      userId,
      userName: userName || 'Anonymous',
      gameId,
      gameName: gameName || gameId,
      score,
      metadata: metadata || {},
      date,
      timestamp: now.toISOString(),
    })

    return Response.json({ success: true, id: docRef.id })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const gameId   = searchParams.get('gameId')
    const period   = searchParams.get('period') || 'today'
    const userId   = searchParams.get('userId')
    const limitNum = parseInt(searchParams.get('limit') || '20')

    if (!gameId) return Response.json({ error: 'gameId required' }, { status: 400 })

    const today = new Date()
    let afterDate: string | null = null
    if (period === 'today') {
      afterDate = today.toISOString().split('T')[0]
    } else if (period === 'week') {
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      afterDate = weekAgo.toISOString().split('T')[0]
    }

    let query = db.collection('gameScores').where('gameId', '==', gameId)
    if (afterDate && period === 'today') {
      query = query.where('date', '==', afterDate) as any
    }

    const snap = await query.get()
    let all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

    if (period === 'week' && afterDate) {
      all = all.filter((s: any) => s.date >= afterDate!)
    }

    // Deduplicate: keep best score per user
    const bestByUser = new Map<string, any>()
    for (const entry of all) {
      const existing = bestByUser.get(entry.userId)
      if (!existing || entry.score > existing.score) {
        bestByUser.set(entry.userId, entry)
      }
    }

    const sorted = Array.from(bestByUser.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limitNum)
      .map((entry, i) => ({ ...entry, rank: i + 1 }))

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

