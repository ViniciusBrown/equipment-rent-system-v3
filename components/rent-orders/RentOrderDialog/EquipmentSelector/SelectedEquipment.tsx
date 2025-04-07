'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EquipmentItem, Equipment } from '../types'

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

  // We no longer calculate total cost here as it's moved to the Financial tab

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/10">
          <div className="flex-1">
            <p className="font-medium">{item.name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
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

      {/* Total cost display moved to Financial tab */}
    </div>
  )
}
