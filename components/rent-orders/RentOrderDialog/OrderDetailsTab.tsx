'use client'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TabProps } from './types'

export function OrderDetailsTab({ form, initialData }: TabProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="specialRequirements"
        render={({ field }) => (
          <FormItem className="col-span-2">
            <FormLabel>Special Requirements</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Any special requirements or notes"
                className="resize-none"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Status (only for editing) */}
      {initialData && (
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {/* Estimated Cost */}
      <FormField
        control={form.control}
        name="estimatedCost"
        render={({ field }) => (
          <FormItem className={initialData ? "" : "col-span-2"}>
            <FormLabel>Estimated Cost</FormLabel>
            <FormControl>
              <Input
                type="number"
                step="0.01"
                readOnly
                {...field}
                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                value={field.value}
              />
            </FormControl>
            <FormDescription>
              Calculated based on equipment and rental duration
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
