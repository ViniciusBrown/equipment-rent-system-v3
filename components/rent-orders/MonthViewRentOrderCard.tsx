'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import type { RentOrder } from "./types"
import { getStatusColor, translateStatus } from "./utils"
import { WeekViewCardContent } from "./WeekViewCardContent"

interface MonthViewRentOrderCardProps {
  order: RentOrder
  onViewDetails: (order: RentOrder) => void
}

export function MonthViewRentOrderCard({ order, onViewDetails }: MonthViewRentOrderCardProps) {
  return (
    <HoverCard openDelay={300} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Card
          key={order.id}
          onClick={() => onViewDetails(order)}
          className="cursor-pointer hover:shadow-lg dark:hover:shadow-primary/10 transition-transform will-change-transform hover:scale-[1.02] bg-card dark:bg-secondary/40 shadow-sm dark:shadow-md border-border/30 dark:border-border/50"
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
            <p className="text-[11px] text-muted-foreground truncate">
              {order.reference}
            </p>
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
