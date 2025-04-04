'use client'

import { Badge } from "@/components/ui/badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

interface EquipmentItem {
  id: string
  name: string
  quantity: number
  daily_rate?: number
}

interface EquipmentBadgeProps {
  item: EquipmentItem
}

export function EquipmentBadge({ item }: EquipmentBadgeProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Badge
          variant="outline"
          className="bg-indigo-400/15 text-indigo-600 dark:text-indigo-300 border-indigo-400/30 flex items-center max-w-full cursor-pointer"
        >
          <span className="truncate mr-auto">{item.name}</span>
          <span className="ml-2 shrink-0 px-1.5 py-0.5 text-[10px] font-medium bg-indigo-400/20 rounded-full">
            ×{item.quantity}
          </span>
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-auto p-3">
        <div className="space-y-2">
          <h4 className="font-medium">Equipment Details</h4>
          <div className="text-sm">
            <p><span className="font-medium">Name:</span> {item.name}</p>
            <p><span className="font-medium">Quantity:</span> {item.quantity}</p>
            {item.daily_rate && (
              <p>
                <span className="font-medium">Daily Rate:</span> {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(item.daily_rate)}
              </p>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
