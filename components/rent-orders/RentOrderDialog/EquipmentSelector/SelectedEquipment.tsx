'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EquipmentItem, Equipment } from '../types'
import { useMemo } from 'react'

interface SelectedEquipmentProps {
  items: EquipmentItem[]
  onRemove: (index: number) => void
  onUpdateQuantity: (index: number, quantity: number) => void
  equipmentList: Equipment[]
}

export function SelectedEquipment({ items, onRemove, onUpdateQuantity, equipmentList }: SelectedEquipmentProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-4 bg-muted/20 rounded-md">
        <p className="text-sm text-muted-foreground">Nenhum equipamento selecionado</p>
      </div>
    )
  }

  // Calculate total cost of all selected equipment items
  const totalCost = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + (item.daily_rate * item.quantity);
    }, 0);
  }, [items]);

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/10">
          <div className="flex-1">
            <p className="font-medium">{item.name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              <p className="text-sm text-muted-foreground">
                {typeof item.daily_rate === 'string' ? item.daily_rate : `R$${item.daily_rate}/dia`}
              </p>
              {item.stock && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  Estoque: {item.stock}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-20">
              <Input
                type="number"
                min="1"
                max={item.stock ? parseInt(item.stock) : 1}
                value={item.quantity}
                onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 1)}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {/* Total Cost Display */}
      <div className="mt-4 pt-3 border-t flex justify-between items-center">
        <span className="font-medium">Custo Total dos Equipamentos:</span>
        <span className="font-bold text-lg">R${totalCost.toFixed(2)}</span>
      </div>
    </div>
  )
}
