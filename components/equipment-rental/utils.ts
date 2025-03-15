import type React from "react"
import { toast } from "@/hooks/use-toast"
import type { FileWithPreview, SelectedEquipmentItem } from "./types"
import { ACCEPTED_ID_TYPES, MAX_FILE_SIZE } from "./types"

/**
 * Calculate the estimated cost of the rental
 */
export const calculateEstimatedCost = (
  equipmentItems: SelectedEquipmentItem[],
  startDate: Date,
  endDate: Date,
  insurance: boolean,
  operator: boolean,
  deliveryOption: string,
) => {
  if (equipmentItems.length === 0 || !startDate || !endDate) {
    return { cost: null, breakdown: {} }
  }

  // Calculate number of days (including partial days)
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return { cost: null, breakdown: {} }
  }

  // Calculate base cost for all equipment
  let totalEquipmentCost = 0
  const breakdown: Record<string, number> = {}

  equipmentItems.forEach((item) => {
    const dailyRate = Number.parseFloat(item.daily_rate || "0")
    const itemCost = dailyRate * diffDays * item.quantity
    totalEquipmentCost += itemCost
    breakdown[item.itemId] = itemCost
  })

  // Base cost = sum of (daily rate * number of days * quantity) for each item
  let cost = totalEquipmentCost

  // Add insurance if selected (10% of base cost)
  if (insurance) {
    cost += totalEquipmentCost * 0.1
  }

  // Add operator if selected ($150 per day)
  if (operator) {
    cost += 150 * diffDays
  }

  // Add delivery fee if selected
  if (deliveryOption === "delivery") {
    cost += 75 // Flat delivery fee
  }

  return { cost, breakdown }
}

/**
 * Generic document upload handler
 */
export const handleDocumentUpload = (
  e: React.ChangeEvent<HTMLInputElement>,
  setDocuments: React.Dispatch<React.SetStateAction<FileWithPreview[]>>,
) => {
  const files = e.target.files
  if (!files || files.length === 0) return

  const newDocuments: FileWithPreview[] = []

  Array.from(files).forEach((file) => {
    // Validate file size and type
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: `${file.name} is too large. Max size is 5MB.`,
        variant: "destructive",
      })
      return
    }

    if (!ACCEPTED_ID_TYPES.includes(file.type)) {
      toast({
        title: "Error",
        description: `${file.name} has an unsupported format.`,
        variant: "destructive",
      })
      return
    }

    // Create preview for images
    let preview = ""
    if (file.type.startsWith("image/")) {
      preview = URL.createObjectURL(file)
    } else {
      // For PDFs, use a placeholder
      preview = "/placeholder.svg?height=100&width=100"
    }

    newDocuments.push({
      file,
      preview,
      id: crypto.randomUUID(),
    })
  })

  setDocuments((prev) => [...prev, ...newDocuments])
  e.target.value = ""
}

/**
 * Generic document removal handler
 */
export const removeDocument = (id: string, setDocuments: React.Dispatch<React.SetStateAction<FileWithPreview[]>>) => {
  setDocuments((prev) => prev.filter((doc) => doc.id !== id))
}

/**
 * Calculate rental duration in days
 */
export const calculateRentalDuration = (startDate?: Date, endDate?: Date): number => {
  if (!startDate || !endDate) return 0

  return Math.ceil(Math.abs(new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Clean up document previews
 */
export const cleanupDocumentPreviews = (documents: FileWithPreview[]) => {
  documents.forEach((doc) => {
    if (doc.preview && doc.preview !== "/placeholder.svg?height=100&width=100") {
      URL.revokeObjectURL(doc.preview)
    }
  })
}
