import { db } from '@/lib/firebase'
import {
  collection, addDoc, query, where,
  getDocs, doc, updateDoc, getDoc,
  orderBy, limit, onSnapshot,
} from 'firebase/firestore'

// POST — create a peer request or send a message
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action } = body

    // Create a peer request (student needs support)
    if (action === 'request') {
      const { userId, userName, course, semester } = body

      // Check if already has an active request
      const requestsRef = collection(db, 'peer_requests')
      const existingQ = query(
        requestsRef,
        where('userId', '==', userId),
        where('status', '==', 'waiting')
      )
      const existingSnap = await getDocs(existingQ)
      if (!existingSnap.empty) {
        return Response.json({
          success: true,
          requestId: existingSnap.docs[0].id,
          status: 'waiting',
        })
      }

      // Find an available supporter
      const supporterQ = query(
        requestsRef,
        where('status', '==', 'available'),
        where('userId', '!=', userId),
        limit(1)
      )
      const supporterSnap = await getDocs(supporterQ)

      if (!supporterSnap.empty) {
        // Match found — create a room
        const supporter = supporterSnap.docs[0]
        const roomId = `room_${Date.now()}`

        // Create chat room
        await addDoc(collection(db, 'peer_rooms'), {
          roomId,
          student: { userId, userName: userName || 'Anonymous', course, semester },
          supporter: { userId: supporter.data().userId, userName: 'Peer Supporter' },
          createdAt: new Date().toISOString(),
          status: 'active',
        })

        // Update supporter status
        await updateDoc(doc(db, 'peer_requests', supporter.id), {
          status: 'matched', roomId,
        })

        // Create student request
        const reqDoc = await addDoc(requestsRef, {
          userId, userName: userName || 'Anonymous',
          course, semester,
          status: 'matched', roomId,
          createdAt: new Date().toISOString(),
          role: 'student',
        })

        return Response.json({ success: true, requestId: reqDoc.id, roomId, status: 'matched' })
      }

      // No supporter available — add to waiting list
      const reqDoc = await addDoc(requestsRef, {
        userId, userName: userName || 'Anonymous',
        course, semester,
        status: 'waiting',
        createdAt: new Date().toISOString(),
        role: 'student',
      })

      return Response.json({ success: true, requestId: reqDoc.id, status: 'waiting' })
    }

    // Register as supporter
    if (action === 'support') {
      const { userId, userName } = body

      const requestsRef = collection(db, 'peer_requests')

      // Check for waiting students
      const waitingQ = query(
        requestsRef,
        where('status', '==', 'waiting'),
        where('userId', '!=', userId),
        limit(1)
      )
      const waitingSnap = await getDocs(waitingQ)

      if (!waitingSnap.empty) {
        const waiting = waitingSnap.docs[0]
        const roomId = `room_${Date.now()}`

        await addDoc(collection(db, 'peer_rooms'), {
          roomId,
          student: { userId: waiting.data().userId, userName: waiting.data().userName || 'Anonymous' },
          supporter: { userId, userName: userName || 'Peer Supporter' },
          createdAt: new Date().toISOString(),
          status: 'active',
        })

        await updateDoc(doc(db, 'peer_requests', waiting.id), {
          status: 'matched', roomId,
        })

        const reqDoc = await addDoc(requestsRef, {
          userId, userName: userName || 'Peer Supporter',
          status: 'matched', roomId,
          createdAt: new Date().toISOString(),
          role: 'supporter',
        })

        return Response.json({ success: true, requestId: reqDoc.id, roomId, status: 'matched' })
      }

      // No waiting students — mark as available
      const reqDoc = await addDoc(requestsRef, {
        userId, userName: userName || 'Peer Supporter',
        status: 'available',
        createdAt: new Date().toISOString(),
        role: 'supporter',
      })

      return Response.json({ success: true, requestId: reqDoc.id, status: 'available' })
    }

    // Send a message
    if (action === 'message') {
      const { roomId, userId, text, senderRole } = body

      const msgDoc = await addDoc(collection(db, 'peer_messages'), {
        roomId, userId, text, senderRole,
        timestamp: new Date().toISOString(),
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

    if (action === 'status' && userId) {
      const requestsRef = collection(db, 'peer_requests')
      const q = query(
        requestsRef,
        where('userId', '==', userId),
        limit(1)
      )
      const snap = await getDocs(q)
      if (snap.empty) return Response.json({ status: 'none' })
      return Response.json({ status: snap.docs[0].data().status, roomId: snap.docs[0].data().roomId, requestId: snap.docs[0].id })
    }

    if (action === 'messages' && roomId) {
      const messagesRef = collection(db, 'peer_messages')
      const q = query(
        messagesRef,
        where('roomId', '==', roomId),
        orderBy('timestamp', 'asc')
      )
      const snap = await getDocs(q)
      const messages = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      return Response.json(messages)
    }

    if (action === 'room' && roomId) {
      const roomsRef = collection(db, 'peer_rooms')
      const q = query(roomsRef, where('roomId', '==', roomId), limit(1))
      const snap = await getDocs(q)
      if (snap.empty) return Response.json({ error: 'Room not found' }, { status: 404 })
      return Response.json({ id: snap.docs[0].id, ...snap.docs[0].data() })
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}