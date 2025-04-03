import type { RentOrder } from "./types"

export type ViewMode = 'week' | 'month'

export type MonthCellTitle = {
  weekday: string
  day: string
}

export type CalendarColumn = {
  date: Date
  title: string | MonthCellTitle
  orders: RentOrder[]
}

export const getStartOfDay = (dateString: string) => {
  const date = new Date(dateString)
  date.setHours(0, 0, 0, 0)
  return date
}

export const formatWeekday = (date: Date) => {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

export const formatDayNumber = (date: Date) => {
  return date.getDate().toString()
}

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export const formatDateForColumn = (date: Date, format: 'short' | 'full' | 'month-cell' = 'full'): string | MonthCellTitle => {
  if (format === 'month-cell') {
    return {
      weekday: formatWeekday(date),
      day: formatDayNumber(date)
    }
  }
  if (format === 'short') {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }
  return formatDate(date)
}

export const getDaysInWeek = (startDate: Date): Date[] => {
  const days: Date[] = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(startDate)
    day.setDate(startDate.getDate() + i)
    days.push(day)
  }
  return days
}

export const getDaysInMonth = (date: Date): Date[] => {
  const days: Date[] = []
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Add days from previous month to start on Sunday
  const daysFromPrevMonth = firstDay.getDay()
  for (let i = daysFromPrevMonth; i > 0; i--) {
    const prevDay = new Date(year, month, 1 - i)
    days.push(prevDay)
  }

  // Add days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i))
  }

  // Add days from next month to complete the grid
  const remainingDays = 42 - days.length // 6 weeks * 7 days = 42
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i))
  }

  return days
}