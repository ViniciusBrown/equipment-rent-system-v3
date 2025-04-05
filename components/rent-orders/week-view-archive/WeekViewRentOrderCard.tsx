'use client'

import { Card } from "@/components/ui/card"
import type { RentOrder } from "./types"
import { WeekViewCardContent } from "./WeekViewCardContent"
import { getRentDateType, getRentDateTypeStyle } from "./utils"
import { cn } from "@/lib/utils"

interface WeekViewRentOrderCardProps {
  order: RentOrder
  onViewDetails: (order: RentOrder) => void
  date: Date
}

export function WeekViewRentOrderCard({ order, onViewDetails, date }: WeekViewRentOrderCardProps) {
  const dateType = getRentDateType(order, date)
  const dateTypeStyle = getRentDateTypeStyle(dateType)

  return (
    <Card
      key={order.id}
      onClick={() => onViewDetails(order)}
      className={cn(
        "cursor-pointer hover:shadow-lg dark:hover:shadow-primary/10 transition-transform will-change-transform hover:scale-[1.02] shadow-sm dark:shadow-md border-border/30 dark:border-border/50",
        dateTypeStyle || "bg-card dark:bg-secondary/40"
      )}
    >
      <WeekViewCardContent order={order} />
    </Card>
  )
}
