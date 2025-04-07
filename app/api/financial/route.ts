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
        { error: 'Unauthorized: You must be logged in to update financial information' },
        { status: 401 }
      )
    }

    // Check if user has the required role
    const userRole = session.user.user_metadata?.role || 'client'
    const allowedRoles = ['financial_inspector', 'manager']

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update financial information' },
        { status: 403 }
      )
    }

    // Parse the request body
    const requestData = await request.json()

    // Validate required fields
    if (!requestData.rental_request_id) {
      return NextResponse.json(
        { error: 'Bad Request: Missing rental_request_id' },
        { status: 400 }
      )
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

    // Update the rental request
    const { error } = await supabase
      .from('rental_requests')
      .update(updateData)
      .eq('id', requestData.rental_request_id)

    if (error) {
      console.error('Error updating financial information:', error)
      return NextResponse.json(
        { error: 'Failed to update financial information' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Financial information updated successfully',
    })
  } catch (error) {
    console.error('Error in financial API:', error)
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
        { error: 'Unauthorized: You must be logged in to view financial information' },
        { status: 401 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const rentalRequestId = searchParams.get('rental_request_id')

    if (!rentalRequestId) {
      return NextResponse.json(
        { error: 'Bad Request: Missing rental_request_id parameter' },
        { status: 400 }
      )
    }

    // Check user role for access control
    const userRole = session.user.user_metadata?.role || 'client'

    // Define which fields to select based on user role
    let selectFields: string

    if (userRole === 'client') {
      // Clients can only see basic financial information
      selectFields = 'id, reference_number, estimated_cost, status, payment_status'

      // Check if the client owns this rental request
      const { data: rentalRequest, error } = await supabase
        .from('rental_requests')
        .select('user_id')
        .eq('id', rentalRequestId)
        .single()

      if (error || !rentalRequest || rentalRequest.user_id !== session.user.id) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to view financial information for this rental request' },
          { status: 403 }
        )
      }
    } else if (['financial_inspector', 'manager'].includes(userRole)) {
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
      return NextResponse.json(
        { error: 'Failed to fetch financial information' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in financial API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
