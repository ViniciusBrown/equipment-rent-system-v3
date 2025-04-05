'use client'

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { CalendarColumn, MonthCellTitle, ViewMode } from "./calendarTypes"

interface CalendarSchedulerProps {
  columns: CalendarColumn[]
  viewMode: ViewMode
  today: Date
  currentDate: Date
  renderCard: (order: any) => ReactNode
}

export function CalendarScheduler({
  columns,
  viewMode,
  today,
  currentDate,
  renderCard
}: CalendarSchedulerProps) {
  const columnClassName = 'w-full min-h-[120px] bg-background'
  const gridClassName = {
    week: 'grid grid-cols-1 md:grid-cols-7 border border-border rounded-lg overflow-hidden divide-x divide-border',
    month: 'grid grid-cols-7 border border-border rounded-lg overflow-hidden divide-x divide-border'
  }[viewMode]

  const renderColumnTitle = (title: string | MonthCellTitle, date: Date, orderCount: number) => {
    if (typeof title === 'string') return title;

    const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short' })

    return (
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[11px] font-medium text-muted-foreground">{title.weekday}</span>
        <div className="w-full flex items-center">
          <div className="flex items-baseline gap-1">
            <span className="text-xs text-muted-foreground">{monthLabel}</span>
            <span className="text-base">{title.day}</span>
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
            'relative p-2',
            column.date.getTime() === today.getTime()
              ? 'bg-primary/20 border-primary/30 border-2 shadow-sm z-10 relative'
              : 'bg-primary/5 border-1'
          )}>
            <div className="text-center flex flex-col items-center py-1">
              <h3 className={cn(
                "font-semibold text-sm leading-none",
                column.date.getTime() === today.getTime()
                  ? 'text-primary font-bold' :
                  column.date.getMonth() !== currentDate.getMonth() ? 'text-muted-foreground/60' : ''
              )}>
                {renderColumnTitle(column.title, column.date, column.orders.length)}
              </h3>
            </div>
          </div>
          <div className={cn(
            "relative space-y-1",
            'p-1 min-h-[80px] border-t bg-gradient-to-b from-muted/30 to-transparent',
            column.date.getTime() === today.getTime() && 'bg-gradient-to-b from-primary/5 to-transparent'
          )}>
            {column.orders.map((order) => renderCard(order))}
          </div>
        </div>
      ))}
    </div>
  )
}
