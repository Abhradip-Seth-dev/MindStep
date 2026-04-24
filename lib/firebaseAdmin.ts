import admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

export const auth = admin.auth()

/**
 * Validates the auth token from cookies and ensures it matches the requested UID.
 * Returns the decoded token if valid, or an error response if invalid.
 */
export async function verifyAuth(req: Request, requestedUid?: string | null): Promise<{ error: string } | { uid: string }> {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const match = cookieHeader.match(/mindstep_auth_token=([^;]+)/)
    const token = match ? match[1] : null

    if (!token) {
      return { error: 'Missing authentication token' }
    }

    const decodedToken = await auth.verifyIdToken(token)

    if (requestedUid && decodedToken.uid !== requestedUid) {
      return { error: 'Forbidden: UID mismatch' }
    }

    return { uid: decodedToken.uid }
  } catch (error) {
    return { error: 'Invalid authentication token' }
  }
}
