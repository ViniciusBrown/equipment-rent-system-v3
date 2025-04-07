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
    const cookieStore = cookies()
    const serverSupabase = createServerComponentClient({ cookies: () => cookieStore })

    // Get the current user session from the server context
    const { data: { session } } = await serverSupabase.auth.getSession()
    const userId = session?.user?.id

    // Extract workflow status fields
    const paymentStatus = formData.get("paymentStatus") as "pending" | "completed" || "pending"
    const contractStatus = formData.get("contractStatus") as "pending" | "generated" | "signed" || "pending"
    const initialInspectionStatus = formData.get("initialInspectionStatus") as "pending" | "completed" || "pending"
    const finalInspectionStatus = formData.get("finalInspectionStatus") as "pending" | "completed" || "pending"

    // Extract financial fields
    const paymentAmount = formData.get("paymentAmount") ? Number.parseFloat(formData.get("paymentAmount") as string) : undefined
    const paymentDate = formData.get("paymentDate") as string || undefined
    const paymentNotes = formData.get("paymentNotes") as string || undefined

    // Extract inspection fields
    const initialInspectionNotes = formData.get("initialInspectionNotes") as string || undefined
    const initialInspectionDate = formData.get("initialInspectionDate") as string || undefined
    const finalInspectionNotes = formData.get("finalInspectionNotes") as string || undefined
    const finalInspectionDate = formData.get("finalInspectionDate") as string || undefined

    // Extract contract fields
    const contractNotes = formData.get("contractNotes") as string || undefined
    const contractGeneratedUrl = formData.get("contractGeneratedUrl") as string || undefined

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

      // Add workflow status fields
      payment_status: paymentStatus,
      contract_status: contractStatus,
      initial_inspection_status: initialInspectionStatus,
      final_inspection_status: finalInspectionStatus,

      // Add financial fields
      payment_amount: paymentAmount,
      payment_date: paymentDate,
      payment_notes: paymentNotes,

      // Add inspection fields
      initial_inspection_notes: initialInspectionNotes,
      initial_inspection_date: initialInspectionDate,
      final_inspection_notes: finalInspectionNotes,
      final_inspection_date: finalInspectionDate,

      // Add contract fields
      contract_notes: contractNotes,
      contract_generated_url: contractGeneratedUrl,
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

    // Helper function to upload files to a specific folder
    async function uploadFiles(files: File[], folder: string): Promise<string[]> {
      const urls: string[] = []

      if (files && files.length > 0) {
        for (const file of files) {
          // Convert file to array buffer
          const arrayBuffer = await file.arrayBuffer()
          const buffer = new Uint8Array(arrayBuffer)

          // Create a unique filename to avoid collisions
          const timestamp = new Date().getTime()
          const fileName = `${referenceNumber}/${folder}/${timestamp}_${file.name}`

          // Upload to Supabase Storage using server client
          const { error } = await serverSupabase.storage.from("rental-files").upload(fileName, buffer, {
            contentType: file.type,
            upsert: true, // Allow overwriting files with the same name
          })

          if (error) {
            console.error(`Error uploading ${folder} file:`, error)
            throw new Error(`Failed to upload ${folder} file`)
          }

          // Get public URL using server client
          const { data: urlData } = serverSupabase.storage.from("rental-files").getPublicUrl(fileName)

          urls.push(urlData.publicUrl)
        }
      }

      return urls
    }

    // Upload ID documents
    const idDocuments = formData.getAll("documents") as File[]
    const documentUrls = await uploadFiles(idDocuments, "documents")

    // Upload payment proof files
    const paymentProofFiles = formData.getAll("paymentProof") as File[]
    const paymentProofUrls = await uploadFiles(paymentProofFiles, "payment-proof")

    // Upload initial inspection images
    const initialInspectionImages = formData.getAll("initialInspectionImages") as File[]
    const initialInspectionImageUrls = await uploadFiles(initialInspectionImages, "initial-inspection")

    // Upload final inspection images
    const finalInspectionImages = formData.getAll("finalInspectionImages") as File[]
    const finalInspectionImageUrls = await uploadFiles(finalInspectionImages, "final-inspection")

    // Upload contract documents
    const contractDocuments = formData.getAll("contractDocuments") as File[]
    const contractDocumentUrls = await uploadFiles(contractDocuments, "contracts")

    // Add document URLs to the rental request object
    if (documentUrls.length > 0) {
      rentalRequest.document_urls = documentUrls
    }

    if (paymentProofUrls.length > 0) {
      rentalRequest.payment_proof_urls = paymentProofUrls
    }

    if (initialInspectionImageUrls.length > 0) {
      rentalRequest.initial_inspection_image_urls = initialInspectionImageUrls
    }

    if (finalInspectionImageUrls.length > 0) {
      rentalRequest.final_inspection_image_urls = finalInspectionImageUrls
    }

    if (contractDocumentUrls.length > 0) {
      rentalRequest.contract_document_urls = contractDocumentUrls
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
    const cookieStore = cookies()
    const serverSupabase = createServerComponentClient({ cookies: () => cookieStore })

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
    const cookieStore = cookies()
    const serverSupabase = createServerComponentClient({ cookies: () => cookieStore })

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
