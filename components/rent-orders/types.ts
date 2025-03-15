import type { RentalRequest } from "@/lib/supabase/database.types"

// Define the status type
export type Status = "pending" | "success" | "warning"

// Define the rent order type for the table display
export type RentOrder = {
  id: string
  reference: string
  customer: string
  date: string
  amount: number
  payment_ready: Status
  document_emitted: Status
  initial_inspection: Status
  rented: Status
  returned_equipment: Status
  final_inspection: Status
  // Additional fields from the original rental request
  originalData: RentalRequest
}
