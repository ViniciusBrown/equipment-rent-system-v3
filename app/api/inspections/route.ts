import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { EquipmentInspection } from '@/lib/supabase/database.types'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession()

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to submit an inspection' },
        { status: 401 }
      )
    }

    // Check if user has the required role
    const userRole = session.user.user_metadata?.role || 'client'
    const allowedRoles = ['equipment_inspector', 'manager']

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to submit inspections' },
        { status: 403 }
      )
    }

    // Parse the request body
    const requestData = await request.json()

    // Validate required fields
    if (!requestData.rental_request_id || !requestData.equipment_id || !requestData.inspection_type) {
      return NextResponse.json(
        { error: 'Bad Request: Missing required fields' },
        { status: 400 }
      )
    }

    // Create the inspection object
    const inspection: Partial<EquipmentInspection> = {
      rental_request_id: requestData.rental_request_id,
      equipment_id: requestData.equipment_id,
      inspection_type: requestData.inspection_type,
      inspection_date: requestData.inspection_date || new Date().toISOString(),
      inspector_id: session.user.id,
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
      return NextResponse.json(
        { error: 'Failed to submit inspection' },
        { status: 500 }
      )
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

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in inspection API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession()

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to view inspections' },
        { status: 401 }
      )
    }

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

    // Check user role for access control
    const userRole = session.user.user_metadata?.role || 'client'

    // If user is a client, only show inspections for their rental requests
    if (userRole === 'client') {
      // First, get the client's rental requests
      const { data: clientRequests } = await supabase
        .from('rental_requests')
        .select('id')
        .eq('user_id', session.user.id)

      if (!clientRequests || clientRequests.length === 0) {
        return NextResponse.json({ data: [] })
      }

      // Then filter inspections to only those related to the client's requests
      const clientRequestIds = clientRequests.map(req => req.id)
      query = query.in('rental_request_id', clientRequestIds)
    }

    // Execute the query
    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching inspections:', error)
      return NextResponse.json(
        { error: 'Failed to fetch inspections' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in inspection API:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
