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

  // List of protected student routes
  const protectedStudentRoutes = [
    '/dashboard', '/checkin', '/companion', '/games',
    '/profile', '/history', '/peer', '/heatmap', '/rewards', '/garden'
  ]

  // Check if the current path is a protected student route
  const isStudentRoute = protectedStudentRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isStudentRoute) {
    const studentSession = request.cookies.get('mindstep_auth_token')
    
    // If no valid auth token, redirect to onboarding (login)
    if (!studentSession || !studentSession.value) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/checkin/:path*',
    '/companion/:path*',
    '/games/:path*',
    '/profile/:path*',
    '/history/:path*',
    '/peer/:path*',
    '/heatmap/:path*',
    '/rewards/:path*',
    '/garden/:path*'
  ],
}
