'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { RentOrder } from "./types"
import {
  ViewMode,
  CalendarColumn,
  formatDateForColumn,
  getDaysInMonth
} from "@/components/rent-orders/calendarTypes"
import { categorizeOrdersByDate, getStretchedRentOrderInfo, organizeOrdersIntoSlots } from "./utils"
import { StretchedRentOrderCard } from "./StretchedRentOrderCard"
import { CalendarScheduler } from "./CalendarScheduler"
import { RentOrderDialog } from "./RentOrderDialog"

// Note: To restore Week view in the future, uncomment these imports:
// import { cn } from "@/lib/utils"
// import { formatDate, getDaysInWeek } from "@/components/rent-orders/calendarTypes"
// import { WeekViewRentOrderCard } from "./WeekViewRentOrderCard"


interface RentOrdersSchedulerProps {
  initialRentOrders: RentOrder[]
  serverDate: string
}

export function RentOrdersScheduler({ initialRentOrders, serverDate }: RentOrdersSchedulerProps) {
  const today = new Date(serverDate)
  today.setHours(0, 0, 0, 0)

  const [currentDate, setCurrentDate] = useState(today)
  // Month view is now the only view mode
  // To restore Week view in the future:
  // 1. Change this back to useState<ViewMode>('week')
  // 2. Restore the view mode selector buttons below
  // 3. Copy back the components from week-view-archive folder
  const [viewMode] = useState<ViewMode>('month')
  const [selectedOrder, setSelectedOrder] = useState<RentOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    // Only Month view is active now
    // To restore Week view, uncomment the switch statement
    /*
    switch (viewMode) {
      case 'week':
        newDate.setDate(currentDate.getDate() - 7)
        break
      case 'month':
        newDate.setMonth(currentDate.getMonth() - 1)
        break
    }
    */
    newDate.setMonth(currentDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    // Only Month view is active now
    // To restore Week view, uncomment the switch statement
    /*
    switch (viewMode) {
      case 'week':
        newDate.setDate(currentDate.getDate() + 7)
        break
      case 'month':
        newDate.setMonth(currentDate.getMonth() + 1)
        break
    }
    */
    newDate.setMonth(currentDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  const handleViewDetails = (order: RentOrder) => {
    console.log('Selected order for editing:', JSON.stringify(order, null, 2))
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }

  const getColumns = (): CalendarColumn[] => {
    // Only Month view is active now
    // To restore Week view, uncomment the switch statement
    /*
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
    */
    return getDaysInMonth(currentDate).map(date => ({
      date,
      title: formatDateForColumn(date, 'month-cell'),
      orders: categorizeOrdersByDate(initialRentOrders, date)
    }))
  }

  const getHeaderTitle = () => {
    // Only Month view is active now
    // To restore Week view, uncomment the switch statement
    /*
    switch (viewMode) {
      case 'week':
        return `Semana de ${formatDate(currentDate)}`;
      case 'month':
        return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    */
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  const columns = getColumns()
  const headerTitle = getHeaderTitle()

  // Get all dates in the current month view
  const allDates = columns.map(column => column.date)

  // Organize all orders into slots
  const allOrders = initialRentOrders.filter(order =>
    order.originalData?.rental_start && order.originalData?.rental_end
  )
  const orderSlots = organizeOrdersIntoSlots(allOrders)

  const renderCard = (order: RentOrder, date: Date) => {
    // Get the slot index for this order
    const slotIndex = orderSlots.get(order.id) || 0

    // Get information about how this order relates to the current date
    const orderInfo = getStretchedRentOrderInfo(order, date, allDates, slotIndex)

    return (
      <StretchedRentOrderCard
        key={order.id}
        order={order}
        onViewDetails={handleViewDetails}
        date={date}
        isStart={orderInfo.isStart}
        isEnd={orderInfo.isEnd}
        isBetween={orderInfo.isBetween}
        isFirst={orderInfo.isFirst}
        isLast={orderInfo.isLast}
        slotIndex={orderInfo.slotIndex}
      />
    )
  }

  return (
    <>
      <div className="space-y-4 mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-semibold">
            {headerTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-4">
            {/* View mode selector removed - Month view is now the only view
            To restore Week view in the future, uncomment this section:
            <div className="flex items-center">
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
                  {mode === 'week' ? 'semana' : 'mês'}
                </Button>
              ))}
              </div>
            </div>
            */}

            {/* Dialog for viewing/editing rent orders */}
            <RentOrderDialog
              key="edit-dialog"
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              initialData={selectedOrder}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={handleNext}>
                Próximo
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
