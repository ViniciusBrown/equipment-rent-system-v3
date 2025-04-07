'use server'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['client', 'equipment_inspector', 'financial_inspector', 'manager']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createClient()

    // Check if the current user is a manager
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const currentUserRole = session.user.user_metadata?.role || 'client'

    if (currentUserRole !== 'manager') {
      return NextResponse.json(
        { error: 'Only managers can update user roles' },
        { status: 403 }
      )
    }

    // Call the database function to update the user role
    const { data, error } = await supabase.rpc('update_user_role', {
      user_id: userId,
      new_role: role
    })

    if (error) {
      console.error('Error updating user role:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in update role API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
