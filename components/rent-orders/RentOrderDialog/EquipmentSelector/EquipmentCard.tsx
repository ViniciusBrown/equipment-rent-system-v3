'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Equipment } from '../types'

interface EquipmentCardProps {
  equipment: Equipment
  onAdd: (equipment: Equipment) => void
}

export function EquipmentCard({ equipment, onAdd }: EquipmentCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm">{equipment.name}</CardTitle>
        <div className="flex flex-wrap gap-1 mt-1">
          {equipment.brand && (
            <Badge variant="secondary" className="text-xs">{equipment.brand}</Badge>
          )}
          {equipment.category && (
            <Badge variant="outline" className="text-xs bg-primary/5">{equipment.category}</Badge>
          )}
          {equipment.stock && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              Estoque: {equipment.stock}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {equipment.description || 'Sem descrição disponível'}
        </p>
      </CardContent>
      <CardFooter className="p-3 pt-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full hover:bg-primary hover:text-primary-foreground"
          onClick={() => onAdd(equipment)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar ao Pedido
        </Button>
      </CardFooter>
    </Card>
  )
}
