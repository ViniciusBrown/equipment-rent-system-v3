import type { RentOrder } from "./types"

// Color pool for client-based coloring with alternating tones
const CLIENT_COLORS = [
  // Red tone
  { bg: 'bg-red-100 dark:bg-red-900/50', border: 'border-red-400 dark:border-red-300' },
  // Blue tone
  { bg: 'bg-blue-100 dark:bg-blue-900/50', border: 'border-blue-400 dark:border-blue-300' },
  // Green tone
  { bg: 'bg-emerald-100 dark:bg-emerald-900/50', border: 'border-emerald-400 dark:border-emerald-300' },
  // Orange tone
  { bg: 'bg-orange-100 dark:bg-orange-900/50', border: 'border-orange-400 dark:border-orange-300' },
  // Purple tone
  { bg: 'bg-purple-100 dark:bg-purple-900/50', border: 'border-purple-400 dark:border-purple-300' },
  // Teal tone
  { bg: 'bg-teal-100 dark:bg-teal-900/50', border: 'border-teal-400 dark:border-teal-300' },
  // Pink tone
  { bg: 'bg-pink-100 dark:bg-pink-900/50', border: 'border-pink-400 dark:border-pink-300' },
  // Cyan tone
  { bg: 'bg-cyan-100 dark:bg-cyan-900/50', border: 'border-cyan-400 dark:border-cyan-300' },
  // Lime tone
  { bg: 'bg-lime-100 dark:bg-lime-900/50', border: 'border-lime-400 dark:border-lime-300' },
  // Amber tone
  { bg: 'bg-amber-100 dark:bg-amber-900/50', border: 'border-amber-400 dark:border-amber-300' },
  // Indigo tone
  { bg: 'bg-indigo-100 dark:bg-indigo-900/50', border: 'border-indigo-400 dark:border-indigo-300' },
  // Yellow tone
  { bg: 'bg-yellow-100 dark:bg-yellow-900/50', border: 'border-yellow-400 dark:border-yellow-300' },
  // Fuchsia tone
  { bg: 'bg-fuchsia-100 dark:bg-fuchsia-900/50', border: 'border-fuchsia-400 dark:border-fuchsia-300' },
  // Sky tone
  { bg: 'bg-sky-100 dark:bg-sky-900/50', border: 'border-sky-400 dark:border-sky-300' },
  // Rose tone
  { bg: 'bg-rose-100 dark:bg-rose-900/50', border: 'border-rose-400 dark:border-rose-300' },
  // Green tone (different shade)
  { bg: 'bg-green-100 dark:bg-green-900/50', border: 'border-green-400 dark:border-green-300' },
  // Violet tone
  { bg: 'bg-violet-100 dark:bg-violet-900/50', border: 'border-violet-400 dark:border-violet-300' },
  // Slate tone
  { bg: 'bg-slate-100 dark:bg-slate-800/60', border: 'border-slate-400 dark:border-slate-300' },
  // Stone tone
  { bg: 'bg-stone-100 dark:bg-stone-800/60', border: 'border-stone-400 dark:border-stone-300' },
  // Neutral tone
  { bg: 'bg-neutral-100 dark:bg-neutral-800/60', border: 'border-neutral-400 dark:border-neutral-300' },
]

// Client color cache to ensure the same client always gets the same color
const clientColorCache = new Map<string, number>()
let nextColorIndex = 0

// Get color for a specific client
export const getClientColor = (clientName: string) => {
  if (!clientColorCache.has(clientName)) {
    clientColorCache.set(clientName, nextColorIndex)
    nextColorIndex = (nextColorIndex + 1) % CLIENT_COLORS.length
  }

  const colorIndex = clientColorCache.get(clientName) || 0
  return CLIENT_COLORS[colorIndex]
}

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

export type RentDateType = 'start' | 'end' | 'between' | 'none'

export const getRentDateType = (order: RentOrder, date: Date): RentDateType => {
  const currentDate = new Date(date)
  currentDate.setHours(0, 0, 0, 0)

  const startDate = new Date(order.originalData.rental_start)
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date(order.originalData.rental_end)
  endDate.setHours(0, 0, 0, 0)

  if (startDate.getTime() === currentDate.getTime()) {
    return 'start'
  } else if (endDate.getTime() === currentDate.getTime()) {
    return 'end'
  } else if (currentDate.getTime() > startDate.getTime() && currentDate.getTime() < endDate.getTime()) {
    return 'between'
  }

  return 'none'
}

export const getRentDateTypeStyle = (dateType: RentDateType) => {
  switch (dateType) {
    case 'start':
      return 'bg-green-200 dark:bg-green-800/50'
    case 'end':
      return 'bg-blue-200 dark:bg-blue-800/50'
    case 'between':
      return 'bg-gray-200 dark:bg-gray-700/50'
    default:
      return ''
  }
}

export const categorizeOrdersByDate = (orders: RentOrder[], date: Date) => {
  return orders.filter(order => {
    // Skip orders without rental_start or rental_end
    if (!order.originalData?.rental_start || !order.originalData?.rental_end) {
      return false
    }

    const currentDate = new Date(date)
    currentDate.setHours(0, 0, 0, 0)

    const startDate = new Date(order.originalData.rental_start)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(order.originalData.rental_end)
    endDate.setHours(0, 0, 0, 0)

    // Include the order if the current date is between start and end dates (inclusive)
    return currentDate.getTime() >= startDate.getTime() && currentDate.getTime() <= endDate.getTime()
  })
}

// New utility functions for stretched cards

export interface StretchedRentOrderInfo {
  order: RentOrder
  isStart: boolean
  isEnd: boolean
  isBetween: boolean
  isFirst: boolean
  isLast: boolean
  slotIndex: number
}

// Function to organize rent orders into slots
export const organizeOrdersIntoSlots = (orders: RentOrder[]): Map<string, number> => {
  const orderSlots = new Map<string, number>();

  // First, group orders by their overlapping date ranges
  const dateRanges: { order: RentOrder; startTime: number; endTime: number }[] = [];

  orders.forEach(order => {
    if (!order.originalData?.rental_start || !order.originalData?.rental_end) return;

    const startDate = new Date(order.originalData.rental_start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(order.originalData.rental_end);
    endDate.setHours(0, 0, 0, 0);

    dateRanges.push({
      order,
      startTime: startDate.getTime(),
      endTime: endDate.getTime()
    });
  });

  // Sort by start date
  dateRanges.sort((a, b) => a.startTime - b.startTime);

  // Assign slots based on overlapping date ranges
  const assignedSlots: number[] = [];

  dateRanges.forEach(({ order, startTime, endTime }) => {
    // Find the first available slot that doesn't overlap
    let slot = 0;
    let found = false;

    while (!found) {
      // Check if this slot is already used by an overlapping order
      const isOverlapping = dateRanges.some(range => {
        const otherOrder = range.order;
        const otherSlot = orderSlots.get(otherOrder.id);

        if (otherSlot === slot) {
          // Check if date ranges overlap
          return (
            (startTime <= range.endTime && endTime >= range.startTime) ||
            (range.startTime <= endTime && range.endTime >= startTime)
          );
        }
        return false;
      });

      if (!isOverlapping) {
        found = true;
      } else {
        slot++;
      }
    }

    orderSlots.set(order.id, slot);
    assignedSlots.push(slot);
  });

  return orderSlots;
};

export const getStretchedRentOrderInfo = (order: RentOrder, date: Date, allDates: Date[], slotIndex: number = 0): StretchedRentOrderInfo => {
  try {
    const currentDate = new Date(date)
    currentDate.setHours(0, 0, 0, 0)

    // Ensure rental_start and rental_end exist
    if (!order.originalData?.rental_start || !order.originalData?.rental_end) {
      return {
        order,
        isStart: false,
        isEnd: false,
        isBetween: false,
        isFirst: true,
        isLast: true
      }
    }

    const startDate = new Date(order.originalData.rental_start)
    startDate.setHours(0, 0, 0, 0)

    const endDate = new Date(order.originalData.rental_end)
    endDate.setHours(0, 0, 0, 0)

    const isStart = startDate.getTime() === currentDate.getTime()
    const isEnd = endDate.getTime() === currentDate.getTime()
    const isBetween = currentDate.getTime() > startDate.getTime() && currentDate.getTime() < endDate.getTime()

    // Find the first visible date for this order in the current month view
    const visibleDates = allDates.filter(d => {
      const dateTime = new Date(d).setHours(0, 0, 0, 0)
      return dateTime >= startDate.getTime() && dateTime <= endDate.getTime()
    })

    const firstVisibleDate = visibleDates[0]
    const lastVisibleDate = visibleDates[visibleDates.length - 1]

    const isFirst = firstVisibleDate && new Date(firstVisibleDate).getTime() === currentDate.getTime()
    const isLast = lastVisibleDate && new Date(lastVisibleDate).getTime() === currentDate.getTime()

    return {
      order,
      isStart,
      isEnd,
      isBetween,
      isFirst,
      isLast,
      slotIndex
    }
  } catch (error) {
    console.error('Error in getStretchedRentOrderInfo:', error)
    // Return default values in case of error
    return {
      order,
      isStart: false,
      isEnd: false,
      isBetween: false,
      isFirst: true,
      isLast: true,
      slotIndex: 0
    }
  }
}
