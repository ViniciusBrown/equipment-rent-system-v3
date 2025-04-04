'use client'

import { Card } from "@/components/ui/card"
import type { RentOrder } from "./types"
import { WeekViewCardContent } from "./WeekViewCardContent"

interface WeekViewRentOrderCardProps {
  order: RentOrder
  onViewDetails: (order: RentOrder) => void
}

export function WeekViewRentOrderCard({ order, onViewDetails }: WeekViewRentOrderCardProps) {
  return (
    <Card
      key={order.id}
      onClick={() => onViewDetails(order)}
      className="cursor-pointer hover:shadow-lg transition-transform will-change-transform hover:scale-[1.02] bg-card dark:bg-card/95 shadow-sm border-border/30"
    >
      <WeekViewCardContent order={order} />
    </Card>
  )
}
