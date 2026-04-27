import { db } from '@/lib/firebaseAdmin'
import { verifyAuth } from '@/lib/firebaseAdmin'

// POST — create a peer request or send a message
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action } = body

    if (body.userId) {
      const authResult = await verifyAuth(req, body.userId)
      if ('error' in authResult) return Response.json({ error: authResult.error }, { status: 403 })
    } else {
      const authResult = await verifyAuth(req)
      if ('error' in authResult) return Response.json({ error: authResult.error }, { status: 403 })
    }

    if (action === 'request') {
      const { userId, userName, course, semester } = body
      const requestsRef = db.collection('peer_requests')

      const existingSnap = await requestsRef
        .where('userId', '==', userId).where('status', '==', 'waiting').get()
      if (!existingSnap.empty) {
        return Response.json({ success: true, requestId: existingSnap.docs[0].id, status: 'waiting' })
      }

      const supporterSnap = await requestsRef
        .where('status', '==', 'available').where('userId', '!=', userId).limit(1).get()

      if (!supporterSnap.empty) {
        const supporter = supporterSnap.docs[0]
        const roomId = `room_${Date.now()}`
        await db.collection('peer_rooms').add({
          roomId,
          student: { userId, userName: userName || 'Anonymous', course, semester },
          supporter: { userId: supporter.data().userId, userName: 'Peer Supporter' },
          createdAt: new Date().toISOString(), status: 'active',
        })
        await requestsRef.doc(supporter.id).update({ status: 'matched', roomId })
        const reqDoc = await requestsRef.add({
          userId, userName: userName || 'Anonymous', course, semester,
          status: 'matched', roomId, createdAt: new Date().toISOString(), role: 'student',
        })
        return Response.json({ success: true, requestId: reqDoc.id, roomId, status: 'matched' })
      }

      const reqDoc = await requestsRef.add({
        userId, userName: userName || 'Anonymous', course, semester,
        status: 'waiting', createdAt: new Date().toISOString(), role: 'student',
      })
      return Response.json({ success: true, requestId: reqDoc.id, status: 'waiting' })
    }

    if (action === 'support') {
      const { userId, userName } = body
      const requestsRef = db.collection('peer_requests')

      const waitingSnap = await requestsRef
        .where('status', '==', 'waiting').where('userId', '!=', userId).limit(1).get()

      if (!waitingSnap.empty) {
        const waiting = waitingSnap.docs[0]
        const roomId = `room_${Date.now()}`
        await db.collection('peer_rooms').add({
          roomId,
          student: { userId: waiting.data().userId, userName: waiting.data().userName || 'Anonymous' },
          supporter: { userId, userName: userName || 'Peer Supporter' },
          createdAt: new Date().toISOString(), status: 'active',
        })
        await requestsRef.doc(waiting.id).update({ status: 'matched', roomId })
        const reqDoc = await requestsRef.add({
          userId, userName: userName || 'Peer Supporter',
          status: 'matched', roomId, createdAt: new Date().toISOString(), role: 'supporter',
        })
        return Response.json({ success: true, requestId: reqDoc.id, roomId, status: 'matched' })
      }

      const reqDoc = await requestsRef.add({
        userId, userName: userName || 'Peer Supporter',
        status: 'available', createdAt: new Date().toISOString(), role: 'supporter',
      })
      return Response.json({ success: true, requestId: reqDoc.id, status: 'available' })
    }

    if (action === 'message') {
      const { roomId, userId, text, senderRole } = body
      const msgDoc = await db.collection('peer_messages').add({
        roomId, userId, text, senderRole, timestamp: new Date().toISOString(),
      })
      return Response.json({ success: true, messageId: msgDoc.id })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

// GET — get room info or messages
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')
    const userId = searchParams.get('userId')
    const roomId = searchParams.get('roomId')

    if (userId) {
      const authResult = await verifyAuth(req, userId)
      if ('error' in authResult) return Response.json({ error: authResult.error }, { status: 403 })
    } else {
      const authResult = await verifyAuth(req)
      if ('error' in authResult) return Response.json({ error: authResult.error }, { status: 403 })
    }

    if (action === 'status' && userId) {
      const snap = await db.collection('peer_requests').where('userId', '==', userId).limit(1).get()
      if (snap.empty) return Response.json({ status: 'none' })
      return Response.json({
        status: snap.docs[0].data().status,
        roomId: snap.docs[0].data().roomId,
        requestId: snap.docs[0].id,
      })
    }

    if (action === 'messages' && roomId) {
      const snap = await db.collection('peer_messages')
        .where('roomId', '==', roomId).orderBy('timestamp', 'asc').get()
      return Response.json(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }

    if (action === 'room' && roomId) {
      const snap = await db.collection('peer_rooms').where('roomId', '==', roomId).limit(1).get()
      if (snap.empty) return Response.json({ error: 'Room not found' }, { status: 404 })
      return Response.json({ id: snap.docs[0].id, ...snap.docs[0].data() })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}