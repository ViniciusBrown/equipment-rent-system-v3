'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { EquipmentSelector } from './EquipmentSelector'
import { submitRentalRequest } from '@/app/actions'
import type { RentOrder } from '../types'
// import type { RentalRequest } from '@/lib/supabase/database.types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Define the form schema with Zod
const formSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2, { message: 'Full name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  phone: z.string().min(5, { message: 'Phone number is required' }),
  rentalStart: z.date({ required_error: 'Rental start date is required' }),
  rentalEnd: z.date({ required_error: 'Rental end date is required' }),
  specialRequirements: z.string().optional(),
  estimatedCost: z.number().min(0),
  status: z.enum(['pending', 'approved', 'rejected', 'completed']),
  referenceNumber: z.string().optional(),
  equipmentItems: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      daily_rate: z.number(),
      quantity: z.number().min(1),
    })
  ).min(1, { message: 'At least one equipment item is required' }),
})

type FormValues = z.infer<typeof formSchema>

interface RentOrderDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialData?: RentOrder | null
  trigger?: React.ReactNode
}

export function RentOrderDialog({
  open,
  onOpenChange,
  initialData,
  trigger
}: RentOrderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(open || false)

  // Initialize the form with default values or data from an existing order
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          id: initialData.id,
          fullName: initialData.customer,
          email: initialData.originalData.email,
          phone: initialData.originalData.phone,
          rentalStart: new Date(initialData.originalData.rental_start),
          rentalEnd: new Date(initialData.originalData.rental_end),
          specialRequirements: initialData.originalData.special_requirements || '',
          estimatedCost: initialData.amount,
          status: initialData.status,
          referenceNumber: initialData.reference,
          equipmentItems: initialData.originalData.equipment_items,
        }
      : {
          fullName: '',
          email: '',
          phone: '',
          rentalStart: new Date(),
          rentalEnd: new Date(new Date().setDate(new Date().getDate() + 1)),
          specialRequirements: '',
          estimatedCost: 0,
          status: 'pending',
          equipmentItems: [],
        },
  })

  // Update dialog open state when prop changes
  useEffect(() => {
    if (open !== undefined) {
      setDialogOpen(open)
    }
  }, [open])

  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (onOpenChange) {
      onOpenChange(open)
    }
  }

  // Calculate estimated cost when equipment items or dates change
  const calculateEstimatedCost = () => {
    try {
      const equipmentItems = form.getValues('equipmentItems') || []
      const rentalStart = form.getValues('rentalStart')
      const rentalEnd = form.getValues('rentalEnd')

      if (!rentalStart || !rentalEnd || !equipmentItems.length) {
        return 0
      }

      // Calculate number of days
      const days = Math.max(1, Math.ceil((rentalEnd.getTime() - rentalStart.getTime()) / (1000 * 60 * 60 * 24)))

      // Calculate total cost
      const totalCost = equipmentItems.reduce((sum, item) => {
        return sum + ((item.daily_rate || 0) * (item.quantity || 1) * days)
      }, 0)

      return totalCost
    } catch (error) {
      console.error('Error calculating cost:', error)
      return 0
    }
  }

  // Update estimated cost when equipment items or dates change
  useEffect(() => {
    // Watch for changes in the form
    const subscription = form.watch((_, { name }) => {
      // Only recalculate if relevant fields change
      if (name && (name.includes('equipmentItems') || name === 'rentalStart' || name === 'rentalEnd')) {
        try {
          const cost = calculateEstimatedCost()
          form.setValue('estimatedCost', cost, { shouldValidate: true })
        } catch (error) {
          console.error('Error updating cost:', error)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [calculateEstimatedCost, form])

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    try {
      // Convert form data to FormData for server action
      const formData = new FormData()

      if (data.id) {
        formData.append('id', data.id)
      }

      formData.append('fullName', data.fullName)
      formData.append('email', data.email)
      formData.append('phone', data.phone)
      formData.append('rentalStart', data.rentalStart.toISOString())
      formData.append('rentalEnd', data.rentalEnd.toISOString())

      if (data.specialRequirements) {
        formData.append('specialRequirements', data.specialRequirements)
      }

      formData.append('estimatedCost', data.estimatedCost.toString())

      if (data.referenceNumber) {
        formData.append('referenceNumber', data.referenceNumber)
      }

      // Add equipment items
      data.equipmentItems.forEach((item, index) => {
        formData.append(`equipmentItems[${index}][id]`, item.id)
        formData.append(`equipmentItems[${index}][name]`, item.name)
        formData.append(`equipmentItems[${index}][daily_rate]`, item.daily_rate.toString())
        formData.append(`equipmentItems[${index}][quantity]`, item.quantity.toString())
      })

      // Submit the form
      const result = await submitRentalRequest(formData)

      if (result.success) {
        // Close the dialog on success
        handleOpenChange(false)
        // Reset the form
        form.reset()
      } else {
        // Show error message
        console.error('Error submitting form:', result.error)
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative">
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent
          className="fixed inset-0 flex items-center justify-center !p-0 !m-0 !max-w-none !w-screen !h-screen !translate-x-0 !translate-y-0 !top-0 !left-0 !rounded-none !border-0 !shadow-none !bg-transparent"
          onPointerDownOutside={() => handleOpenChange(false)}
          onClick={() => handleOpenChange(false)}
        >
          <div
            className="bg-background rounded-lg border shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogHeader>
              <DialogTitle>{initialData ? 'Edit Rent Order' : 'Create New Rent Order'}</DialogTitle>
              <DialogDescription>
                {initialData
                  ? `Edit details for rent order ${initialData.reference}`
                  : 'Fill in the details to create a new rent order'}
              </DialogDescription>
            </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="customer" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="customer">Customer Info</TabsTrigger>
                  <TabsTrigger value="equipment">Equipment Selection</TabsTrigger>
                  <TabsTrigger value="details">Order Details</TabsTrigger>
                </TabsList>

                {/* Customer Info Tab */}
                <TabsContent value="customer" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
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
                            <Input placeholder="john@example.com" {...field} />
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
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rentalStart"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Rental Start</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date(new Date().setHours(0, 0, 0, 0))
                                }
                                initialFocus
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
                          <FormLabel>Rental End</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => {
                                  const rentalStart = form.getValues("rentalStart")
                                  return date < rentalStart
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Equipment Selection Tab */}
                <TabsContent value="equipment" className="space-y-4 pt-4">
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
                </TabsContent>

                {/* Order Details Tab */}
                <TabsContent value="details" className="space-y-4 pt-4">
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
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {initialData ? 'Update Order' : 'Create Order'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
