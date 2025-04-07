import {
  dynamicConfig,
  createProtectedApiHandler,
  badRequestResponse,
  successResponse,
  serverErrorResponse,
  forbiddenResponse
} from '@/utils/api'

// Export dynamic config to prevent static optimization
export const dynamic = dynamicConfig.dynamic

export const POST = createProtectedApiHandler({
  requiredRoles: ['financial_inspector', 'manager'],
  authMessage: 'You must be logged in to update financial information',
  roleMessage: 'You do not have permission to update financial information',
  handler: async (request, user, supabase, role) => {
    try {
      // Parse the request body
      const requestData = await request.json()

      // Validate required fields
      if (!requestData.rental_request_id) {
        return badRequestResponse('Missing rental_request_id')
      }

      // Create the update object
      const updateData: Record<string, any> = {}

      // Add fields if they exist in the request
      if (requestData.payment_status) {
        updateData.payment_status = requestData.payment_status
      }

      if (requestData.payment_amount !== undefined) {
        updateData.payment_amount = requestData.payment_amount
      }

      if (requestData.payment_date) {
        updateData.payment_date = requestData.payment_date
      }

      if (requestData.payment_notes) {
        updateData.payment_notes = requestData.payment_notes
      }

      if (requestData.estimated_cost !== undefined) {
        updateData.estimated_cost = requestData.estimated_cost
      }

      if (requestData.status) {
        updateData.status = requestData.status
      }

      // Check if there are any fields to update
      if (Object.keys(updateData).length === 0) {
        return badRequestResponse('No fields to update')
      }

      // Update the rental request
      const { error } = await supabase
        .from('rental_requests')
        .update(updateData)
        .eq('id', requestData.rental_request_id)

      if (error) {
        console.error('Error updating financial information:', error)
        return serverErrorResponse('Failed to update financial information')
      }

      return successResponse(
        {},
        'Financial information updated successfully'
      )
    } catch (error) {
      console.error('Error in financial API:', error)
      return serverErrorResponse()
    }
  }
})

export const GET = createProtectedApiHandler({
  requiredRoles: ['client', 'equipment_inspector', 'financial_inspector', 'manager'],
  authMessage: 'You must be logged in to view financial information',
  handler: async (request, user, supabase, role) => {
    try {
      // Get query parameters
      const searchParams = request.nextUrl.searchParams
      const rentalRequestId = searchParams.get('rental_request_id')

      if (!rentalRequestId) {
        return badRequestResponse('Missing rental_request_id parameter')
      }

      // Define which fields to select based on user role
      let selectFields: string

      if (role === 'client') {
        // Clients can only see basic financial information
        selectFields = 'id, reference_number, estimated_cost, status, payment_status'

        // Check if the client owns this rental request
        const { data: rentalRequest, error } = await supabase
          .from('rental_requests')
          .select('user_id')
          .eq('id', rentalRequestId)
          .single()

        if (error || !rentalRequest || rentalRequest.user_id !== user.id) {
          return forbiddenResponse('You do not have permission to view financial information for this rental request')
        }
      } else if (['financial_inspector', 'manager'].includes(role)) {
        // Financial inspectors and managers can see all financial information
        selectFields = 'id, reference_number, estimated_cost, status, payment_status, payment_amount, payment_date, payment_notes, payment_proof_urls'
      } else {
        // Equipment inspectors can see basic financial information
        selectFields = 'id, reference_number, estimated_cost, status, payment_status'
      }

      // Fetch the financial information
      const { data, error } = await supabase
        .from('rental_requests')
        .select(selectFields)
        .eq('id', rentalRequestId)
        .single()

      if (error) {
        console.error('Error fetching financial information:', error)
        return serverErrorResponse('Failed to fetch financial information')
      }

      return successResponse({ data })
    } catch (error) {
      console.error('Error in financial API:', error)
      return serverErrorResponse()
    }
  }
})
