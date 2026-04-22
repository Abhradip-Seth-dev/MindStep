import { db } from '@/lib/firebase'
import {
  collection, addDoc, query, where,
  getDocs, doc, getDoc, updateDoc,
  setDoc, limit,
} from 'firebase/firestore'
import {
  calculateStatus,
  detectDrift,
  updateBaseline,
  getCombinedTrustScore,
} from '@/lib/scoring'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, sleep, socialEnergy, pressure, ate, emotion, startTime, endTime } = body

    const date = new Date().toISOString().split('T')[0]

    const checkinsRef = collection(db, 'checkins')

    // Get recent checkins for variance/consistency analysis and existence check
    const recentQ = query(checkinsRef, where('userId', '==', userId), limit(10))
    const recentSnap = await getDocs(recentQ)
    const recentCheckins = recentSnap.docs.map(d => d.data()) as any[]

    // Check if already checked in today
    const alreadyToday = recentCheckins.some(c => c.date === date)
    if (alreadyToday) {
      return Response.json({ error: 'Already checked in today' }, { status: 400 })
    }

    // Get baseline
    const baselineRef = doc(db, 'baselines', userId)
    const baselineSnap = await getDoc(baselineRef)
    const baseline = baselineSnap.exists() ? baselineSnap.data() : null

    // Calculate trust score
    const checkinData = { sleep, socialEnergy, pressure, ate, emotion }
    const { score: trustScore, flags, trustLevel } = getCombinedTrustScore(
      checkinData,
      recentCheckins,
      startTime,
      endTime
    )

    console.log(`Trust score for ${userId}: ${trustScore.toFixed(2)} (${trustLevel}) flags: ${flags.join(', ') || 'none'}`)

    // Calculate status with trust awareness
    const status = calculateStatus(checkinData, baseline as any, trustScore)

    // Save checkin with trust metadata 
    const checkinDoc = {
      userId, date, sleep, socialEnergy,
      pressure, ate, emotion, status,
      trustScore: Math.round(trustScore * 100) / 100,
      trustLevel,
      trustFlags: flags,
      timestamp: new Date().toISOString(),
    }
    const docRef = await addDoc(checkinsRef, checkinDoc)

    // Update baseline (trust-weighted)
    const updatedBaseline = updateBaseline(baseline as any, checkinData, trustScore)
    await setDoc(baselineRef, {
      ...updatedBaseline,
      userId,
      lastUpdated: new Date().toISOString(),
    })

    // Update streak
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      const user = userSnap.data()
      const lastCheckIn = user.lastCheckIn
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const isConsecutive = lastCheckIn &&
        new Date(lastCheckIn).toISOString().split('T')[0] ===
        yesterday.toISOString().split('T')[0]
      await updateDoc(userRef, {
        streak: isConsecutive ? (user.streak || 0) + 1 : 1,
        lastCheckIn: new Date().toISOString(),
      })
    }

    // Detect drift — fire real email alert if red
    const driftStatus = detectDrift(recentCheckins, baseline as any)
    if (driftStatus === 'red') {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await fetch(`${baseUrl}/api/alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, driftStatus: 'red' }),
        })
      } catch (alertErr) {
        console.error('Failed to send UCC alert email:', alertErr)
      }
    }

    return Response.json({
      success: true,
      checkin: { id: docRef.id, ...checkinDoc },
      driftStatus,
      trustScore,
      trustLevel,
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const dateFilter = searchParams.get('date')  // optional exact-date filter
    const limitNum = parseInt(searchParams.get('limit') || '30')

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 })
    }

    const checkinsRef = collection(db, 'checkins')

    // Only query by userId to avoid composite index requirement
    // Then filter by date in memory if needed
    const q = query(
      checkinsRef,
      where('userId', '==', userId),
      limit(limitNum)
    )
    const snap = await getDocs(q)
    let checkins = snap.docs.map(d => ({ id: d.id, ...d.data() as any }))

    if (dateFilter) {
      checkins = checkins.filter(c => c.date === dateFilter)
    }

    return Response.json(checkins)
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}