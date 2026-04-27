import { db } from '@/lib/firebaseAdmin'
import { verifyAuth } from '@/lib/firebaseAdmin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 })
    }

    const authResult = await verifyAuth(req, userId)
    if ('error' in authResult) return Response.json({ error: authResult.error }, { status: 403 })

    const baselineSnap = await db.collection('baselines').doc(userId).get()
    const baseline = baselineSnap.exists ? baselineSnap.data() : null

    const snap = await db.collection('checkins')
      .where('userId', '==', userId)
      .limit(14)
      .get()
    const recentCheckins = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    return Response.json({ baseline, recentCheckins })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}