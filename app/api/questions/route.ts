import { db } from '@/lib/firebaseAdmin'
import { verifyAuth } from '@/lib/firebaseAdmin'
import {
  BASELINE_QUESTIONS,
  DAILY_QUESTIONS,
  BASELINE_DAILY_DISTRIBUTION,
  DAILY_DISTRIBUTION,
  type QuestionCategory,
  type MWPQQuestion,
} from '@/lib/questions'

/**
 * GET /api/questions?userId=xxx
 *
 * Returns today's personalized set of 10 questions.
 * - Days 1-7  (baselineDaysCompleted < 7):  picks from BASELINE_QUESTIONS pool
 * - Day 8+    (baselineDaysCompleted >= 7): picks from DAILY_QUESTIONS pool
 *
 * Questions that the user has already answered (tracked in Firestore) are excluded
 * to ensure rotation. When the entire pool is exhausted, it resets automatically.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

    const authResult = await verifyAuth(req, userId)
    if ('error' in authResult) return Response.json({ error: authResult.error }, { status: 403 })

    const userRef = db.collection('users').doc(userId)
    const userSnap = await userRef.get()

    if (!userSnap.exists) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userSnap.data()!
    const baselineDaysCompleted: number = userData.baselineDaysCompleted ?? 0
    const isBaselinePhase = baselineDaysCompleted < 7

    const pool: MWPQQuestion[] = isBaselinePhase ? BASELINE_QUESTIONS : DAILY_QUESTIONS
    const distribution = isBaselinePhase ? BASELINE_DAILY_DISTRIBUTION : DAILY_DISTRIBUTION

    // Answered IDs field depends on phase
    const answeredField = isBaselinePhase ? 'answeredBaselineQuestions' : 'answeredDailyQuestions'
    let answered: string[] = userData[answeredField] ?? []

    // If we've gone through all questions, reset (full rotation complete)
    const unansweredInPool = pool.filter(q => !answered.includes(q.id))
    if (unansweredInPool.length < Object.values(distribution).reduce((a, b) => a + b, 0)) {
      // Reset rotation for this pool
      answered = []
    }

    // Group remaining questions by category
    const categoryMap = new Map<QuestionCategory, MWPQQuestion[]>()
    for (const q of pool) {
      if (!answered.includes(q.id)) {
        const list = categoryMap.get(q.category) ?? []
        list.push(q)
        categoryMap.set(q.category, list)
      }
    }

    // Pick questions per distribution
    const selected: MWPQQuestion[] = []
    for (const [category, count] of Object.entries(distribution) as [QuestionCategory, number][]) {
      if (count === 0) continue
      const available = categoryMap.get(category) ?? []
      // Fisher-Yates shuffle and take `count` items
      const shuffled = [...available].sort(() => Math.random() - 0.5)
      selected.push(...shuffled.slice(0, count))
    }

    // If any category was short, fill the gap with any remaining unanswered question
    const selectedIds = new Set(selected.map(q => q.id))
    const remaining = pool.filter(q => !answered.includes(q.id) && !selectedIds.has(q.id))
    const target = Object.values(distribution).reduce((a, b) => a + b, 0)
    if (selected.length < target) {
      const extras = remaining.sort(() => Math.random() - 0.5).slice(0, target - selected.length)
      selected.push(...extras)
    }

    // Shuffle the final selected list so it doesn't always start with mood
    const finalQuestions = selected.sort(() => Math.random() - 0.5)

    return Response.json({
      questions: finalQuestions,
      phase: isBaselinePhase ? 'baseline' : 'daily',
      baselineDaysCompleted,
      baselineDaysTotal: 7,
    })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
