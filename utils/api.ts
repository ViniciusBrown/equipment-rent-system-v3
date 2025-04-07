import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { UserRole } from '@/lib/auth'

// Helper to get authenticated user
export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, supabase, role: null }
  }

  // Get role from user metadata
  const metadataRole = user.user_metadata?.role
  const appMetadataRole = user.app_metadata?.role

  // Use the first available role or default to client
  const role = (metadataRole || appMetadataRole || 'client') as UserRole

  return { user, supabase, role }
}

// Helper to check if user has required role
export function hasRequiredRole(userRole: UserRole | null, requiredRoles: UserRole[]) {
  if (!userRole) return false
  return requiredRoles.includes(userRole)
}

// Helper to create unauthorized response
export function unauthorizedResponse(message = 'Unauthorized: You must be logged in to access this resource') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  )
}

// Helper to create forbidden response
export function forbiddenResponse(message = 'Forbidden: You do not have permission to access this resource') {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  )
}

// Helper to create bad request response
export function badRequestResponse(message = 'Bad Request: Missing required parameters') {
  return NextResponse.json(
    { error: message },
    { status: 400 }
  )
}

// Helper to create server error response
export function serverErrorResponse(message = 'Internal Server Error') {
  return NextResponse.json(
    { error: message },
    { status: 500 }
  )
}

// Helper to create success response
export function successResponse(data: any, message = 'Success') {
  return NextResponse.json({
    success: true,
    message,
    ...data
  })
}

// Helper to handle API errors
export function handleApiError(error: any) {
  console.error('API Error:', error)
  return serverErrorResponse()
}

// Helper to create a protected API handler
export function createProtectedApiHandler({
  requiredRoles,
  handler,
  authMessage = 'You must be logged in to access this resource',
  roleMessage = 'You do not have permission to access this resource'
}: {
  requiredRoles: UserRole[],
  handler: (req: NextRequest, user: any, supabase: any, role: UserRole) => Promise<NextResponse>,
  authMessage?: string,
  roleMessage?: string
}) {
  return async (req: NextRequest) => {
    try {
      const { user, supabase, role } = await getAuthenticatedUser()

      // Check if user is authenticated
      if (!user) {
        return unauthorizedResponse(authMessage)
      }

      // Check if user has required role
      if (!hasRequiredRole(role, requiredRoles)) {
        return forbiddenResponse(roleMessage)
      }

      // Call the handler with the authenticated user
      return await handler(req, user, supabase, role)
    } catch (error) {
      return handleApiError(error)
    }
  }
}
