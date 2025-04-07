import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession()

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to generate contracts' },
        { status: 401 }
      )
    }

    // Check if user has the required role (only managers can generate contracts)
    const userRole = session.user.user_metadata?.role || 'client'

    if (userRole !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden: Only managers can generate contracts' },
        { status: 403 }
      )
    }

    // Parse the request body
    const requestData = await request.json()
    const rentalRequestId = requestData.rental_request_id

    // Validate required fields
    if (!rentalRequestId) {
      return NextResponse.json(
        { error: 'Bad Request: Missing rental_request_id' },
        { status: 400 }
      )
    }

    // Get the rental request data
    const { data: rentalRequest, error: fetchError } = await supabase
      .from('rental_requests')
      .select('*')
      .eq('id', rentalRequestId)
      .single()

    if (fetchError || !rentalRequest) {
      console.error('Error fetching rental request:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch rental request data' },
        { status: 500 }
      )
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
      return NextResponse.json(
        { error: 'Failed to update rental request with contract URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contractUrl,
      message: 'Contract generated successfully',
    })
  } catch (error) {
    console.error('Error in contract generation API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession()

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to update contract status' },
        { status: 401 }
      )
    }

    // Parse the request body
    const requestData = await request.json()
    const rentalRequestId = requestData.rental_request_id
    const contractStatus = requestData.contract_status

    // Validate required fields
    if (!rentalRequestId || !contractStatus) {
      return NextResponse.json(
        { error: 'Bad Request: Missing required fields' },
        { status: 400 }
      )
    }

    // Validate contract status
    if (!['pending', 'generated', 'signed'].includes(contractStatus)) {
      return NextResponse.json(
        { error: 'Bad Request: Invalid contract status' },
        { status: 400 }
      )
    }

    // Check user role for access control
    const userRole = session.user.user_metadata?.role || 'client'

    // Only managers can update contract status
    if (userRole !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden: Only managers can update contract status' },
        { status: 403 }
      )
    }

    // Update the rental request with the new contract status
    const { error } = await supabase
      .from('rental_requests')
      .update({ contract_status: contractStatus })
      .eq('id', rentalRequestId)

    if (error) {
      console.error('Error updating contract status:', error)
      return NextResponse.json(
        { error: 'Failed to update contract status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contract status updated successfully',
    })
  } catch (error) {
    console.error('Error in contract status API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
