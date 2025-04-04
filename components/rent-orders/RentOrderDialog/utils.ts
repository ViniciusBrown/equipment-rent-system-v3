'use client'

import { FormValues, EquipmentItem } from './types'

// Calculate estimated cost based on equipment items and rental dates
export const calculateEstimatedCost = (
  equipmentItems: EquipmentItem[],
  rentalStart: Date | undefined,
  rentalEnd: Date | undefined
): number => {
  try {
    if (!rentalStart || !rentalEnd || !equipmentItems.length) {
      return 0
    }

    // Calculate number of days
    const days = Math.max(1, Math.ceil((rentalEnd.getTime() - rentalStart.getTime()) / (1000 * 60 * 60 * 24)))

    // Calculate total cost
    const totalCost = equipmentItems.reduce((sum, item) => {
      return sum + ((item.daily_rate || 0) * (item.quantity || 1) * days)
    }, 0)

    return totalCost
  } catch (error) {
    console.error('Error calculating cost:', error)
    return 0
  }
}

// Convert form data to FormData for server action
export const prepareFormData = (data: FormValues): FormData => {
  const formData = new FormData()

  if (data.id) {
    formData.append('id', data.id)
  }

  formData.append('fullName', data.fullName)
  formData.append('email', data.email)
  formData.append('phone', data.phone)
  formData.append('rentalStart', data.rentalStart.toISOString())
  formData.append('rentalEnd', data.rentalEnd.toISOString())

  if (data.specialRequirements) {
    formData.append('specialRequirements', data.specialRequirements)
  }

  formData.append('estimatedCost', data.estimatedCost.toString())

  if (data.referenceNumber) {
    formData.append('referenceNumber', data.referenceNumber)
  }

  // Add equipment items
  data.equipmentItems.forEach((item, index) => {
    formData.append(`equipmentItems[${index}][id]`, item.id)
    formData.append(`equipmentItems[${index}][name]`, item.name)
    formData.append(`equipmentItems[${index}][daily_rate]`, item.daily_rate.toString())
    formData.append(`equipmentItems[${index}][quantity]`, item.quantity.toString())
  })

  return formData
}
