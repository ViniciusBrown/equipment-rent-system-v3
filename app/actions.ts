"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase, type RentalRequest } from "@/lib/supabase"

export async function submitRentalRequest(formData: FormData) {
  try {
    console.log('Server action received form data')

    // Log all form data entries for debugging
    console.log('Form data entries:')
    for (const [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`)
    }

    // Extract data from the form
    const idStr = formData.get("id") as string | null
    const id = idStr ? Number(idStr) : null
    const fullName = formData.get("fullName") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const rentalStart = formData.get("rentalStart") as string
    const rentalEnd = formData.get("rentalEnd") as string

    const specialRequirements = formData.get("specialRequirements") as string
    const estimatedCost = Number.parseFloat(formData.get("estimatedCost") as string)
    const status = formData.get("status") as "pending" | "approved" | "rejected" | "completed" || "pending"

    // Generate a reference number for new requests
    const referenceNumber = id
      ? (formData.get("referenceNumber") as string)
      : `RNT-${Math.floor(100000 + Math.random() * 900000)}`

    // Extract equipment items
    const equipmentItems: Array<{
      id: string
      name: string
      daily_rate: number
      quantity: number
    }> = []

    // Parse equipment items from form data
    const formEntries = Array.from(formData.entries())
    const equipmentRegex = /equipmentItems\[(\d+)\]\[(\w+)\]/

    formEntries.forEach(([key, value]) => {
      const match = key.match(equipmentRegex)
      if (match) {
        const index = Number.parseInt(match[1])
        const property = match[2]

        if (!equipmentItems[index]) {
          equipmentItems[index] = { id: "", name: "", daily_rate: 0, quantity: 1 }
        }

        if (property === "id") {
          equipmentItems[index].id = value as string
        } else if (property === "name") {
          equipmentItems[index].name = value as string
        } else if (property === "daily_rate") {
          equipmentItems[index].daily_rate = Number.parseFloat(value as string)
        } else if (property === "quantity") {
          equipmentItems[index].quantity = Number.parseInt(value as string)
        }
      }
    })

    // Create a Supabase client with the server context
    const serverSupabase = createServerComponentClient({ cookies })

    // Get the current user session from the server context
    const { data: { session } } = await serverSupabase.auth.getSession()
    const userId = session?.user?.id

    // Create the rental request object
    const rentalRequest: any = {
      full_name: fullName,
      email,
      phone,
      equipment_items: equipmentItems,
      rental_start: rentalStart,
      rental_end: rentalEnd,
      special_requirements: specialRequirements || undefined,
      estimated_cost: estimatedCost,
      status: status,
      reference_number: referenceNumber,
      user_id: userId,
    }

    // Log the rental request for debugging
    console.log('Created rental request object with user_id:', userId)

    // If we have an ID, this is an update
    if (id) {
      console.log(`This is an update operation for ID: ${id}`)
      // For update operations, we need to use the .update() method instead of upsert
      // This is because upsert might be trying to create a new record instead of updating
      console.log(`ID is already a number: ${id}`)
      rentalRequest.id = id
    } else {
      console.log('This is a new record creation')
    }

    // Store ID documents if provided
    const idDocuments = formData.getAll("idDocuments") as File[]
    const documentUrls: string[] = []

    if (idDocuments && idDocuments.length > 0) {
      for (const document of idDocuments) {
        // Convert file to array buffer
        const arrayBuffer = await document.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        // Upload to Supabase Storage using server client
        const fileName = `${referenceNumber}/${document.name}`
        const { error } = await serverSupabase.storage.from("id-documents").upload(fileName, buffer, {
          contentType: document.type,
          upsert: false,
        })

        if (error) {
          console.error("Error uploading document:", error)
          throw new Error("Failed to upload ID document")
        }

        // Get public URL using server client
        const { data: urlData } = serverSupabase.storage.from("id-documents").getPublicUrl(fileName)

        documentUrls.push(urlData.publicUrl)
      }
    }

    // Add document URLs if any were uploaded
    if (documentUrls.length > 0) {
      rentalRequest.document_urls = documentUrls
    }

    // Log the request for debugging
    console.log('Processing rental request:', JSON.stringify(rentalRequest, null, 2))

    let error;

    // Use different methods for insert vs update
    if (id) {
      // For updates, use the update method with a where clause using server client
      const { error: updateError } = await serverSupabase
        .from("rental_requests")
        .update({
          ...rentalRequest,
        })
        .eq('id', Number(id))

      error = updateError;
      console.log('Update response:', error ? `Error: ${error.message}` : 'Success')
    } else {
      // For new records, use insert with server client
      const { error: insertError } = await serverSupabase
        .from("rental_requests")
        .insert({
          ...rentalRequest,
        })

      error = insertError;
      console.log('Insert response:', error ? `Error: ${error.message}` : 'Success')
    }

    if (error) {
      console.error("Error processing rental request:", error)
      throw new Error("Failed to submit rental request")
    }

    // Revalidate the equipment page to reflect any availability changes
    revalidatePath("/equipment")
    revalidatePath("/rent-orders")
    revalidatePath("/")

    return {
      success: true,
      referenceNumber,
      estimatedCost,
    }
  } catch (error) {
    console.error("Error in submitRentalRequest:", error)
    return {
      success: false,
      error: "Failed to submit rental request. Please try again.",
    }
  }
}

export async function fetchEquipments() {
  try {
    // Create a Supabase client with the server context
    const serverSupabase = createServerComponentClient({ cookies })

    // Fetch movie making equipment using server client
    const { data, error } = await serverSupabase.from("equipments").select("*")

    if (error) {
      throw error
    }
    return data
  } catch (error) {
    console.error("Error fetching film equipment:", error)
    return []
  }
}


export async function getEquipmentByCategory(category: string) {
  try {
    // Fetch movie making equipment from the specified category
    const { data, error } = await supabase.from("equipments").select("*").eq("category", category).eq("available", true)

    if (error) {
      throw error
    }

    return data
  } catch (error) {
    console.error("Error fetching film equipment:", error)
    return []
  }
}

export async function fetchRentalRequests(): Promise<RentalRequest[]> {
  try {
    // Create a Supabase client with the server context
    const serverSupabase = createServerComponentClient({ cookies })

    // Get the current user session from the server context
    const { data: { session } } = await serverSupabase.auth.getSession()

    // Log session information for debugging
    console.log('Server session user:', session?.user ? {
      id: session.user.id,
      email: session.user.email,
      role: session.user.user_metadata?.role,
      metadata: session.user.user_metadata
    } : 'No session')

    // Default query - use the server supabase client
    let query = serverSupabase
      .from("rental_requests")
      .select("*")

    // If user is logged in, check their role
    if (session?.user) {
      // Get role from user metadata - log all possible locations
      console.log('User metadata:', session.user.user_metadata)
      console.log('App metadata:', session.user.app_metadata)

      // Try different ways to get the role
      const metadataRole = session.user.user_metadata?.role
      const appMetadataRole = session.user.app_metadata?.role

      // Use the first available role or default to client
      const userRole = metadataRole || appMetadataRole || 'client'
      const userId = session.user.id

      console.log('Determined user role:', userRole)

      // If user is a client, only show their own requests
      if (userRole === 'client') {
        console.log('Filtering for client role')
        // Filter by user_id if available, otherwise fall back to email
        if (userId) {
          query = query.eq('user_id', userId)
        } else {
          query = query.eq('email', session.user.email)
        }
      } else {
        console.log('Not filtering - showing all requests for role:', userRole)
      }
      // For other roles (equipment_inspector, financial_inspector, manager),
      // show all requests as they have broader access
    }

    // Execute the query with ordering
    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching rental requests:", error)
      throw error
    }

    console.log(`Found ${data?.length || 0} rental requests`)

    // Ensure equipment_items is always an array, even if null in DB
    return data.map(req => ({
      ...req,
      equipment_items: req.equipment_items ?? []
    })) as RentalRequest[]

  } catch (error) {
    console.error("Error in fetchRentalRequests:", error)
    return []
  }
}
