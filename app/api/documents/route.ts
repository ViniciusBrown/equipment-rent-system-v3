import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession()

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to upload documents' },
        { status: 401 }
      )
    }

    // Get form data with files
    const formData = await request.formData()
    const rentalRequestId = formData.get('rental_request_id') as string
    const documentType = formData.get('document_type') as string
    const files = formData.getAll('files') as File[]

    // Validate required fields
    if (!rentalRequestId || !documentType || !files.length) {
      return NextResponse.json(
        { error: 'Bad Request: Missing required fields' },
        { status: 400 }
      )
    }

    // Check user role for access control
    const userRole = session.user.user_metadata?.role || 'client'

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
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to upload this document type' },
        { status: 403 }
      )
    }

    // If user is a client, check if they own the rental request
    if (userRole === 'client') {
      const { data: rentalRequest, error } = await supabase
        .from('rental_requests')
        .select('user_id')
        .eq('id', rentalRequestId)
        .single()

      if (error || !rentalRequest || rentalRequest.user_id !== session.user.id) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to upload documents for this rental request' },
          { status: 403 }
        )
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
        return NextResponse.json(
          { error: 'Failed to upload file' },
          { status: 500 }
        )
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
      return NextResponse.json(
        { error: 'Failed to update rental request with document URLs' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
    })
  } catch (error) {
    console.error('Error in document upload API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession()

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to view documents' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const rentalRequestId = searchParams.get('rental_request_id')
    const documentType = searchParams.get('document_type')

    if (!rentalRequestId) {
      return NextResponse.json(
        { error: 'Bad Request: Missing rental_request_id parameter' },
        { status: 400 }
      )
    }

    // Check user role for access control
    const userRole = session.user.user_metadata?.role || 'client'

    // If user is a client, check if they own the rental request
    if (userRole === 'client') {
      const { data: rentalRequest, error } = await supabase
        .from('rental_requests')
        .select('user_id')
        .eq('id', rentalRequestId)
        .single()

      if (error || !rentalRequest || rentalRequest.user_id !== session.user.id) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to view documents for this rental request' },
          { status: 403 }
        )
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
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in document API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
