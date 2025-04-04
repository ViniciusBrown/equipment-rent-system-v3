"use server"

import { revalidatePath } from "next/cache"
import { supabase, type RentalRequest } from "@/lib/supabase"

export async function submitRentalRequest(formData: FormData) {
  try {
    // Extract data from the form
    const id = formData.get("id") as string | null
    const fullName = formData.get("fullName") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const rentalStart = formData.get("rentalStart") as string
    const rentalEnd = formData.get("rentalEnd") as string

    const specialRequirements = formData.get("specialRequirements") as string
    const estimatedCost = Number.parseFloat(formData.get("estimatedCost") as string)

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

    // Create the rental request object
    const rentalRequest: RentalRequest = {
      full_name: fullName,
      email,
      phone,
      equipment_items: equipmentItems,
      rental_start: rentalStart,
      rental_end: rentalEnd,
      special_requirements: specialRequirements || undefined,
      estimated_cost: estimatedCost,
      status: "pending",
      reference_number: referenceNumber,
    }

    // If we have an ID, this is an update
    if (id) {
      rentalRequest.id = id
    }

    // Store ID documents if provided
    const idDocuments = formData.getAll("idDocuments") as File[]
    const documentUrls: string[] = []

    if (idDocuments && idDocuments.length > 0) {
      for (const document of idDocuments) {
        // Convert file to array buffer
        const arrayBuffer = await document.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        // Upload to Supabase Storage
        const fileName = `${referenceNumber}/${document.name}`
        const { data, error } = await supabase.storage.from("id-documents").upload(fileName, buffer, {
          contentType: document.type,
          upsert: false,
        })

        if (error) {
          console.error("Error uploading document:", error)
          throw new Error("Failed to upload ID document")
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from("id-documents").getPublicUrl(fileName)

        documentUrls.push(urlData.publicUrl)
      }
    }

    // Add document URLs if any were uploaded
    if (documentUrls.length > 0) {
      rentalRequest.document_urls = documentUrls
    }

    // Use upsert instead of insert
    const { data, error } = await supabase
      .from("rental_requests")
      .upsert({
        ...rentalRequest,
      })
      .select()

    if (error) {
      console.error("Error upserting rental request:", error)
      throw new Error("Failed to submit rental request")
    }

    // Revalidate the equipment page to reflect any availability changes
    revalidatePath("/equipment")
    revalidatePath("/rent-orders")

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
    // Fetch movie making equipment
    const { data, error } = await supabase.from("equipments").select("*")

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
    const { data, error } = await supabase
      .from("rental_requests")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching rental requests:", error)
      throw error
    }

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
