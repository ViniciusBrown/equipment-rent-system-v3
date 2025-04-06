'use client'

import React, { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { CalendarColumn, MonthCellTitle, ViewMode } from "./calendarTypes"

interface CalendarSchedulerProps {
  columns: CalendarColumn[]
  viewMode: ViewMode
  today: Date
  currentDate: Date
  renderCard: (order: any, date: Date) => ReactNode
  selectedOrderId?: string | null
  orderSlots?: Map<string, number> // Kept for backward compatibility
  weeklySlots?: Map<number, Map<string, number>>
  weekGroups?: Date[][]
}

export function CalendarScheduler({
  columns,
  viewMode,
  today,
  currentDate,
  renderCard,
  selectedOrderId,
  orderSlots,
  weeklySlots,
  weekGroups
}: CalendarSchedulerProps) {
  const columnClassName = 'w-full min-h-[100px] bg-background relative overflow-visible'
  const gridClassName = {
    week: 'grid grid-cols-1 sm:grid-cols-3 md:grid-cols-7 border border-border rounded-lg overflow-visible divide-x divide-border',
    month: 'grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 border border-border rounded-lg overflow-visible divide-x divide-border mx-1'
  }[viewMode]

  // Calculate the height of a column based on the maximum slot index used
  const calculateColumnHeight = (orders: any[], date: Date) => {
    if (orders.length === 0) return '80px';

    // Find the maximum slot index used in this column
    let maxSlotIndex = 0;

    if (weeklySlots && weekGroups) {
      // Find which week this date belongs to
      const weekIndex = weekGroups.findIndex(weekDates =>
        weekDates.some(weekDate =>
          weekDate.getDate() === date.getDate() &&
          weekDate.getMonth() === date.getMonth() &&
          weekDate.getFullYear() === date.getFullYear()
        )
      );

      if (weekIndex !== -1) {
        const weekSlots = weeklySlots.get(weekIndex);
        if (weekSlots) {
          // Find the maximum slot index for orders in this column
          orders.forEach(order => {
            const slotIndex = weekSlots.get(order.id) || 0;
            maxSlotIndex = Math.max(maxSlotIndex, slotIndex);
          });
        }
      }
    } else if (orderSlots) {
      // Legacy support for the old slotting system
      orders.forEach(order => {
        const slotIndex = orderSlots.get(order.id) || 0;
        maxSlotIndex = Math.max(maxSlotIndex, slotIndex);
      });
    }

    // Add 1 to account for zero-indexing, then multiply by the slot height
    // Add extra padding at the bottom
    return `${(maxSlotIndex + 1) * 80 + 20}px`;
  };

  const renderColumnTitle = (title: string | MonthCellTitle, date: Date, orderCount: number) => {
    if (typeof title === 'string') return title;

    const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' })

    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[11px] font-medium text-muted-foreground">{title.weekday}</span>
        <div className="w-full flex items-center">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-muted-foreground">{monthLabel}</span>
            <span className="text-base text-foreground">{title.day}</span>
          </div>
          <div className="flex-1 flex justify-end pl-2 -mr-1">
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

  return (
    <div className={`grid ${gridClassName} gap-0`}>
      {columns.map((column) => (
        <div key={column.date.toISOString()} className={`space-y-0 ${columnClassName}`}>
          <div className={cn(
            'relative p-2 z-10',
            column.date.getTime() === today.getTime()
              ? 'bg-primary/20 dark:bg-primary/30 border-primary/30 dark:border-primary/50 border-1 shadow-sm relative'
              : 'bg-primary/5 dark:bg-secondary/80 border-1'
          )}>
            <div className="text-center flex flex-col items-center py-1">
              <h3 className={cn(
                "font-semibold text-sm leading-none",
                column.date.getTime() === today.getTime()
                  ? 'text-primary dark:text-primary-foreground font-bold' :
                  column.date.getMonth() !== currentDate.getMonth() ? 'text-muted-foreground/60' : ''
              )}>
                {renderColumnTitle(column.title, column.date, column.orders.length)}
              </h3>
            </div>
          </div>
          <div className={cn(
            "relative",
            'p-0 border-t bg-gradient-to-b from-muted/30 to-transparent',
            column.date.getTime() === today.getTime() && 'bg-gradient-to-b from-primary/5 dark:from-primary/10 to-transparent',
            // We'll handle row highlighting in the card component instead of here
          )}>
            {/* Calculate the height based on the number of orders */}
            <div
              className="relative p-0 overflow-visible"
              style={{
                height: calculateColumnHeight(column.orders, column.date)
              }}
              onClick={(e) => {
                // Only clear selection if clicking directly on the cell, not on its children
                if (e.target === e.currentTarget && selectedOrderId) {
                  // Pass the click event to the parent to clear selection
                  e.stopPropagation();
                  if (orderSlots) {
                    // Clear the selection
                    const event = new CustomEvent('clearSelection');
                    document.dispatchEvent(event);
                  }
                }
              }}
            >
              {/* Add cell highlighting for the selected order */}
              {selectedOrderId && column.orders.some(order => order.id === selectedOrderId) && (
                <div className="absolute inset-0 pointer-events-none">
                  {column.orders.map((order) => {
                    if (order.id === selectedOrderId) {
                      // Get the slot index for this order based on which week it's in
                      let slotIndex = 0;

                      if (weeklySlots && weekGroups) {
                        // Find which week this date belongs to
                        const weekIndex = weekGroups.findIndex(weekDates =>
                          weekDates.some(weekDate =>
                            weekDate.getDate() === column.date.getDate() &&
                            weekDate.getMonth() === column.date.getMonth() &&
                            weekDate.getFullYear() === column.date.getFullYear()
                          )
                        );

                        if (weekIndex !== -1) {
                          const weekSlots = weeklySlots.get(weekIndex);
                          if (weekSlots) {
                            slotIndex = weekSlots.get(order.id) || 0;
                          }
                        }
                      } else if (orderSlots) {
                        // Legacy support for the old slotting system
                        slotIndex = orderSlots.get(order.id) || 0;
                      }
                      // Calculate the top position based on the slotIndex
                      const top = slotIndex * 80;
                      // Create a highlight div that spans the width of the cell but only the height of this specific order
                      return (
                        <div
                          key={`highlight-${order.id}`}
                          className="absolute w-full h-[80px] bg-primary/20 dark:bg-primary/30 pointer-events-none z-[1] transition-all"
                          style={{ top: `${top}px` }}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              )}
              {column.orders.map((order) => renderCard(order, column.date))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
