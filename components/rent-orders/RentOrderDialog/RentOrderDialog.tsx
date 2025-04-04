'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

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
} from '@/components/ui/form'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { submitRentalRequest } from '@/app/actions'
import { formSchema, FormValues, RentOrderDialogProps } from './types'
import { calculateEstimatedCost } from './utils'
import { CustomerInfoTab } from './CustomerInfoTab'
import { EquipmentTab } from './EquipmentTab'
import { DocumentsTab } from './DocumentsTab'

export function RentOrderDialog({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  initialData,
  trigger
}: RentOrderDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize form with default values or initial data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          id: initialData.id,
          fullName: initialData.originalData.full_name,
          email: initialData.originalData.email,
          phone: initialData.originalData.phone,
          rentalStart: new Date(initialData.originalData.rental_start),
          rentalEnd: new Date(initialData.originalData.rental_end),
          specialRequirements: initialData.originalData.special_requirements || '',
          estimatedCost: initialData.amount,
          status: initialData.status as any,
          referenceNumber: initialData.reference,
          equipmentItems: initialData.originalData.equipment_items.map(item => ({
            id: item.id,
            name: item.name,
            daily_rate: item.daily_rate,
            quantity: item.quantity,
          })),
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

  // Watch for changes to calculate estimated cost
  const equipmentItems = form.watch('equipmentItems')
  const rentalStart = form.watch('rentalStart')
  const rentalEnd = form.watch('rentalEnd')

  // Update estimated cost when relevant fields change
  useEffect(() => {
    const cost = calculateEstimatedCost(equipmentItems, rentalStart, rentalEnd)
    form.setValue('estimatedCost', cost)
  }, [equipmentItems, rentalStart, rentalEnd, form])

  // Sync with external open state if provided
  useEffect(() => {
    if (externalOpen !== undefined) {
      setDialogOpen(externalOpen)
    }
  }, [externalOpen])

  // Create a function to explicitly close the dialog
  const closeDialog = () => {
    setDialogOpen(false)
    if (externalOnOpenChange) {
      externalOnOpenChange(false)
    }
  }

  // Handle dialog open state changes
  const handleOpenChange = (open: boolean) => {
    // Only handle opening the dialog through this function
    // Closing is handled by the closeDialog function and the X button
    if (open === true) {
      setDialogOpen(open)
      if (externalOnOpenChange) {
        externalOnOpenChange(open)
      }
    }
    // For closing, we'll handle it in onPointerDownOutside and with our buttons
  }

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true)

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
      formData.append('status', data.status)

      // Add equipment items
      data.equipmentItems.forEach((item, index) => {
        formData.append(`equipmentItems[${index}][id]`, item.id)
        formData.append(`equipmentItems[${index}][name]`, item.name)
        formData.append(`equipmentItems[${index}][daily_rate]`, item.daily_rate.toString())
        formData.append(`equipmentItems[${index}][quantity]`, item.quantity.toString())
      })

      // Add document files if any
      if (data.documents && data.documents.length > 0) {
        data.documents.forEach((file) => {
          formData.append('idDocuments', file)
        })
      }

      // Submit the form
      await submitRentalRequest(formData)

      // Close the dialog on success
      closeDialog()

      // Reset the form if it's a new rental
      if (!initialData) {
        form.reset({
          fullName: '',
          email: '',
          phone: '',
          rentalStart: new Date(),
          rentalEnd: new Date(new Date().setDate(new Date().getDate() + 1)),
          specialRequirements: '',
          estimatedCost: 0,
          status: 'pending',
          equipmentItems: [],
          documents: [],
        })
      }
    } catch (error) {
      console.error('Error submitting rental request:', error)
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
          onPointerDownOutside={(e) => {
            // Prevent closing when clicking outside
            e.preventDefault()
          }}
        >
          <div
            className="bg-background rounded-lg border shadow-lg w-full max-w-4xl p-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ height: '700px' }}
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
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>

                <div className="h-[500px] overflow-hidden flex-grow">
                  {/* Customer Info Tab */}
                  <TabsContent value="customer" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
                    <div className="space-y-4">
                      <CustomerInfoTab form={form} />
                    </div>
                  </TabsContent>

                  {/* Equipment Selection Tab */}
                  <TabsContent value="equipment" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
                    <div className="space-y-4">
                      <EquipmentTab form={form} />
                    </div>
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
                    <div className="space-y-4">
                      <DocumentsTab form={form} initialData={initialData} />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
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
