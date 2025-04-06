'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import type { RentOrder } from "./types"
import { getStatusColor, translateStatus, getClientColor } from "./utils"
import { WeekViewCardContent } from "./WeekViewCardContent"
import { cn } from "@/lib/utils"

interface StretchedRentOrderCardProps {
  order: RentOrder
  onViewDetails: (order: RentOrder) => void
  date: Date
  isStart: boolean
  isEnd: boolean
  isBetween: boolean
  isFirst: boolean
  isLast: boolean
  slotIndex: number
}

export function StretchedRentOrderCard({
  order,
  onViewDetails,
  // date is not used directly but kept for API consistency
  date: _date,
  isStart,
  isEnd,
  isBetween,
  // isFirst and isLast are not used directly but kept for API consistency
  isFirst: _isFirst,
  isLast: _isLast,
  slotIndex
}: StretchedRentOrderCardProps) {
  // Get client-specific colors
  const clientColors = getClientColor(order.customer)

  // Determine the style based on the client and date type
  let cardStyle = `${clientColors.bg} border rounded-md ${clientColors.border}`

  // Add specific margins based on card type
  if (isStart) {
    cardStyle += " ml-[5px] mr-0"
  } else if (isEnd) {
    cardStyle += " ml-0 mr-[10px]"
  } else if (isBetween) {
    cardStyle += " mx-0"
  }

  // Show content on all cards in the rental period (start, end, and in-between)
  const showContent = isStart || isEnd || isBetween

  // Calculate the top position based on the slotIndex
  // We use a fixed height per slot to ensure consistent positioning
  const slotTopPosition = `${slotIndex * 70}px`

  return (
    <HoverCard openDelay={300} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Card
          onClick={() => onViewDetails(order)}
          className={cn(
            "cursor-pointer hover:shadow-lg dark:hover:shadow-primary/10 transition-all will-change-transform hover:scale-[1.02] hover:brightness-105 dark:hover:brightness-125 shadow-sm dark:shadow-md min-h-[60px] absolute z-0 max-h-[65px]",
            isStart || isEnd ? "w-[calc(100%-5px)]" : "w-full",
            cardStyle || "bg-card dark:bg-secondary/40"
          )}
          style={{ top: slotTopPosition }}
        >
          {showContent && (
            <CardContent className="p-2 space-y-1">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center min-w-0 flex-shrink">
                    <span className="text-xs font-medium truncate min-w-0 flex-1">{order.customer}</span>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(order.status)} text-[10px] px-1 py-0 flex-shrink-0`}
                  >
                    {translateStatus(order.status)}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground truncate w-full">
                  {order.reference}
                </p>
              </div>
            </CardContent>
          )}
          {!showContent && (
            <CardContent className="p-0 h-[60px] flex items-center justify-center">
              <div className="w-full h-full"></div>
            </CardContent>
          )}
        </Card>
      </HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-[280px] sm:w-[350px] p-0 shadow-lg dark:shadow-primary/5 z-50">
        <Card className="border-0 shadow-none dark:bg-secondary/40">
          <WeekViewCardContent order={order} compact={true} />
        </Card>
      </HoverCardContent>
    </HoverCard>
  )
}
