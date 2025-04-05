'use client'

import { useState } from "react"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { RentOrder } from "./types"
import { getStatusColor, translateStatus } from "./utils"
import { EquipmentBadge } from "./EquipmentBadge"

interface WeekViewCardContentProps {
  order: RentOrder
  compact?: boolean
}

export function WeekViewCardContent({ order, compact = false }: WeekViewCardContentProps) {
  const [expanded, setExpanded] = useState(false)

  // Limit the number of equipment items shown in compact mode
  const maxItems = compact ? 1 : 2

  return (
    <>
      <CardHeader className={compact ? "p-2 pb-0" : "p-2 sm:p-3 pb-0"}>
        <div className="flex items-center justify-between mb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">
              {order.reference}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              {order.customer}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={`${getStatusColor(order.status)} text-xs px-2 py-0.5`}
          >
            {translateStatus(order.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={compact ? "p-2 pt-0" : "p-2 sm:p-3 pt-0"}>
        <div className="space-y-2 text-xs">
          <div className="flex flex-wrap gap-1.5">
            {order.originalData.equipment_items.slice(0, maxItems).map((item) => (
              <EquipmentBadge key={item.id} item={item} />
            ))}

            {order.originalData.equipment_items.length > maxItems && (
              <>
                {expanded && order.originalData.equipment_items.slice(maxItems).map((item) => (
                  <EquipmentBadge key={item.id} item={item} />
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs w-full hover:bg-indigo-400/10 hover:text-indigo-600 dark:hover:text-indigo-300"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpanded(prev => !prev)
                  }}
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ChevronDown className="h-4 w-4 mr-1" />
                  )}
                  {expanded ? 'Mostrar Menos' : `Mostrar ${order.originalData.equipment_items.length - maxItems} Mais`}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="font-medium">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(order.amount)}
            </span>
            <Badge variant="outline" className="bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border-emerald-400/20">
              Pago
            </Badge>
          </div>
        </div>

        {!compact && (
          <div className="mt-4 pt-3 border-t flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-muted"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="sr-only">Abrir menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[160px]"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(order.id)}>
                  Copiar ID do pedido
                </DropdownMenuItem>
                <DropdownMenuItem>Atualizar status</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardContent>
    </>
  )
}
