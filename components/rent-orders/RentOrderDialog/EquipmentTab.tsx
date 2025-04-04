'use client'

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { TabProps } from './types'
import { EquipmentSelector } from './EquipmentSelector'

export function EquipmentTab({ form }: TabProps) {
  return (
    <FormField
      control={form.control}
      name="equipmentItems"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Equipment Items</FormLabel>
          <FormControl>
            <EquipmentSelector
              value={field.value}
              onChange={field.onChange}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
