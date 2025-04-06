import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UserRole } from './lib/auth'

// Define role-based route access
const routeAccess: Record<string, UserRole[]> = {
  '/': ['client', 'equipment_inspector', 'financial_inspector', 'manager'],
  '/profile': ['client', 'equipment_inspector', 'financial_inspector', 'manager'],
  '/my-orders': ['client', 'equipment_inspector', 'financial_inspector', 'manager'],
  '/admin': ['manager'],
  '/inspections': ['equipment_inspector', 'financial_inspector', 'manager'],
  '/financial': ['financial_inspector', 'manager'],
}

// This middleware is used to refresh the user's session and protect routes
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if expired
  await supabase.auth.getSession()

  // Get the pathname from the URL
  const { pathname } = req.nextUrl

  // Check if the route requires authentication
  const authRoutes = Object.keys(routeAccess)
  const isAuthRoute = authRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route)))

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If the route requires authentication and the user is not authenticated, redirect to login
  if (isAuthRoute && !session) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check if the user has the required role for the route
  if (session && isAuthRoute) {
    const userRole = session.user?.user_metadata?.role as UserRole || 'client'

    // Find the route that matches the current pathname
    const matchedRoute = Object.entries(routeAccess).find(([route, _]) =>
      pathname === route || (route !== '/' && pathname.startsWith(route))
    )

    if (matchedRoute) {
      const [_, allowedRoles] = matchedRoute

      // If the user doesn't have the required role, redirect to unauthorized page
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }
  }

  // If the user is authenticated and trying to access login or signup, redirect to home
  if (session && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

// Specify which routes this middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
