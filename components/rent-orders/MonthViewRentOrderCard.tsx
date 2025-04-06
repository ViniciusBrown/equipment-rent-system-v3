'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import type { RentOrder } from "./types"
import { getStatusColor, translateStatus, getRentDateType, getRentDateTypeStyle } from "./utils"
import { WeekViewCardContent } from "./WeekViewCardContent"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

interface MonthViewRentOrderCardProps {
  order: RentOrder
  onViewDetails: (order: RentOrder) => void
  date: Date
}

export function MonthViewRentOrderCard({ order, onViewDetails, date }: MonthViewRentOrderCardProps) {
  const dateType = getRentDateType(order, date)
  const dateTypeStyle = getRentDateTypeStyle(dateType)

  return (
    <HoverCard openDelay={300} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Card
          key={order.id}
          onClick={() => onViewDetails(order)}
          className={cn(
            "cursor-pointer hover:shadow-lg dark:hover:shadow-primary/10 transition-transform will-change-transform hover:scale-[1.02] shadow-sm dark:shadow-md border-border/30 dark:border-border/50",
            dateTypeStyle || "bg-card dark:bg-secondary/40"
          )}
        >
          <CardContent className="p-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium truncate">{order.customer}</span>
              <Badge
                variant="secondary"
                className={`${getStatusColor(order.status)} text-[10px] px-1 py-0`}
              >
                {translateStatus(order.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground w-full">
              <span className="truncate">{order.reference}</span>
              <span className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {new Date(order.originalData.rental_start).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
                <ArrowRight className="h-2 w-2 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {new Date(order.originalData.rental_end).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      </HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-[280px] sm:w-[350px] p-0 shadow-lg dark:shadow-primary/5">
        <Card className="border-0 shadow-none dark:bg-secondary/40">
          <WeekViewCardContent order={order} compact={true} />
        </Card>
      </HoverCardContent>
    </HoverCard>
  )
}
