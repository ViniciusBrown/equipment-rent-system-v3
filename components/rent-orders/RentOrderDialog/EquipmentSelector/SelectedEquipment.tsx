'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EquipmentItem } from '../types'

interface SelectedEquipmentProps {
  items: EquipmentItem[]
  onRemove: (index: number) => void
  onUpdateQuantity: (index: number, quantity: number) => void
}

export function SelectedEquipment({ items, onRemove, onUpdateQuantity }: SelectedEquipmentProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-4 bg-muted/20 rounded-md">
        <p className="text-sm text-muted-foreground">No equipment items selected</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-muted/10">
          <div className="flex-1">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">
              {typeof item.daily_rate === 'string' ? item.daily_rate : `$${item.daily_rate}/day`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-20">
              <Input
                type="number"
                min="1"
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
    </div>
  )
}
