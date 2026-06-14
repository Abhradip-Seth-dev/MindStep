import { db } from '@/lib/firebaseAdmin'
import admin from 'firebase-admin'
import {
  calculateStatus,
  detectDrift,
  updateBaseline,
  getCombinedTrustScore,
  calcDomainScores,
  calcMWPQStatus,
  mwpqStatusToLegacy,
  type MWPQAnswer,
} from '@/lib/scoring'
import { BASELINE_QUESTIONS, DAILY_QUESTIONS } from '@/lib/questions'
import { verifyAuth } from '@/lib/firebaseAdmin'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      userId,
      // Legacy fields (kept for backward compatibility during transition)
      sleep, socialEnergy, pressure, ate, emotion, notes,
      startTime, endTime,
      // MWPQ fields (new system)
      mwpqAnswers,   // MWPQAnswer[]  — array of { questionId, value }
      phase,         // 'baseline' | 'daily'
    } = body

    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

    const authResult = await verifyAuth(req, userId)
    if ('error' in authResult) return Response.json({ error: authResult.error }, { status: 403 })

    const date = new Date().toISOString().split('T')[0]

    const checkinsRef = db.collection('checkins')
    const recentSnap = await checkinsRef.where('userId', '==', userId).limit(10).get()
    const recentCheckins = recentSnap.docs.map(d => d.data()) as any[]

    // Check if already checked in today
    const alreadyToday = recentCheckins.some(c => c.date === date)
    if (alreadyToday) {
      return Response.json({ error: 'Already checked in today' }, { status: 400 })
    }

    // ── Fetch user doc for baseline phase tracking ────────────────────────────
    const userRef = db.collection('users').doc(userId)
    const userSnap = await userRef.get()
    const userData = userSnap.exists ? userSnap.data()! : {}
    const baselineDaysCompleted: number = userData.baselineDaysCompleted ?? 0

    // ── Handle MWPQ submission (new path) ─────────────────────────────────────
    if (mwpqAnswers && Array.isArray(mwpqAnswers) && mwpqAnswers.length > 0) {
      const answers = mwpqAnswers as MWPQAnswer[]
      const questionBank = phase === 'baseline' ? BASELINE_QUESTIONS : DAILY_QUESTIONS

      // Calculate MWPQ domain scores
      const domainScores = calcDomainScores(answers, questionBank)
      const mwpqStatus = calcMWPQStatus(domainScores, baselineDaysCompleted)
      const legacyStatus = mwpqStatusToLegacy(mwpqStatus)

      // Overall numeric score (1-5 → for storage/trending)
      const domainValues = Array.from(domainScores.values()).map(d => d.normalizedAvg)
      const overallScore = domainValues.length > 0
        ? domainValues.reduce((a, b) => a + b, 0) / domainValues.length
        : 3.0

      // Build domain scores object for Firestore
      const domainScoresObj: Record<string, number> = {}
      for (const [domain, ds] of domainScores.entries()) {
        domainScoresObj[domain] = Math.round(ds.normalizedAvg * 100) / 100
      }

      // Track answered question IDs to avoid repeats
      const answeredIds = answers.map(a => a.questionId)
      const answeredField = phase === 'baseline' ? 'answeredBaselineQuestions' : 'answeredDailyQuestions'
      const existingAnswered: string[] = userData[answeredField] ?? []

      // Build checkin doc
      const checkinDoc: any = {
        userId, date,
        type: 'mwpq',
        phase: phase ?? 'daily',
        mwpqAnswers: answers,
        domainScores: domainScoresObj,
        overallScore: Math.round(overallScore * 100) / 100,
        mwpqStatus,
        status: legacyStatus,
        timestamp: new Date().toISOString(),
      }
      if (notes && typeof notes === 'string' && notes.trim().length > 0) {
        checkinDoc.notes = notes.trim().slice(0, 200)
      }
      // Carry through legacy emotion if user selected one at end of flow
      if (emotion) checkinDoc.emotion = emotion

      const docRef = await checkinsRef.add(checkinDoc)

      // Update user: baseline days + answered question tracking
      const userUpdates: any = {
        [answeredField]: [...new Set([...existingAnswered, ...answeredIds])],
        lastCheckIn: new Date().toISOString(),
      }

      if (phase === 'baseline') {
        userUpdates.baselineDaysCompleted = baselineDaysCompleted + 1
      }

      // Streak logic
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const isConsecutive = userData.lastCheckIn &&
        new Date(userData.lastCheckIn).toISOString().split('T')[0] ===
        yesterday.toISOString().split('T')[0]
      userUpdates.streak = isConsecutive ? (userData.streak || 0) + 1 : 1

      await userRef.update(userUpdates)

      // Drift detection using legacy status for UCC alert compatibility
      const driftStatus = detectDrift(recentCheckins, null)
      if (mwpqStatus === 'alert' || driftStatus === 'red') {
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
        mwpqStatus,
        overallScore,
        domainScores: domainScoresObj,
        baselineDaysCompleted: phase === 'baseline' ? baselineDaysCompleted + 1 : baselineDaysCompleted,
      })
    }

    // ── Legacy submission path (old 5-question form) ──────────────────────────
    const baselineRef = db.collection('baselines').doc(userId)
    const baselineSnap = await baselineRef.get()
    const baseline = baselineSnap.exists ? baselineSnap.data() : null

    const checkinData = { sleep, socialEnergy, pressure, ate, emotion }
    const { score: trustScore, flags, trustLevel } = getCombinedTrustScore(
      checkinData, recentCheckins, startTime, endTime
    )

    const status = calculateStatus(checkinData, baseline as any, trustScore)

    const checkinDoc: any = {
      userId, date, sleep, socialEnergy,
      pressure, ate, emotion, status,
      type: 'legacy',
      trustScore: Math.round(trustScore * 100) / 100,
      trustLevel, trustFlags: flags,
      timestamp: new Date().toISOString(),
    }
    if (notes && typeof notes === 'string' && notes.trim().length > 0) {
      checkinDoc.notes = notes.trim().slice(0, 200)
    }
    const docRef = await checkinsRef.add(checkinDoc)

    const updatedBaseline = updateBaseline(baseline as any, checkinData, trustScore)
    await baselineRef.set({ ...updatedBaseline, userId, lastUpdated: new Date().toISOString() })

    if (userSnap.exists) {
      const user = userData
      const lastCheckIn = user.lastCheckIn
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const isConsecutive = lastCheckIn &&
        new Date(lastCheckIn).toISOString().split('T')[0] ===
        yesterday.toISOString().split('T')[0]
      await userRef.update({
        streak: isConsecutive ? (user.streak || 0) + 1 : 1,
        lastCheckIn: new Date().toISOString(),
      })
    }

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
      driftStatus, trustScore, trustLevel,
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const dateFilter = searchParams.get('date')
    const limitNum = parseInt(searchParams.get('limit') || '30')

    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

    const authResult = await verifyAuth(req, userId)
    if ('error' in authResult) return Response.json({ error: authResult.error }, { status: 403 })

    const checkinsRef = db.collection('checkins')
    let snap = await checkinsRef.where('userId', '==', userId).limit(limitNum).get()
    let checkins = snap.docs.map(d => ({ id: d.id, ...d.data() as any }))
    if (dateFilter) checkins = checkins.filter((c: any) => c.date === dateFilter)
    return Response.json(checkins)
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}