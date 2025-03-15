import type { RentOrder } from "@/lib/supabase/database.types"

// Equipment type definition
export type Equipment = {
  brand: string | null
  daily_rate: string | null
  description: string | null
  id: number
  name: string | null
  stock: string | null
}

// Tab type definition
export type TabType = "client" | "equipment" | "payment" | "additional"

// File with preview type
export type FileWithPreview = {
  file: File
  preview: string
  id: string
}

// Selected equipment item type
export type SelectedEquipmentItem = Equipment & {
  quantity: number
  itemId: string // Unique ID for this selection
}

// Props for the main form component
export type EquipmentRentalFormProps = {
  onSuccess?: () => void
  isDialog?: boolean
  initialData?: Partial<RentOrder>
}

// Constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ACCEPTED_ID_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]

// Fallback equipment data
export const FALLBACK_EQUIPMENT: Equipment[] = [
  {
    id: 1,
    name: "ARRI Alexa Mini",
    brand: "ARRI",
    daily_rate: "650",
    description: "Professional digital cinema camera",
    stock: "5",
  },
  {
    id: 2,
    name: "RED DSMC2 GEMINI",
    brand: "RED",
    daily_rate: "550",
    description: "Digital cinema camera",
    stock: "3",
  },
  {
    id: 3,
    name: "Sony FX9",
    brand: "Sony",
    daily_rate: "350",
    description: "Full-frame cinema camera",
    stock: "4",
  },
  {
    id: 4,
    name: "Canon Cinema Prime Set",
    brand: "Canon",
    daily_rate: "275",
    description: "Set of cinema prime lenses",
    stock: "2",
  },
  {
    id: 5,
    name: "Zeiss Supreme Prime Set",
    brand: "Zeiss",
    daily_rate: "450",
    description: "Premium cinema lenses",
    stock: "2",
  },
  {
    id: 6,
    name: "ARRI SkyPanel S60-C",
    brand: "ARRI",
    daily_rate: "180",
    description: "LED soft light",
    stock: "6",
  },
  {
    id: 7,
    name: "Sound Devices MixPre-10 II",
    brand: "Sound Devices",
    daily_rate: "120",
    description: "Audio recorder",
    stock: "3",
  },
  {
    id: 8,
    name: "Dana Dolly Kit",
    brand: "Dana",
    daily_rate: "175",
    description: "Camera dolly system",
    stock: "2",
  },
  {
    id: 9,
    name: "Director's Monitor Package",
    brand: "SmallHD",
    daily_rate: "220",
    description: "Monitor package",
    stock: "4",
  },
]
