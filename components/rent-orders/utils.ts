import type { RentOrder } from "./types"

export const translateStatus = (status: RentOrder['status']) => {
  switch (status) {
    case 'pending':
      return 'Pendente'
    case 'approved':
      return 'Aprovado'
    case 'rejected':
      return 'Rejeitado'
    case 'completed':
      return 'Concluído'
    default:
      return status
  }
}

export const getStatusColor = (status: RentOrder['status']) => {
  switch (status) {
    case 'approved':
      return 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-400'
    case 'rejected':
      return 'bg-rose-400/15 text-rose-600 dark:text-rose-400'
    case 'completed':
      return 'bg-blue-400/15 text-blue-600 dark:text-blue-400'
    default:
      return 'bg-amber-400/15 text-amber-600 dark:text-amber-400'
  }
}

export const categorizeOrdersByDate = (orders: RentOrder[], date: Date) => {
  return orders.filter(order => {
    const dueDate = new Date(order.originalData.rental_end)
    dueDate.setHours(0, 0, 0, 0)
    return dueDate.getTime() === date.getTime()
  })
}
