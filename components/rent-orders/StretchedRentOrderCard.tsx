'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import type { RentOrder } from "./types"
import { getStatusColor, translateStatus } from "./utils"
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
  date,
  isStart,
  isEnd,
  isBetween,
  isFirst,
  isLast,
  slotIndex
}: StretchedRentOrderCardProps) {
  // Determine the style based on the date type
  let cardStyle = ""

  if (isStart) {
    cardStyle = "bg-green-200 dark:bg-green-800/50 rounded-md"
  } else if (isEnd) {
    cardStyle = "bg-blue-200 dark:bg-blue-800/50 rounded-md"
  } else if (isBetween) {
    cardStyle = "bg-gray-200 dark:bg-gray-700/50 rounded-md"
  }

  // All cards should have the same margins
  // No need for negative margins anymore

  // Add specific styles for all cards when they show content
  if (isStart) {
    cardStyle += " z-10"
  } else if (isEnd) {
    cardStyle += " z-10"
  } else if (isBetween) {
    cardStyle += " z-5"
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
            "cursor-pointer hover:shadow-lg dark:hover:shadow-primary/10 transition-transform will-change-transform hover:scale-[1.02] shadow-sm dark:shadow-md border-border/30 dark:border-border/50 min-h-[60px] absolute w-[calc(100%-0.5rem)]",
            cardStyle || "bg-card dark:bg-secondary/40"
          )}
          style={{ top: slotTopPosition }}
        >
          {showContent && (
            <CardContent className="p-2 space-y-1">
              <div className="flex flex-col space-y-1">
                <div className="flex items-center justify-between gap-1 w-full">
                  <div className="flex items-center gap-1 min-w-0 flex-shrink">
                    {isStart && (
                      <Badge variant="outline" className="bg-green-400/20 text-green-600 dark:text-green-400 border-green-400/30 text-[9px] px-1 py-0 h-4 flex-shrink-0">
                        Início
                      </Badge>
                    )}
                    {isEnd && (
                      <Badge variant="outline" className="bg-blue-400/20 text-blue-600 dark:text-blue-400 border-blue-400/30 text-[9px] px-1 py-0 h-4 flex-shrink-0">
                        Fim
                      </Badge>
                    )}
                    {isBetween && (
                      <Badge variant="outline" className="bg-gray-400/20 text-gray-600 dark:text-gray-400 border-gray-400/30 text-[9px] px-1 py-0 h-4 flex-shrink-0">
                        Alugado
                      </Badge>
                    )}
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
      <HoverCardContent side="right" align="start" className="w-[280px] sm:w-[350px] p-0 shadow-lg dark:shadow-primary/5">
        <Card className="border-0 shadow-none dark:bg-secondary/40">
          <WeekViewCardContent order={order} compact={true} />
        </Card>
      </HoverCardContent>
    </HoverCard>
  )
}
