import type { RentalRequest } from "@/lib/supabase/database.types"

export type Status = "pending" | "approved" | "rejected" | "completed"

export type RentOrder = {
  id: string
  reference: string
  customer: string
  date: string
  amount: number
  status: Status
  originalData: RentalRequest
}
