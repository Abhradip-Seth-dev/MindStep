import admin from 'firebase-admin'

if (!admin.apps.length) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY

  if (serviceAccountKey) {
    // Decode the base64-encoded service account JSON and use it as credentials
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountKey, 'base64').toString('utf8')
    )
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  } else {
    // Fallback: projectId-only init (requires ADC — works on GCP, not locally)
    console.warn(
      '[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_KEY not set. ' +
      'Admin SDK will fail locally without Application Default Credentials. ' +
      'See README for setup instructions.'
    )
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  }
}

export const auth = admin.auth()
export const db = admin.firestore()

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
