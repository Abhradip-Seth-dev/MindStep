import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const { token } = await req.json()
    const cookieStore = cookies()

    if (token) {
      cookieStore.set('mindstep_auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 3600 // 1 hour
      })
    } else {
      cookieStore.delete('mindstep_auth_token')
    }

    return Response.json({ success: true })
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
