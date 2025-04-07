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
  requiredRoles: ['client', 'manager', 'equipment_inspector', 'financial_inspector'],
  authMessage: 'You must be logged in to upload documents',
  handler: async (request, user, supabase, role) => {
    try {

      // Get form data with files
      const formData = await request.formData()
      const rentalRequestId = formData.get('rental_request_id') as string
      const documentType = formData.get('document_type') as string
      const files = formData.getAll('files') as File[]

      // Validate required fields
      if (!rentalRequestId || !documentType || !files.length) {
        return badRequestResponse('Missing required fields')
      }

      // Define role permissions for different document types
      const rolePermissions: Record<string, string[]> = {
        'client-documents': ['client', 'manager'],
        'payment-proof': ['client', 'financial_inspector', 'manager'],
        'initial-inspection': ['equipment_inspector', 'manager'],
        'final-inspection': ['equipment_inspector', 'manager'],
        'contracts': ['manager'],
      }

      // Check if user has permission to upload this document type
      const allowedRoles = rolePermissions[documentType] || []
      if (!allowedRoles.includes(role)) {
        return forbiddenResponse('You do not have permission to upload this document type')
      }

      // If user is a client, check if they own the rental request
      if (role === 'client') {
        const { data: rentalRequest, error } = await supabase
          .from('rental_requests')
          .select('user_id')
          .eq('id', rentalRequestId)
          .single()

        if (error || !rentalRequest || rentalRequest.user_id !== user.id) {
          return forbiddenResponse('You do not have permission to upload documents for this rental request')
        }
      }

      // Upload files to Supabase Storage
      const uploadedUrls: string[] = []

      for (const file of files) {
        // Convert file to array buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        // Create a unique filename to avoid collisions
        const timestamp = new Date().getTime()
        const fileName = `${rentalRequestId}/${documentType}/${timestamp}_${file.name}`

        // Upload to Supabase Storage
        const { error } = await supabase.storage
          .from('rental-files')
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true,
          })

        if (error) {
          console.error('Error uploading file:', error)
          return serverErrorResponse('Failed to upload file')
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('rental-files')
          .getPublicUrl(fileName)

        uploadedUrls.push(urlData.publicUrl)
      }

      // Update the rental request with the new document URLs
      let updateField: string

      switch (documentType) {
        case 'client-documents':
          updateField = 'document_urls'
          break
        case 'payment-proof':
          updateField = 'payment_proof_urls'
          break
        case 'initial-inspection':
          updateField = 'initial_inspection_image_urls'
          break
        case 'final-inspection':
          updateField = 'final_inspection_image_urls'
          break
        case 'contracts':
          updateField = 'contract_document_urls'
          break
        default:
          updateField = 'document_urls'
      }

      // Get existing URLs
      const { data: existingData } = await supabase
        .from('rental_requests')
        .select(updateField)
        .eq('id', rentalRequestId)
        .single()

      // Combine existing URLs with new ones
      const existingUrls = existingData?.[updateField] || []
      const combinedUrls = [...existingUrls, ...uploadedUrls]

      // Update the rental request
      const { error: updateError } = await supabase
        .from('rental_requests')
        .update({ [updateField]: combinedUrls })
        .eq('id', rentalRequestId)

      if (updateError) {
        console.error('Error updating rental request:', updateError)
        return serverErrorResponse('Failed to update rental request with document URLs')
      }

      return successResponse(
        { urls: uploadedUrls },
        'Documents uploaded successfully'
      )
    } catch (error) {
      console.error('Error in document upload API:', error)
      return serverErrorResponse()
    }
  }
})

export const GET = createProtectedApiHandler({
  requiredRoles: ['client', 'manager', 'equipment_inspector', 'financial_inspector'],
  authMessage: 'You must be logged in to view documents',
  handler: async (request, user, supabase, role) => {
    try {
      // Get query parameters
      const searchParams = request.nextUrl.searchParams
      const rentalRequestId = searchParams.get('rental_request_id')
      const documentType = searchParams.get('document_type')

      if (!rentalRequestId) {
        return badRequestResponse('Missing rental_request_id parameter')
      }

      // If user is a client, check if they own the rental request
      if (role === 'client') {
        const { data: rentalRequest, error } = await supabase
          .from('rental_requests')
          .select('user_id')
          .eq('id', rentalRequestId)
          .single()

        if (error || !rentalRequest || rentalRequest.user_id !== user.id) {
          return forbiddenResponse('You do not have permission to view documents for this rental request')
        }
      }

      // Determine which field to select based on document type
      let selectField: string

      switch (documentType) {
        case 'client-documents':
          selectField = 'document_urls'
          break
        case 'payment-proof':
          selectField = 'payment_proof_urls'
          break
        case 'initial-inspection':
          selectField = 'initial_inspection_image_urls'
          break
        case 'final-inspection':
          selectField = 'final_inspection_image_urls'
          break
        case 'contracts':
          selectField = 'contract_document_urls'
          break
        default:
          // If no specific type is provided, return all document URLs
          selectField = 'document_urls, payment_proof_urls, initial_inspection_image_urls, final_inspection_image_urls, contract_document_urls'
      }

      // Fetch the documents
      const { data, error } = await supabase
        .from('rental_requests')
        .select(selectField)
        .eq('id', rentalRequestId)
        .single()

      if (error) {
        console.error('Error fetching documents:', error)
        return serverErrorResponse('Failed to fetch documents')
      }

      return successResponse({ data })
    } catch (error) {
      console.error('Error in document API:', error)
      return serverErrorResponse()
    }
  }
})
