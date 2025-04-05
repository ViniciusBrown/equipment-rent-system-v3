'use client'

import * as z from 'zod'
import type { RentOrder } from '../types'

// Define the form schema with Zod
export const formSchema = z.object({
  id: z.number().optional(),
  fullName: z.string().min(2, { message: 'Nome completo é obrigatório' }),
  email: z.string().email({ message: 'Endereço de email inválido' }),
  phone: z.string().min(5, { message: 'Número de telefone é obrigatório' }),
  rentalStart: z.date({ required_error: 'Data de início do aluguel é obrigatória' }),
  rentalEnd: z.date({ required_error: 'Data de fim do aluguel é obrigatória' }),
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
  ).default([]),  // Default to empty array and no minimum requirement
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
