'use client'

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, CalendarX } from "lucide-react"
import type { RentOrder } from "./types"
import {
  ViewMode,
  CalendarColumn,
  formatDateForColumn,
  getDaysInMonth
} from "@/components/rent-orders/calendarTypes"
import { categorizeOrdersByDate, getStretchedRentOrderInfo, organizeOrdersIntoWeeklySlots, translateStatus } from "./utils"
import { StretchedRentOrderCard } from "./StretchedRentOrderCard"
import { CalendarScheduler } from "./CalendarScheduler"
import { RentOrderDialog } from "./RentOrderDialog"
import { MultiSelect, ComboboxOption } from "@/components/ui/combobox"
import { useAuth } from "@/hooks/use-auth"

// Note: To restore Week view in the future, uncomment these imports:
// import { cn } from "@/lib/utils"
// import { formatDate, getDaysInWeek } from "@/components/rent-orders/calendarTypes"
// import { WeekViewRentOrderCard } from "./WeekViewRentOrderCard"


interface RentOrdersSchedulerProps {
  initialRentOrders: RentOrder[]
  serverDate: string
}

export function RentOrdersScheduler({ initialRentOrders, serverDate }: RentOrdersSchedulerProps) {
  // Log initial rent orders for debugging
  console.log(`RentOrdersScheduler received ${initialRentOrders?.length || 0} rent orders`)
  if (initialRentOrders?.length > 0) {
    console.log('First rent order:', initialRentOrders[0])
  } else {
    console.log('No rent orders received')
  }

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
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const { user } = useAuth()

  // Log user role for debugging
  console.log('Current user role:', user?.role)

  // Add event listener for clearing selection
  useEffect(() => {
    const handleClearSelection = () => setSelectedOrderId(null);
    document.addEventListener('clearSelection', handleClearSelection);
    return () => {
      document.removeEventListener('clearSelection', handleClearSelection);
    };
  }, [])

  // Status filter options
  const statusOptions: ComboboxOption[] = [
    { value: 'pending', label: translateStatus('pending') },
    { value: 'approved', label: translateStatus('approved') },
    { value: 'rejected', label: translateStatus('rejected') },
    { value: 'completed', label: translateStatus('completed') }
  ]

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
          orders: categorizeOrdersByDate(filteredOrders, date)
        }))
      case 'month':
        return getDaysInMonth(currentDate).map(date => ({
          date,
          title: formatDateForColumn(date, 'month-cell'),
          orders: categorizeOrdersByDate(filteredOrders, date)
        }))
    }
    */
    return getDaysInMonth(currentDate).map(date => ({
      date,
      title: formatDateForColumn(date, 'month-cell'),
      orders: categorizeOrdersByDate(filteredOrders, date)
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

  // Filter orders by selected statuses
  const filteredOrders = useMemo(() => {
    console.log('Filtering orders with statuses:', selectedStatuses.length ? selectedStatuses : 'No status filters')

    let result;
    if (selectedStatuses.length === 0) {
      result = initialRentOrders;
    } else {
      result = initialRentOrders.filter(order =>
        selectedStatuses.includes(order.status)
      );
    }

    console.log(`After filtering: ${result.length} orders remaining`)
    return result;
  }, [initialRentOrders, selectedStatuses]);

  const columns = getColumns()
  const headerTitle = getHeaderTitle()

  // Get all dates in the current month view
  const allDates = columns.map(column => column.date)

  // Organize all orders into slots
  const allOrders = filteredOrders.filter(order =>
    order.originalData?.rental_start && order.originalData?.rental_end
  )

  // Create a map to store slot assignments for each week
  const weeklySlots = new Map<number, Map<string, number>>();

  // Group dates by week
  const weekGroups: Date[][] = [];
  let currentWeek: Date[] = [];

  // Group dates into weeks (7 days each, starting from Sunday)
  allDates.forEach((date, index) => {
    currentWeek.push(date);

    // When we reach the end of a week (Saturday) or the end of the array
    if (date.getDay() === 6 || index === allDates.length - 1) {
      weekGroups.push([...currentWeek]);
      currentWeek = [];
    }
  });

  // Calculate slots for each week
  weekGroups.forEach((weekDates, weekIndex) => {
    weeklySlots.set(weekIndex, organizeOrdersIntoWeeklySlots(allOrders, weekDates));
  });

  // Function to get the slot for an order based on the date
  const getOrderSlot = (orderId: string, date: Date): number => {
    // Find which week this date belongs to
    const weekIndex = weekGroups.findIndex(weekDates =>
      weekDates.some(weekDate =>
        weekDate.getDate() === date.getDate() &&
        weekDate.getMonth() === date.getMonth() &&
        weekDate.getFullYear() === date.getFullYear()
      )
    );

    if (weekIndex === -1) return 0;

    // Get the slots for this week
    const weekSlots = weeklySlots.get(weekIndex);
    if (!weekSlots) return 0;

    // Return the slot for this order in this week
    return weekSlots.get(orderId) || 0;
  }

  const renderCard = (order: RentOrder, date: Date) => {
    // Get the slot index for this order based on which week it's in
    const slotIndex = getOrderSlot(order.id, date)

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
        isSelected={selectedOrderId === order.id}
        onSelect={(orderId) => setSelectedOrderId(orderId)}
      />
    )
  }

  // Empty state component for when a client has no rent orders
  const EmptyState = () => {
    // For debugging
    console.log('Rendering EmptyState with user role:', user?.role)

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 border rounded-lg bg-muted/20">
        <CalendarX className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhum pedido de aluguel encontrado</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          {user?.role === 'client'
            ? 'Você ainda não possui pedidos de aluguel. Crie um novo pedido para começar.'
            : 'Não há pedidos de aluguel para exibir com os filtros atuais.'}
        </p>
        <RentOrderDialog
          trigger={
            <Button>
              Novo Pedido +
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <>
      <div
        className="space-y-4 mx-auto w-full overflow-visible"
        onClick={(e) => {
          // Only clear selection if clicking directly on the container, not on its children
          if (e.target === e.currentTarget) {
            setSelectedOrderId(null);
          }
        }}
      >
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
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-full sm:w-auto">
                <MultiSelect
                  options={statusOptions}
                  selected={selectedStatuses}
                  onChange={setSelectedStatuses}
                  placeholder="Filtrar Status"
                  emptyText="Nenhum status encontrado"
                  className="min-w-[200px]"
                />
              </div>
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
        </div>

        {filteredOrders.length === 0 ? (
          <EmptyState />
        ) : (
          <CalendarScheduler
            columns={columns}
            viewMode={viewMode}
            today={today}
            currentDate={currentDate}
            renderCard={renderCard}
            selectedOrderId={selectedOrderId}
            weeklySlots={weeklySlots}
            weekGroups={weekGroups}
          />
        )}
      </div>
    </>
  )
}
