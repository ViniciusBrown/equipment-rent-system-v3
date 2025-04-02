'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Clock, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddRentOrderDialog } from "@/components/add-rent-order-dialog"
import { Badge } from "@/components/ui/badge"
import { SAMPLE_RENT_ORDERS } from "./data/sample-data"
import type { RentOrder } from "./types"

type Column = {
  id: string
  title: string
  orders: RentOrder[]
  icon?: React.ReactNode
  headerClass?: string
}

const isOrderClosed = (order: RentOrder) => {
  return order.status === "completed"
}

const getDueDate = (order: RentOrder) => {
  return new Date(order.originalData.rental_end)
}

const categorizeOrders = (orders: RentOrder[]) => {
  const now = new Date()
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)
  
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)
  
  return {
    late: orders.filter(order => {
      if (isOrderClosed(order)) return false
      const dueDate = getDueDate(order)
      return dueDate < now
    }),
    dueToday: orders.filter(order => {
      if (isOrderClosed(order)) return false
      const dueDate = getDueDate(order)
      return dueDate <= todayEnd && dueDate >= now
    }),
    dueThisWeek: orders.filter(order => {
      if (isOrderClosed(order)) return false
      const dueDate = getDueDate(order)
      return dueDate <= weekEnd && dueDate > todayEnd
    }),
    openRentOrders: orders.filter(order => {
      if (isOrderClosed(order)) return false
      const dueDate = getDueDate(order)
      return dueDate > weekEnd
    }),
    closed: orders.filter(isOrderClosed)
  }
}

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

export function RentOrdersKanban() {
  const [selectedOrder, setSelectedOrder] = useState<RentOrder | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const categorizedOrders = categorizeOrders(SAMPLE_RENT_ORDERS)

  const columns: Column[] = [
    {
      id: 'late',
      title: 'Late Rent Orders',
      orders: categorizedOrders.late,
      icon: <AlertCircle className="h-4 w-4 text-destructive" />,
      headerClass: 'text-destructive'
    },
    {
      id: 'today',
      title: 'Due Today',
      orders: categorizedOrders.dueToday,
      icon: <Clock className="h-4 w-4 text-warning" />,
      headerClass: 'text-warning'
    },
    {
      id: 'thisWeek',
      title: 'Due This Week',
      orders: categorizedOrders.dueThisWeek,
    },
    {
      id: 'open',
      title: 'Open Rent Orders',
      orders: categorizedOrders.openRentOrders,
    },
    {
      id: 'closed',
      title: 'Closed',
      orders: categorizedOrders.closed,
    }
  ]

  const handleViewDetails = (order: RentOrder) => {
    setSelectedOrder(order)
    setDetailsDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-4">
      <AddRentOrderDialog
        initialData={selectedOrder?.originalData}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      >
        <span className="hidden">View Details</span>
      </AddRentOrderDialog>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 px-1">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="sticky top-0 bg-background/90 dark:bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 p-3 border-b">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {column.icon}
                  <h3 className={`font-semibold text-base ${column.headerClass || ''}`}>
                    {column.title}
                  </h3>
                </div>
                <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full bg-muted">
                  {column.orders.length}
                </span>
              </div>
            </div>
            <div className="space-y-3 p-3">
              {column.orders.map((order) => (
                <Card
                  key={order.id}
                  onClick={() => handleViewDetails(order)}
                  className={`cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] bg-muted/50 dark:bg-muted/50 shadow-sm ${
                    column.id === 'late' ? 'border-destructive/50 border-[2px]' : 'border-border/30'
                  }`}
                >
                  <CardHeader className="p-3 pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle className="text-sm font-medium">
                        {order.reference}
                      </CardTitle>
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(order.status)} text-xs px-2 py-0.5`}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    <div className="space-y-3 text-xs">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Customer:</span>
                          <span className="font-medium truncate flex-1">{order.customer}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <span>{order.originalData.email}</span>
                          <span>•</span>
                          <span>{order.originalData.phone}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(order.amount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Period:</span>
                            <span className="font-medium">
                              {formatDate(order.originalData.rental_start)}
                            </span>
                            <span>→</span>
                            <span className="font-medium">
                              {formatDate(order.originalData.rental_end)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {order.originalData.equipment_items.map((item) => (
                          <Badge
                            key={item.id}
                            variant="outline"
                            className="bg-indigo-400/15 text-indigo-600 dark:text-indigo-300 border-indigo-400/30"
                          >
                            {item.name}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="bg-blue-400/10 text-blue-600 dark:text-blue-400 border-blue-400/20">
                          {order.originalData.delivery_option === 'delivery' ? '🚚 Delivery' : '🏢 Pickup'}
                        </Badge>
                        {order.originalData.insurance_option && (
                          <Badge variant="outline" className="bg-green-400/10 text-green-600 dark:text-green-400 border-green-400/20">
                            🛡️ Insured
                          </Badge>
                        )}
                        {order.originalData.operator_needed && (
                          <Badge variant="outline" className="bg-purple-400/10 text-purple-600 dark:text-purple-400 border-purple-400/20">
                            👤 With Operator
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => e.stopPropagation()} // Prevent card click when clicking dropdown
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          onClick={(e) => e.stopPropagation()} // Prevent card click when clicking menu items
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
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}