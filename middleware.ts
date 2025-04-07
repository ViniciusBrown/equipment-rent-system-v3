import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { UserRole } from './lib/auth'
import { updateSession } from './utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'

// Define role-based route access
const routeAccess: Record<string, UserRole[]> = {
  '/': ['client', 'equipment_inspector', 'financial_inspector', 'manager'],
  '/profile': ['client', 'equipment_inspector', 'financial_inspector', 'manager'],
  '/my-orders': ['client', 'equipment_inspector', 'financial_inspector', 'manager'],
  '/admin': ['manager'],
  '/inspections': ['equipment_inspector', 'financial_inspector', 'manager'],
  '/financial': ['financial_inspector', 'manager'],
}

// Debug routes that bypass role checks
const debugRoutes = ['/debug-admin']

// This middleware is used to refresh the user's session and protect routes
export async function middleware(req: NextRequest) {
  // Update the session using our utility function
  const res = await updateSession(req)

  // Get the pathname from the URL
  const { pathname } = req.nextUrl

  // Check if this is a debug route that bypasses role checks
  const isDebugRoute = debugRoutes.some(route => pathname === route || pathname.startsWith(route))

  // Check if the route requires authentication
  const authRoutes = Object.keys(routeAccess)
  const isAuthRoute = authRoutes.some(route => pathname === route || (route !== '/' && pathname.startsWith(route)))

  // Create a Supabase client to check the session
  const cookieStore = req.cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          // This is used for server-side setting only
          // We already handle setting cookies in the middleware
        },
        remove(name: string, options: any) {
          // This is used for server-side setting only
          // We already handle setting cookies in the middleware
        },
      },
    }
  )

  // Get the user (more secure than getSession)
  const { data: { user } } = await supabase.auth.getUser()

  // If the route requires authentication and the user is not authenticated, redirect to login
  if (isAuthRoute && !user) {
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check if the user has the required role for the route
  // Skip role checks for debug routes
  if (user && isAuthRoute && !isDebugRoute) {
    // Get the role from user metadata
    const userRole = (user.user_metadata?.role as UserRole) || 'client'

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
  if (user && (pathname === '/login' || pathname === '/register')) {
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
