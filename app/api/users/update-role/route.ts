import {
  createProtectedApiHandler,
  badRequestResponse,
  successResponse,
  serverErrorResponse
} from '@/utils/api'

// Export dynamic config to prevent static optimization
export const dynamic = 'force-dynamic'

export const POST = createProtectedApiHandler({
  requiredRoles: ['manager'],
  authMessage: 'You must be logged in to update user roles',
  roleMessage: 'Only managers can update user roles',
  handler: async (request, user, supabase, role) => {
    try {
      const { userId, role: newRole } = await request.json()

      if (!userId || !newRole) {
        return badRequestResponse('User ID and role are required')
      }

      // Validate role
      const validRoles = ['client', 'equipment_inspector', 'financial_inspector', 'manager']
      if (!validRoles.includes(newRole)) {
        return badRequestResponse('Invalid role')
      }

      // Call the database function to update the user role
      const { data, error } = await supabase.rpc('update_user_role', {
        user_id: userId,
        new_role: newRole
      })

      if (error) {
        console.error('Error updating user role:', error)
        return serverErrorResponse(error.message)
      }

      return successResponse({ data }, 'User role updated successfully')
    } catch (error) {
      console.error('Error in update role API:', error)
      return serverErrorResponse('Internal server error')
    }
  }
})
