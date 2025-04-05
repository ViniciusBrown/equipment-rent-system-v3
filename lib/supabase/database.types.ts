export type RentalRequest = {
  id?: number | string // Can be number (from DB) or string (from form)
  full_name: string
  email: string
  phone: string
  equipment_items: Array<{
    id: string
    name: string
    daily_rate: number
    quantity: number
  }>
  rental_start: string
  rental_end: string
  special_requirements?: string
  estimated_cost: number
  status: "pending" | "approved" | "rejected" | "completed"
  reference_number: string
  document_urls?: string[]
  created_at?: string
}

export type RentOrder = {
  id: string
  reference: string
  customer: string
  date: string
  amount: number
  status: "pending" | "approved" | "rejected" | "completed"
  originalData: RentalRequest
}
