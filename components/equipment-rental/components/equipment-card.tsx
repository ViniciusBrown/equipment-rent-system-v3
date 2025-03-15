"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Equipment } from "../types"

interface EquipmentCardProps {
  equipment: Equipment
  onAddEquipment: (equipment: Equipment) => void
}

export function EquipmentCard({ equipment, onAddEquipment }: EquipmentCardProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded)
  }

  return (
    <Card className="overflow-hidden h-[220px] flex flex-col">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medium line-clamp-1">{equipment.name}</h3>
            <Badge variant="outline" className="text-xs mt-1">
              {equipment.brand || "Other"}
            </Badge>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onAddEquipment(equipment)}
            className="h-8 w-8 p-0 ml-2"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <span>${equipment.daily_rate}/day</span>
          <span className="text-xs">Stock: {equipment.stock}</span>
        </div>

        {equipment.description && (
          <div className="mt-2 flex-1 relative">
            {isDescriptionExpanded ? (
              <ScrollArea className="h-16 pr-4">
                <div className="text-xs text-muted-foreground">{equipment.description}</div>
              </ScrollArea>
            ) : (
              <div className="text-xs text-muted-foreground line-clamp-3">{equipment.description}</div>
            )}
            {equipment.description.length > 120 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={toggleDescription}
                className="text-xs h-6 mt-1 absolute bottom-0 right-0 bg-card"
              >
                {isDescriptionExpanded ? (
                  <>
                    Less <ChevronUp className="h-3 w-3 ml-1" />
                  </>
                ) : (
                  <>
                    More <ChevronDown className="h-3 w-3 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
