import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Only apply to /admin and its subpaths
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Exclude the login page
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Check for the secure session cookie
    const adminSession = request.cookies.get('mindstep_admin_session')

    // If no valid session, redirect to login
    if (!adminSession || adminSession.value !== 'authenticated') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
