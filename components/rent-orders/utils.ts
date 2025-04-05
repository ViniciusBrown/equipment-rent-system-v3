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
