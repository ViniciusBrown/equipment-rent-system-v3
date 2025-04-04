'use client' // Re-add 'use client' as this component uses hooks

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ChevronDown, ChevronUp, Clock, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
// Remove server action import - data will come via props
// import { fetchRentalRequests } from "@/app/actions"
// Remove DB type import - data will be pre-mapped
// import type { RentalRequest } from "@/lib/supabase"
import type { RentOrder } from "./types" // Keep RentOrder type

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

// Helper to get the date part (start of day) from a date string
const getStartOfDay = (dateString: string) => {
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0); // Set time to the beginning of the day
  return date;
}

const categorizeOrders = (orders: RentOrder[]) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0); // Start of today

  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1); // Start of tomorrow

  const nextWeekStart = new Date(todayStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7); // Start of day, 7 days from now

  return {
    late: orders.filter(order => {
      if (isOrderClosed(order)) return false
      const dueDateStart = getStartOfDay(order.originalData.rental_end);
      return dueDateStart < todayStart; // Due date was before today
    }),
    dueToday: orders.filter(order => {
      if (isOrderClosed(order)) return false
      const dueDateStart = getStartOfDay(order.originalData.rental_end);
      return dueDateStart.getTime() === todayStart.getTime(); // Due date is exactly today
    }),
    dueThisWeek: orders.filter(order => {
      if (isOrderClosed(order)) return false
      const dueDateStart = getStartOfDay(order.originalData.rental_end);
      // Due date is after today but before next week starts
      return dueDateStart >= tomorrowStart && dueDateStart < nextWeekStart;
    }),
    openRentOrders: orders.filter(order => {
      if (isOrderClosed(order)) return false
      const dueDateStart = getStartOfDay(order.originalData.rental_end);
      // Due date is 7 days or more from now
      return dueDateStart >= nextWeekStart;
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

interface RentOrdersKanbanProps {
  initialRentOrders: RentOrder[] // Accept pre-fetched and mapped data
}

export function RentOrdersKanban({ initialRentOrders }: RentOrdersKanbanProps) {
  // Client-side state remains
  const [selectedOrder, setSelectedOrder] = useState<RentOrder | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Categorize the data passed via props
  const categorizedOrders = categorizeOrders(initialRentOrders)

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="sticky top-0 bg-background/90 dark:bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 p-4 rounded-t-lg border-b">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {column.icon}
                  <h3 className={`font-semibold text-base ${column.headerClass || ''}`}>
                    {column.title}
                  </h3>
                </div>
                <span className="inline-flex items-center justify-center h-6 min-w-[24px] px-2 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                  {column.orders.length}
                </span>
              </div>
            </div>
            <div className="space-y-3 p-3 rounded-lg bg-gradient-to-b from-muted/30 to-transparent">
              {column.orders.map((order) => (
                <Card
                  key={order.id}
                  onClick={() => handleViewDetails(order)}
                  className={`cursor-pointer hover:shadow-lg transition-transform will-change-transform hover:scale-[1.02] bg-card dark:bg-card/95 shadow-sm ${
                    column.id === 'late' ? 'border-destructive/50 border-[2px]' : 'border-border/30'
                  }`}
                >
                  <CardHeader className="p-3 pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-medium">
                          {order.reference}
                        </CardTitle>
                        <p className="text-[11px] text-muted-foreground">
                          Created on {formatDate(order.date)}
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
                    <div className="space-y-4 text-xs">
                      <div className="p-2 rounded-md bg-muted/50">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Customer:</span>
                            <span className="font-medium truncate flex-1">{order.customer}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground/80">
                            <span className="truncate flex-1">{order.originalData.email}</span>
                            <span>•</span>
                            <span>{order.originalData.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded-md bg-muted/50">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Equipment:</span>
                            <span className="text-xs text-muted-foreground">
                              {order.originalData.equipment_items.length} items
                            </span>
                          </div>
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
                                  className="h-6 text-xs w-full hover:bg-indigo-400/10 hover:text-indigo-600 dark:hover:text-indigo-300 mt-1.5"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedItems(prev => ({ ...prev, [order.id]: !prev[order.id] }));
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
                        </div>
                      </div>

                      <div className="grid gap-3 p-2 rounded-md bg-muted/50">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Amount:</span>
                            <span className="font-medium text-sm">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                              }).format(order.amount)}
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/20">
                            Paid
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Rental Period:</span>
                          <div className="flex items-center gap-2 font-medium">
                            <time>{formatDate(order.originalData.rental_start)}</time>
                            <span className="text-muted-foreground">→</span>
                            <time>{formatDate(order.originalData.rental_end)}</time>
                          </div>
                        </div>
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
                        {order.originalData.operator_needed && (
                          <Badge variant="outline" className="bg-purple-400/10 text-purple-600 dark:text-purple-400 border-purple-400/20">
                            👤 With Operator
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
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}