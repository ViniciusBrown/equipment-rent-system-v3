"use client"

import { CalendarIcon } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { calculateRentalDuration } from "../utils"
import type { FormValues } from "../form-schema"

interface ClientInformationTabProps {
  goToNextTab: () => void
}

export function ClientInformationTab({ goToNextTab }: ClientInformationTabProps) {
  const form = useFormContext<FormValues>()

  const watchRentalStart = form.watch("rentalStart")
  const watchRentalEnd = form.watch("rentalEnd")

  const rentalDuration = calculateRentalDuration(watchRentalStart, watchRentalEnd)

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john.doe@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="(555) 123-4567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Company Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Rental Dates</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="rentalStart"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Rental Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? new Date(field.value).toLocaleDateString() : <span>Select start date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) field.onChange(date)
                      }}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rentalEnd"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Rental End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? new Date(field.value).toLocaleDateString() : <span>Select end date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        if (date) field.onChange(date)
                      }}
                      initialFocus
                      disabled={(date) => {
                        const startDate = form.getValues("rentalStart")
                        return startDate
                          ? date <= new Date(startDate)
                          : date < new Date(new Date().setHours(0, 0, 0, 0))
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {rentalDuration > 0 && (
          <div className="mt-2 text-sm text-muted-foreground">
            Rental duration:{" "}
            <span className="font-medium">
              {rentalDuration} day{rentalDuration !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-2 mt-4">
        <Button type="button" onClick={goToNextTab}>
          Next
        </Button>
      </div>
    </div>
  )
}
