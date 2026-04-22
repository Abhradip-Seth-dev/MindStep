import { db } from '@/lib/firebase'
import {
  doc, getDoc, collection, query,
  where, orderBy, limit, getDocs,
} from 'firebase/firestore'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return Response.json({ error: 'userId required' }, { status: 400 })
    }

    const baselineRef = doc(db, 'baselines', userId)
    const baselineSnap = await getDoc(baselineRef)

    const baseline = baselineSnap.exists() ? baselineSnap.data() : null

    const checkinsRef = collection(db, 'checkins')
    const q = query(
      checkinsRef,
      where('userId', '==', userId),
    
      limit(14)
    )
    const snap = await getDocs(q)
    const recentCheckins = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    return Response.json({ baseline, recentCheckins })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}