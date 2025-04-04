'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { RentOrder } from "./types"
import {
  ViewMode,
  CalendarColumn,
  formatDate,
  formatDateForColumn,
  getDaysInWeek,
  getDaysInMonth
} from "@/components/rent-orders/calendarTypes"
import { categorizeOrdersByDate } from "./utils"
import { MonthViewRentOrderCard } from "./MonthViewRentOrderCard"
import { WeekViewRentOrderCard } from "./WeekViewRentOrderCard"
import { CalendarScheduler } from "./CalendarScheduler"
import { RentOrderDialog } from "./dialog"


interface RentOrdersSchedulerProps {
  initialRentOrders: RentOrder[]
  serverDate: string
}

export function RentOrdersScheduler({ initialRentOrders, serverDate }: RentOrdersSchedulerProps) {
  const today = new Date(serverDate)
  today.setHours(0, 0, 0, 0)

  const [currentDate, setCurrentDate] = useState(today)
  const [viewMode, setViewMode] = useState<ViewMode>('week')

  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    switch (viewMode) {
      case 'week':
        newDate.setDate(currentDate.getDate() - 7)
        break
      case 'month':
        newDate.setMonth(currentDate.getMonth() - 1)
        break
    }
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    switch (viewMode) {
      case 'week':
        newDate.setDate(currentDate.getDate() + 7)
        break
      case 'month':
        newDate.setMonth(currentDate.getMonth() + 1)
        break
    }
    setCurrentDate(newDate)
  }

  const handleViewDetails = (order: RentOrder) => {
    // We'll use the RentOrderDialog component directly in the card components
    console.log('View details for order:', order.reference)
  }

  const getColumns = (): CalendarColumn[] => {
    switch (viewMode) {
      case 'week':
        return getDaysInWeek(currentDate).map(date => ({
          date,
          title: formatDateForColumn(date, 'month-cell'),
          orders: categorizeOrdersByDate(initialRentOrders, date)
        }))
      case 'month':
        return getDaysInMonth(currentDate).map(date => ({
          date,
          title: formatDateForColumn(date, 'month-cell'),
          orders: categorizeOrdersByDate(initialRentOrders, date)
        }))
    }
  }

  const getHeaderTitle = () => {
    switch (viewMode) {
      case 'week':
        return `Week of ${formatDate(currentDate)}`;
      case 'month':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  }

  const columns = getColumns()
  const headerTitle = getHeaderTitle()

  const renderCard = (order: RentOrder) => {
    if (viewMode === 'month') {
      return <MonthViewRentOrderCard key={order.id} order={order} onViewDetails={handleViewDetails} />
    }
    return <WeekViewRentOrderCard key={order.id} order={order} onViewDetails={handleViewDetails} />
  }

  return (
    <>
      <div className="space-y-4 mx-auto">
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-semibold">
            {headerTitle}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="flex gap-1 bg-muted p-1 rounded-md">
              {(['week', 'month'] as const).map((mode) => (
                <Button
                  key={mode}
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "capitalize",
                    viewMode === mode && "bg-background shadow-sm"
                  )}
                >
                  {mode}
                </Button>
              ))}
              </div>
            </div>
            <RentOrderDialog
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Order
                </Button>
              }
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        <CalendarScheduler
          columns={columns}
          viewMode={viewMode}
          today={today}
          currentDate={currentDate}
          renderCard={renderCard}
        />
      </div>


    </>
  )
}
