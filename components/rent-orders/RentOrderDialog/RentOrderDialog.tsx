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
import { ClientInfoTab } from './ClientInfoTab'
import { EquipmentTab } from './EquipmentTab'
import { FinancialTab } from './FinancialTab'
import { InitialInspectionTab } from './InitialInspectionTab'
import { ContractDocumentsTab } from './ContractDocumentsTab'
import { FinalInspectionTab } from './FinalInspectionTab'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export function RentOrderDialog({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  initialData,
  trigger
}: RentOrderDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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

  // Reset form when initialData changes or dialog opens
  useEffect(() => {
    if (initialData && dialogOpen) {
      console.log('Initializing form with data:', initialData)
      form.reset({
        id: Number(initialData.id), // Convert to number
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
      })
    } else if (!initialData && dialogOpen) {
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
      })
    }
  }, [initialData, dialogOpen, form])

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
    setDialogOpen(open)
    if (externalOnOpenChange) {
      externalOnOpenChange(open)
    }
  }

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    try {
      console.log('Submitting form data:', JSON.stringify(data, null, 2))
      console.log('Is update operation:', initialData ? 'Yes' : 'No')

      // Convert form data to FormData for server action
      const formData = new FormData()

      if (data.id) {
        console.log('Including ID in submission:', data.id)
        formData.append('id', String(data.id)) // Convert to string for FormData
      }

      // Add reference number if it exists (for updates)
      if (data.referenceNumber) {
        formData.append('referenceNumber', data.referenceNumber)
      }

      // Add customer information
      formData.append('fullName', data.fullName)
      formData.append('email', data.email)
      formData.append('phone', data.phone)
      formData.append('rentalStart', data.rentalStart.toISOString())
      formData.append('rentalEnd', data.rentalEnd.toISOString())

      if (data.specialRequirements) {
        formData.append('specialRequirements', data.specialRequirements)
      }

      // Add financial and status information
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
      console.log('About to submit form data to server action')
      const result = await submitRentalRequest(formData)
      console.log('Server action response:', JSON.stringify(result, null, 2))

      if (result.success) {
        // Show success toast
        toast({
          title: initialData ? 'Pedido Atualizado' : 'Pedido Criado',
          description: initialData
            ? `Pedido de aluguel ${result.referenceNumber} foi atualizado com sucesso.`
            : `Novo pedido de aluguel ${result.referenceNumber} foi criado com sucesso.`,
          variant: 'default',
        })

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
      } else {
        // Show error toast for failed operation
        toast({
          title: 'Operação Falhou',
          description: result.error || 'Falha ao enviar pedido de aluguel. Por favor, tente novamente.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error submitting rental request:', error)

      // Show error toast for any exception
      toast({
        title: 'Erro de Envio',
        description: 'Ocorreu um erro inesperado ao processar seu pedido. Por favor, tente novamente.',
        variant: 'destructive',
      })
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
              <DialogTitle>{initialData ? 'Editar Pedido de Aluguel' : 'Criar Novo Pedido de Aluguel'}</DialogTitle>
              <DialogDescription>
                {initialData
                  ? `Editar detalhes do pedido ${initialData.reference}`
                  : 'Preencha os detalhes para criar um novo pedido de aluguel'}
              </DialogDescription>
            </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="client" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="client">Cliente</TabsTrigger>
                  <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
                  <TabsTrigger
                    value="financial"
                    disabled={user?.role !== 'financial_inspector' && user?.role !== 'manager'}
                  >
                    Financeiro
                  </TabsTrigger>
                  <TabsTrigger
                    value="initial-inspection"
                    disabled={!['equipment_inspector', 'financial_inspector', 'manager'].includes(user?.role || '')}
                  >
                    Inspeção Inicial
                  </TabsTrigger>
                  <TabsTrigger
                    value="contract"
                    disabled={user?.role !== 'manager'}
                  >
                    Contratos
                  </TabsTrigger>
                  <TabsTrigger
                    value="final-inspection"
                    disabled={!['equipment_inspector', 'financial_inspector', 'manager'].includes(user?.role || '')}
                  >
                    Inspeção Final
                  </TabsTrigger>
                </TabsList>

                <div className="h-[500px] overflow-hidden flex-grow">
                  {/* Client Info Tab */}
                  <TabsContent value="client" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
                    <div className="space-y-4">
                      <ClientInfoTab form={form} initialData={initialData} />
                    </div>
                  </TabsContent>

                  {/* Equipment Selection Tab */}
                  <TabsContent value="equipment" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
                    <div className="space-y-4">
                      <EquipmentTab form={form} />
                    </div>
                  </TabsContent>

                  {/* Financial Tab */}
                  <TabsContent value="financial" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
                    <div className="space-y-4">
                      <FinancialTab form={form} initialData={initialData} />
                    </div>
                  </TabsContent>

                  {/* Initial Inspection Tab */}
                  <TabsContent value="initial-inspection" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
                    <div className="space-y-4">
                      <InitialInspectionTab form={form} initialData={initialData} />
                    </div>
                  </TabsContent>

                  {/* Contract Documents Tab */}
                  <TabsContent value="contract" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
                    <div className="space-y-4">
                      <ContractDocumentsTab form={form} initialData={initialData} />
                    </div>
                  </TabsContent>

                  {/* Final Inspection Tab */}
                  <TabsContent value="final-inspection" className="h-full overflow-y-auto pt-4 pb-2 pr-2">
                    <div className="space-y-4">
                      <FinalInspectionTab form={form} initialData={initialData} />
                    </div>
                  </TabsContent>
                </div>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    console.log('Manual form submission triggered');
                    try {
                      // Manually validate the form
                      const isValid = await form.trigger();
                      console.log('Form validation result:', isValid);
                      console.log('Current form values:', JSON.stringify(form.getValues(), null, 2));
                      console.log('Form errors:', JSON.stringify(form.formState.errors, null, 2));

                      if (isValid) {
                        // If valid, get the form values and call onSubmit directly
                        const values = form.getValues();

                        // Ensure ID is a number if present
                        if (values.id && typeof values.id === 'string') {
                          values.id = Number(values.id);
                        }

                        console.log('Form values to submit:', values);
                        await onSubmit(values);
                      } else {
                        console.log('Form has validation errors:', form.formState.errors);
                        toast({
                          title: 'Erro de Validação',
                          description: 'Por favor, verifique o formulário para erros e tente novamente.',
                          variant: 'destructive',
                        });
                      }
                    } catch (error) {
                      console.error('Error during manual submission:', error);
                      toast({
                        title: 'Erro de Envio',
                        description: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {initialData ? 'Atualizar Pedido' : 'Criar Pedido'}
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
