import { EquipmentInspection } from '@/lib/supabase/database.types'
import {
  createProtectedApiHandler,
  badRequestResponse,
  successResponse,
  serverErrorResponse,
  forbiddenResponse
} from '@/utils/api'

// Export dynamic config to prevent static optimization
export const dynamic = 'force-dynamic'

export const POST = createProtectedApiHandler({
  requiredRoles: ['equipment_inspector', 'manager'],
  authMessage: 'You must be logged in to submit an inspection',
  roleMessage: 'You do not have permission to submit inspections',
  handler: async (request, user, supabase, role) => {
    try {
      // Parse the request body
      const requestData = await request.json()

      // Validate required fields
      if (!requestData.rental_request_id || !requestData.equipment_id || !requestData.inspection_type) {
        return badRequestResponse('Missing required fields')
      }

      // Create the inspection object
      const inspection: Partial<EquipmentInspection> = {
        rental_request_id: requestData.rental_request_id,
        equipment_id: requestData.equipment_id,
        inspection_type: requestData.inspection_type,
        inspection_date: requestData.inspection_date || new Date().toISOString(),
        inspector_id: user.id,
        notes: requestData.notes,
        image_urls: requestData.image_urls || [],
      }

      // Insert the inspection into the database
      const { data, error } = await supabase
        .from('equipment_inspections')
        .insert(inspection)
        .select()

      if (error) {
        console.error('Error submitting inspection:', error)
        return serverErrorResponse('Failed to submit inspection')
      }

      // Update the rental request status based on the inspection type
      if (requestData.inspection_type === 'initial') {
        await supabase
          .from('rental_requests')
          .update({ initial_inspection_status: 'completed' })
          .eq('id', requestData.rental_request_id)
      } else if (requestData.inspection_type === 'final') {
        await supabase
          .from('rental_requests')
          .update({ final_inspection_status: 'completed' })
          .eq('id', requestData.rental_request_id)
      }

      return successResponse({ data }, 'Inspection submitted successfully')
    } catch (error) {
      console.error('Error in inspection API:', error)
      return serverErrorResponse()
    }
  }
})

export const GET = createProtectedApiHandler({
  requiredRoles: ['client', 'equipment_inspector', 'manager'],
  authMessage: 'You must be logged in to view inspections',
  handler: async (request, user, supabase, role) => {
    try {
      // Get query parameters
      const searchParams = request.nextUrl.searchParams
      const rentalRequestId = searchParams.get('rental_request_id')
      const inspectionType = searchParams.get('inspection_type')

      // Build the query
      let query = supabase.from('equipment_inspections').select('*')

      // Add filters if provided
      if (rentalRequestId) {
        query = query.eq('rental_request_id', rentalRequestId)
      }

      if (inspectionType) {
        query = query.eq('inspection_type', inspectionType)
      }

      // If user is a client, only show inspections for their rental requests
      if (role === 'client') {
        // First, get the client's rental requests
        const { data: clientRequests } = await supabase
          .from('rental_requests')
          .select('id')
          .eq('user_id', user.id)

        if (!clientRequests || clientRequests.length === 0) {
          return successResponse({ data: [] })
        }

        // Then filter inspections to only those related to the client's requests
        const clientRequestIds = clientRequests.map((req: { id: string }) => req.id)
        query = query.in('rental_request_id', clientRequestIds)
      }

      // Execute the query
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching inspections:', error)
        return serverErrorResponse('Failed to fetch inspections')
      }

      return successResponse({ data })
    } catch (error) {
      console.error('Error in inspection API:', error)
      return serverErrorResponse()
    }
  }
})
