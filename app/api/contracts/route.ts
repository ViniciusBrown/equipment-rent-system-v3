import {
  dynamicConfig,
  createProtectedApiHandler,
  badRequestResponse,
  successResponse,
  serverErrorResponse
} from '@/utils/api'

// Export dynamic config to prevent static optimization
export const dynamic = dynamicConfig.dynamic

export const POST = createProtectedApiHandler({
  requiredRoles: ['manager'],
  authMessage: 'You must be logged in to generate contracts',
  roleMessage: 'Only managers can generate contracts',
  handler: async (request, user, supabase, role) => {
    try {
      // Parse the request body
      const requestData = await request.json()
      const rentalRequestId = requestData.rental_request_id

      // Validate required fields
      if (!rentalRequestId) {
        return badRequestResponse('Missing rental_request_id')
      }

      // Get the rental request data
      const { data: rentalRequest, error: fetchError } = await supabase
        .from('rental_requests')
        .select('*')
        .eq('id', rentalRequestId)
        .single()

      if (fetchError || !rentalRequest) {
        console.error('Error fetching rental request:', fetchError)
        return serverErrorResponse('Failed to fetch rental request data')
      }

      // In a real implementation, this would generate a PDF contract
      // For now, we'll simulate it by creating a contract URL

      // Generate a unique contract filename
      const timestamp = new Date().getTime()
      const contractFileName = `${rentalRequest.reference_number}_contract_${timestamp}.pdf`

      // In a real implementation, this would be the URL to the generated PDF
      // For now, we'll use a placeholder URL
      const contractUrl = `https://example.com/contracts/${contractFileName}`

      // Update the rental request with the contract URL and status
      const { error: updateError } = await supabase
        .from('rental_requests')
        .update({
          contract_generated_url: contractUrl,
          contract_status: 'generated',
        })
        .eq('id', rentalRequestId)

      if (updateError) {
        console.error('Error updating rental request:', updateError)
        return serverErrorResponse('Failed to update rental request with contract URL')
      }

      return successResponse(
        { contractUrl },
        'Contract generated successfully'
      )
    } catch (error) {
      console.error('Error in contract generation API:', error)
      return serverErrorResponse()
    }
  }
})

export const PATCH = createProtectedApiHandler({
  requiredRoles: ['manager'],
  authMessage: 'You must be logged in to update contract status',
  roleMessage: 'Only managers can update contract status',
  handler: async (request, user, supabase, role) => {
    try {
      // Parse the request body
      const requestData = await request.json()
      const rentalRequestId = requestData.rental_request_id
      const contractStatus = requestData.contract_status

      // Validate required fields
      if (!rentalRequestId || !contractStatus) {
        return badRequestResponse('Missing required fields')
      }

      // Validate contract status
      if (!['pending', 'generated', 'signed'].includes(contractStatus)) {
        return badRequestResponse('Invalid contract status')
      }

      // Update the rental request with the new contract status
      const { error } = await supabase
        .from('rental_requests')
        .update({ contract_status: contractStatus })
        .eq('id', rentalRequestId)

      if (error) {
        console.error('Error updating contract status:', error)
        return serverErrorResponse('Failed to update contract status')
      }

      return successResponse(
        {},
        'Contract status updated successfully'
      )
    } catch (error) {
      console.error('Error in contract status API:', error)
      return serverErrorResponse()
    }
  }
})
