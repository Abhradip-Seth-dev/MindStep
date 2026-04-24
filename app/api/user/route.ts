import { db } from '@/lib/firebase'
import {
  doc, getDoc, setDoc, updateDoc,
} from 'firebase/firestore'
import { verifyAuth } from '@/lib/firebaseAdmin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const firebaseUid = searchParams.get('firebaseUid')

    if (!firebaseUid) {
      return Response.json({ error: 'firebaseUid required' }, { status: 400 })
    }

    const authResult = await verifyAuth(req, firebaseUid)
    if ('error' in authResult) {
      return Response.json({ error: authResult.error }, { status: 403 })
    }

    const userRef = doc(db, 'users', firebaseUid)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    return Response.json({ id: userSnap.id, ...userSnap.data() })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { firebaseUid, name, email, consentGiven } = body

    if (!firebaseUid) {
      return Response.json({ error: 'firebaseUid required' }, { status: 400 })
    }

    const authResult = await verifyAuth(req, firebaseUid)
    if ('error' in authResult) {
      return Response.json({ error: authResult.error }, { status: 403 })
    }

    const userRef = doc(db, 'users', firebaseUid)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists()) {
      return Response.json({ id: userSnap.id, ...userSnap.data() })
    }

    const userData = {
      firebaseUid,
      name,
      email,
      consentGiven: consentGiven || false,
      notificationTime: '21:00',
      streak: 0,
      uid: '',
      school: '',
      course: '',
      rollNumber: '',
      semester: 0,
      studentType: '',
      hostel: '',
      createdAt: new Date().toISOString(),
    }

    await setDoc(userRef, userData)
    return Response.json({ id: firebaseUid, ...userData }, { status: 201 })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { firebaseUid, ...updates } = body

    if (!firebaseUid) {
      return Response.json({ error: 'firebaseUid required' }, { status: 400 })
    }

    const authResult = await verifyAuth(req, firebaseUid)
    if ('error' in authResult) {
      return Response.json({ error: authResult.error }, { status: 403 })
    }

    const userRef = doc(db, 'users', firebaseUid)
    await updateDoc(userRef, updates)

    const updated = await getDoc(userRef)
    return Response.json({ id: updated.id, ...updated.data() })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}