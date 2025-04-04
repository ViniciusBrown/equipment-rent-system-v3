'use client'

import * as z from 'zod'
import type { RentOrder } from '../types'

// Define the form schema with Zod
export const formSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2, { message: 'Full name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().min(5, { message: 'Phone number is required' }),
  rentalStart: z.date({ required_error: 'Rental start date is required' }),
  rentalEnd: z.date({ required_error: 'Rental end date is required' }),
  specialRequirements: z.string().optional(),
  estimatedCost: z.number().min(0),
  status: z.enum(['pending', 'approved', 'rejected', 'completed']),
  referenceNumber: z.string().optional(),
  equipmentItems: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      daily_rate: z.number(),
      quantity: z.number().min(1),
      stock: z.string().optional(),
    })
  ).min(1, { message: 'At least one equipment item is required' }),
  documents: z.array(z.instanceof(File)).optional(),
})

export type FormValues = z.infer<typeof formSchema>

export interface RentOrderDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialData?: RentOrder | null
  trigger?: React.ReactNode
}

export interface EquipmentItem {
  id: string
  name: string
  daily_rate: number
  quantity: number
  stock?: string
}

export interface Equipment {
  id: string
  name: string
  brand?: string
  category?: string
  daily_rate: number | string
  description?: string
  available?: boolean
  image_url?: string
  created_at?: string
  stock?: string
}

export interface EquipmentSelectorProps {
  value: EquipmentItem[]
  onChange: (value: EquipmentItem[]) => void
}

export interface TabProps {
  form: any // Using any for simplicity, but ideally should use proper type
  initialData?: RentOrder | null
}
