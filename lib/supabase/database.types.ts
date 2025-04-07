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

  // Workflow status fields
  payment_status?: "pending" | "completed"
  contract_status?: "pending" | "generated" | "signed"
  initial_inspection_status?: "pending" | "completed"
  final_inspection_status?: "pending" | "completed"
  user_id?: string | null

  // Financial fields
  payment_amount?: number
  payment_date?: string
  payment_notes?: string
  payment_proof_urls?: string[]

  // Inspection fields
  initial_inspection_notes?: string
  initial_inspection_date?: string
  initial_inspection_image_urls?: string[]
  final_inspection_notes?: string
  final_inspection_date?: string
  final_inspection_image_urls?: string[]

  // Contract fields
  contract_notes?: string
  contract_generated_url?: string
  contract_document_urls?: string[]
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

export type EquipmentInspection = {
  id: number
  rental_request_id: number
  equipment_id: number
  inspection_type: "initial" | "final"
  inspection_date: string
  inspector_id: string
  notes?: string
  image_urls: string[]
  created_at?: string
}

export type RentalDocument = {
  id: number
  rental_request_id: number
  document_type: string
  document_url: string
  uploaded_by: string
  upload_date: string
  created_at?: string
}
