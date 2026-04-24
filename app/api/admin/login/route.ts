import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables')
      return Response.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    if (email === adminEmail && password === adminPassword) {
      // Set secure HTTP-only cookie
      const cookieStore = await cookies()
      cookieStore.set({
        name: 'mindstep_admin_session',
        value: 'authenticated',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })

      return Response.json({ success: true })
    } else {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }
  } catch (error: any) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
