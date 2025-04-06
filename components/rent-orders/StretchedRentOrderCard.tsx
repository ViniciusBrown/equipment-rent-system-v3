'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import type { RentOrder } from "./types"
import { getStatusColor, translateStatus, getClientColor } from "./utils"
import { WeekViewCardContent } from "./WeekViewCardContent"
import { cn } from "@/lib/utils"
import { CornerDownLeft, CornerRightUp } from "lucide-react"

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

  // Check if the card is in the last column of a row (Saturday) but not the rental_end date
  // This means the rental continues to the next line
  const isSaturday = _date.getDay() === 6 // Saturday is day 6 (0-indexed, Sunday is 0)
  const continuesNextLine = isSaturday && !isEnd && (isStart || isBetween)

  // Check if the card is in the first column of a row (Sunday) but not the rental_start date
  // This means the rental continues from the previous line
  const isSunday = _date.getDay() === 0 // Sunday is day 0
  const continuesFromPrevLine = isSunday && !isStart && (isEnd || isBetween)

  return (
    <HoverCard openDelay={300} closeDelay={200}>
      <HoverCardTrigger asChild>
        <Card
          id={`rent-order-${order.id}-${_date.toISOString().split('T')[0]}`}
          onClick={() => onViewDetails(order)}
          className={cn(
            "cursor-pointer hover:shadow-lg dark:hover:shadow-primary/10 transition-all will-change-transform hover:scale-[1.02] hover:brightness-105 dark:hover:brightness-125 shadow-sm dark:shadow-md min-h-[60px] absolute z-0 max-h-[65px] overflow-visible",
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

          {/* Navigation badges for moving between rows */}
          <div className="absolute right-1 bottom-1 z-20 flex gap-1">
            {/* Continuation badge - shows when a rental continues to the next line */}
            {continuesNextLine && (
              <div
                className={`p-0 h-5 w-5 flex items-center justify-center rounded-full shadow-sm ${clientColors.border} bg-white dark:bg-gray-800 opacity-90 cursor-pointer hover:brightness-110 hover:shadow-md transition-all`}
                title="Ir para continuação na próxima linha"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the parent card's click handler
                  // Find the next Sunday (first day of next row) after the current date
                  const currentDate = new Date(_date);
                  const daysUntilNextSunday = 7 - currentDate.getDay();
                  const nextSunday = new Date(currentDate);
                  nextSunday.setDate(currentDate.getDate() + daysUntilNextSunday);

                  // Find the card element for this order on the next row
                  const nextRowCardId = `rent-order-${order.id}-${nextSunday.toISOString().split('T')[0]}`;
                  const nextRowCard = document.getElementById(nextRowCardId);

                  if (nextRowCard) {
                    // Scroll to the card with smooth animation
                    nextRowCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
              >
                <CornerDownLeft className="h-3 w-3" />
              </div>
            )}

            {/* Previous line badge - shows when a rental continues from the previous line */}
            {continuesFromPrevLine && (
              <div
                className={`p-0 h-5 w-5 flex items-center justify-center rounded-full shadow-sm ${clientColors.border} bg-white dark:bg-gray-800 opacity-90 cursor-pointer hover:brightness-110 hover:shadow-md transition-all`}
                title="Ir para continuação na linha anterior"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent triggering the parent card's click handler
                  // Find the previous Saturday (last day of previous row) before the current date
                  const currentDate = new Date(_date);
                  const daysSincePrevSaturday = currentDate.getDay() + 1; // Sunday is 0, so +1 gives us days since last Saturday
                  const prevSaturday = new Date(currentDate);
                  prevSaturday.setDate(currentDate.getDate() - daysSincePrevSaturday);

                  // Find the card element for this order on the previous row
                  const prevRowCardId = `rent-order-${order.id}-${prevSaturday.toISOString().split('T')[0]}`;
                  const prevRowCard = document.getElementById(prevRowCardId);

                  if (prevRowCard) {
                    // Scroll to the card with smooth animation
                    prevRowCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
              >
                <CornerRightUp className="h-3 w-3" />
              </div>
            )}
          </div>
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
