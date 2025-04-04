import { createClient } from "@supabase/supabase-js"

// Define types for our database tables
export type Equipment = {
  id: string
  name: string
  category: string
  daily_rate: number
  description?: string
  available: boolean
  image_url?: string
  created_at?: string
}

export type EquipmentItem = {
  id: string
  name: string
  daily_rate: number
  quantity: number
}

export type RentalRequest = {
  id?: string
  full_name: string
  email: string
  phone: string
  equipment_items: EquipmentItem[]
  rental_start: string
  rental_end: string
  special_requirements?: string
  estimated_cost: number
  status: "pending" | "approved" | "rejected" | "completed"
  reference_number: string
  document_urls?: string[]
  created_at?: string
}

// Create a single supabase client for the entire app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
