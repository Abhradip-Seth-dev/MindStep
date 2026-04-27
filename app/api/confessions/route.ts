import { NextResponse } from 'next/server'
import { verifyAuth, db } from '@/lib/firebaseAdmin'
import admin from 'firebase-admin'

export async function GET(req: Request) {
  try {
    const authResult = await verifyAuth(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const snapshot = await db.collection('confessions').orderBy('createdAt', 'desc').limit(50).get()
    const confessions = snapshot.docs.map(doc => {
      const data = doc.data()
      const likedBy = data.likedBy || []
      return {
        id: doc.id,
        text: data.text,
        author: data.author,
        color: data.color,
        likes: data.likes || 0,
        comments: data.comments || 0,
        reposts: data.reposts || 0,
        hasLiked: likedBy.includes(authResult.uid),
        hasReposted: (data.repostedBy || []).includes(authResult.uid),
      }
    })

    return NextResponse.json(confessions)
  } catch (error) {
    console.error('Error fetching confessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await verifyAuth(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await req.json()
    const { text, author, color, confessionId, commentText } = body

    // ── Add a comment to an existing confession ──────────────────────────
    if (confessionId && commentText) {
      if (!commentText.trim()) {
        return NextResponse.json({ error: 'Comment text required' }, { status: 400 })
      }

      const commentData = {
        text: commentText.trim(),
        author: author || 'Anonymous',
        userId: authResult.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }

      const commentRef = await db
        .collection('confessions')
        .doc(confessionId)
        .collection('comments')
        .add(commentData)

      // Increment comment counter on parent
      await db.collection('confessions').doc(confessionId).update({
        comments: admin.firestore.FieldValue.increment(1),
      })

      return NextResponse.json({ id: commentRef.id, ...commentData, hasLiked: false })
    }

    // ── Create a new confession ───────────────────────────────────────────
    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const newConfession = {
      text,
      author: author || 'Anonymous Student',
      color: color || '#5B9CF6',
      likes: 0,
      comments: 0,
      reposts: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: authResult.uid,
      likedBy: [],
      repostedBy: [],
    }

    const docRef = await db.collection('confessions').add(newConfession)

    return NextResponse.json({
      id: docRef.id,
      ...newConfession,
      hasLiked: false,
      hasReposted: false,
    })
  } catch (error) {
    console.error('Error posting confession:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const authResult = await verifyAuth(req)
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await req.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: 'ID and action are required' }, { status: 400 })
    }

    const docRef = db.collection('confessions').doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: 'Confession not found' }, { status: 404 })
    }

    const data = doc.data()!
    const uid = authResult.uid

    if (action === 'like') {
      const likedBy = data.likedBy || []
      if (likedBy.includes(uid)) {
        await docRef.update({
          likes: admin.firestore.FieldValue.increment(-1),
          likedBy: admin.firestore.FieldValue.arrayRemove(uid),
        })
        return NextResponse.json({ success: true, action: 'unliked' })
      } else {
        await docRef.update({
          likes: admin.firestore.FieldValue.increment(1),
          likedBy: admin.firestore.FieldValue.arrayUnion(uid),
        })
        return NextResponse.json({ success: true, action: 'liked' })
      }
    }

    if (action === 'repost') {
      const repostedBy = data.repostedBy || []
      if (repostedBy.includes(uid)) {
        // Already reposted — undo it
        await docRef.update({
          reposts: admin.firestore.FieldValue.increment(-1),
          repostedBy: admin.firestore.FieldValue.arrayRemove(uid),
        })
        return NextResponse.json({ success: true, action: 'un-reposted' })
      } else {
        await docRef.update({
          reposts: admin.firestore.FieldValue.increment(1),
          repostedBy: admin.firestore.FieldValue.arrayUnion(uid),
        })
        return NextResponse.json({ success: true, action: 'reposted' })
      }
    }

    // Fetch comments for a confession
    if (action === 'getComments') {
      const commentsSnap = await docRef.collection('comments').orderBy('createdAt', 'asc').get()
      const comments = commentsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      return NextResponse.json({ success: true, comments })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating confession:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
