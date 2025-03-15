export type RentalRequest = {
  id?: string
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
  delivery_option: string
  delivery_address?: string
  insurance_option: boolean
  operator_needed: boolean
  payment_method: string
  special_requirements?: string
  estimated_cost: number
  status: "pending" | "approved" | "rejected" | "completed"
  reference_number: string
  document_urls?: string[]
  created_at?: string
  payment_ready: "pending" | "success" | "warning"
  document_emitted: "pending" | "success" | "warning"
  initial_inspection: "pending" | "success" | "warning"
  rented: "pending" | "success" | "warning"
  returned_equipment: "pending" | "success" | "warning"
  final_inspection: "pending" | "success" | "warning"
}

export type RentOrder = {
  id: string
  reference: string
  customer: string
  date: string
  amount: number
  payment_ready: "pending" | "success" | "warning"
  document_emitted: "pending" | "success" | "warning"
  initial_inspection: "pending" | "success" | "warning"
  rented: "pending" | "success" | "warning"
  returned_equipment: "pending" | "success" | "warning"
  final_inspection: "pending" | "success" | "warning"
}
