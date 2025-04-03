'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddRentOrderDialog } from "@/components/add-rent-order-dialog"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { RentOrder } from "./types"
import {
  ViewMode,
  CalendarColumn,
  MonthCellTitle,
  getStartOfDay,
  formatDate,
  formatDateForColumn,
  getDaysInWeek,
  getDaysInMonth
} from "./calendar-types"

const getStatusColor = (status: RentOrder['status']) => {
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

interface RentOrdersSchedulerProps {
  initialRentOrders: RentOrder[]
  serverDate: string
}

export function RentOrdersScheduler({ initialRentOrders, serverDate }: RentOrdersSchedulerProps) {
  const today = new Date(serverDate)
  today.setHours(0, 0, 0, 0)

  // Today button and Day view have been removed

  const [currentDate, setCurrentDate] = useState(today)
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [selectedOrder, setSelectedOrder] = useState<RentOrder | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  const categorizeOrdersByDate = (orders: RentOrder[], date: Date) => {
    return orders.filter(order => {
      const dueDate = getStartOfDay(order.originalData.rental_end)
      return dueDate.getTime() === date.getTime()
    })
  }

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
    setSelectedOrder(order)
    setDetailsDialogOpen(true)
  }

  const getColumns = (): CalendarColumn[] => {
    switch (viewMode) {
      case 'week':
        return getDaysInWeek(currentDate).map(date => ({
          date,
          title: formatDateForColumn(date, 'short'),
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

  const renderColumnTitle = (title: string | MonthCellTitle, date: Date, orderCount: number) => {
    if (typeof title === 'string') return title;

    const monthLabel = date.toLocaleDateString('en-US', { month: 'short' })

    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[11px] font-medium text-muted-foreground">{title.weekday}</span>
        <div className="w-full flex items-center">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-muted-foreground">{monthLabel}</span>
            <span className="text-base">{title.day}</span>
          </div>
          <div className="flex-1 flex justify-end -mr-1">
            <span className={cn(
              "inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 text-xs font-medium rounded-full",
              orderCount > 0
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {orderCount}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const renderOrderCard = (order: RentOrder, viewType: ViewMode) => {
    // Compact card for Month view
    if (viewType === 'month') {
      return (
        <Card
          key={order.id}
          onClick={() => handleViewDetails(order)}
          className="cursor-pointer hover:shadow-lg transition-transform will-change-transform hover:scale-[1.02] bg-card dark:bg-card/95 shadow-sm border-border/30"
        >
          <CardContent className="p-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium truncate">{order.reference}</span>
              <Badge
                variant="secondary"
                className={`${getStatusColor(order.status)} text-[10px] px-1 py-0`}
              >
                {order.status}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {order.customer}
            </p>
          </CardContent>
        </Card>
      )
    }

    // Standard card for Week view
    return (
      <Card
        key={order.id}
        onClick={() => handleViewDetails(order)}
        className="cursor-pointer hover:shadow-lg transition-transform will-change-transform hover:scale-[1.02] bg-card dark:bg-card/95 shadow-sm border-border/30"
      >
        <CardHeader className="p-3 pb-0">
          <div className="flex items-center justify-between mb-2">
            <div className="space-y-1">
              <CardTitle className="text-sm font-medium">
                {order.reference}
              </CardTitle>
              <p className="text-[11px] text-muted-foreground">
                {order.customer}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={`${getStatusColor(order.status)} text-xs px-2 py-0.5`}
            >
              {order.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-2 text-xs">
            <div className="grid gap-1.5">
              {order.originalData.equipment_items.slice(0, 2).map((item) => (
                <Badge
                  key={item.id}
                  variant="outline"
                  className="bg-indigo-400/15 text-indigo-600 dark:text-indigo-300 border-indigo-400/30 justify-between"
                >
                  <span className="truncate">{item.name}</span>
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-indigo-400/20 rounded-full">
                    ×{item.quantity}
                  </span>
                </Badge>
              ))}

              {order.originalData.equipment_items.length > 2 && (
                <>
                  {expandedItems[order.id] && order.originalData.equipment_items.slice(2).map((item) => (
                    <Badge
                      key={item.id}
                      variant="outline"
                      className="bg-indigo-400/15 text-indigo-600 dark:text-indigo-300 border-indigo-400/30 justify-between"
                    >
                      <span className="truncate">{item.name}</span>
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium bg-indigo-400/20 rounded-full">
                        ×{item.quantity}
                      </span>
                    </Badge>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs w-full hover:bg-indigo-400/10 hover:text-indigo-600 dark:hover:text-indigo-300"
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedItems(prev => ({ ...prev, [order.id]: !prev[order.id] }))
                    }}
                  >
                    {expandedItems[order.id] ? (
                      <ChevronUp className="h-4 w-4 mr-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-1" />
                    )}
                    {expandedItems[order.id] ? 'Show Less' : `Show ${order.originalData.equipment_items.length - 2} More`}
                  </Button>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="font-medium">
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(order.amount)}
              </span>
              <Badge variant="outline" className="bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/20">
                Paid
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="bg-blue-400/10 text-blue-600 dark:text-blue-400 border-blue-400/20">
                {order.originalData.delivery_option === 'delivery' ? '🚚 Delivery' : '🏢 Pickup'}
              </Badge>
              {order.originalData.insurance_option && (
                <Badge variant="outline" className="bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/20">
                  🛡️ Insured
                </Badge>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[160px]"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(order.id)}>
                  Copy order ID
                </DropdownMenuItem>
                <DropdownMenuItem>Update status</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    )
  }

  const columns = getColumns()
  const columnClassName = viewMode === 'month' ? 'w-full min-h-[120px] bg-background' : 'w-full min-h-[200px]'
  const gridClassName = {
    week: 'grid grid-cols-1 md:grid-cols-7 border border-border overflow-hidden divide-x divide-border',
    month: 'grid grid-cols-7 border border-border rounded-lg overflow-hidden divide-x divide-border'
  }[viewMode]

  const getHeaderTitle = () => {
    switch (viewMode) {
      case 'week':
        return `Week of ${formatDate(currentDate)}`;
      case 'month':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  }

  const headerTitle = getHeaderTitle()

  return (
    <div className="space-y-4 mx-auto">
      <AddRentOrderDialog
        initialData={selectedOrder?.originalData}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      >
        <span className="hidden">View Details</span>
      </AddRentOrderDialog>

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

      <div className={`grid ${gridClassName} gap-0`}>
        {columns.map((column) => (
          <div key={column.date.toISOString()} className={`space-y-0 ${columnClassName}`}>
            <div className={cn(
              'relative p-2 border-b',
              column.date.getTime() === today.getTime() ? 'bg-primary/10' : 'bg-accent'
            )}>
              <div className={cn(
                "text-center",
                viewMode === 'month' && "flex flex-col items-center py-1"
              )}>
                <h3 className={cn(
                  "font-semibold",
                  viewMode === 'month' ? 'text-sm leading-none' : 'text-base mb-1',
                  column.date.getTime() === today.getTime() ? 'text-primary' :
                  column.date.getMonth() !== currentDate.getMonth() ? 'text-muted-foreground/60' : ''
                )}>
                  {renderColumnTitle(column.title, column.date, column.orders.length)}
                </h3>
              </div>
            </div>
            <div className={cn(
              "relative space-y-1",
              viewMode === 'month' ? 'p-1 min-h-[80px] border-t bg-gradient-to-b from-muted/30 to-transparent' :
              'p-2 bg-gradient-to-b from-muted/30 to-transparent'
            )}>
              {column.orders.map((order) => renderOrderCard(order, viewMode))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}