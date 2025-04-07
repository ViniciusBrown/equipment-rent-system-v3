'use client'

import { useState } from 'react'
import { CalendarIcon, Upload, File, Trash2, Send } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarPtBR } from '@/components/ui/calendar-pt-br'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { TabProps } from './types'
import { useAuth } from '@/hooks/use-auth'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

export function FinancialTab({ form, initialData }: TabProps) {
  const [dragActive, setDragActive] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Check if user has permission to edit financial information
  const canEdit = user?.role === 'financial_inspector' || user?.role === 'manager'
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // Handle drop event
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const currentFiles = form.getValues('paymentProof') || []
      const newFiles = Array.from(e.dataTransfer.files)
      form.setValue('paymentProof', [...currentFiles, ...newFiles], { shouldValidate: true })
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const currentFiles = form.getValues('paymentProof') || []
      const newFiles = Array.from(e.target.files)
      form.setValue('paymentProof', [...currentFiles, ...newFiles], { shouldValidate: true })
      e.target.value = '' // Reset input value to allow selecting the same file again
    }
  }

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const currentFiles = form.getValues('paymentProof') || []
    const updatedFiles = [...currentFiles]
    updatedFiles.splice(index, 1)
    form.setValue('paymentProof', updatedFiles, { shouldValidate: true })
  }

  // Get current payment proof files
  const paymentProofFiles = form.watch('paymentProof') || []
  
  // Handle sending notification to client
  const handleSendNotification = () => {
    // This would be implemented with an actual email notification system
    toast({
      title: "Notificação enviada",
      description: "O cliente foi notificado sobre o status do orçamento.",
    })
  }

  return (
    <div className="space-y-6">
      {/* Budget Status Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Status do Orçamento</h3>
          {!canEdit && (
            <Badge variant="outline" className="text-muted-foreground">
              Visualização apenas
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Pedido</FormLabel>
                <Select
                  disabled={!canEdit}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="rejected">Rejeitado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimatedCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor do Orçamento (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    disabled={!canEdit}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSendNotification}
            disabled={!canEdit}
          >
            <Send className="mr-2 h-4 w-4" />
            Notificar Cliente
          </Button>
        </div>
      </div>

      {/* Payment Status Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Status de Pagamento</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Pagamento</FormLabel>
                <Select
                  disabled={!canEdit}
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do Pagamento</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={!canEdit}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPtBR
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="paymentAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor Pago (R$)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  disabled={!canEdit}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações de Pagamento</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Informações adicionais sobre o pagamento"
                  className="resize-none"
                  {...field}
                  disabled={!canEdit}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Payment Proof Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Comprovante de Pagamento</h3>
        
        <FormField
          control={form.control}
          name="paymentProof"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comprovantes</FormLabel>
              <FormDescription>
                Envie comprovantes de pagamento, notas fiscais ou recibos.
              </FormDescription>
              <FormControl>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 transition-colors",
                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                    !canEdit && "opacity-70 pointer-events-none"
                  )}
                  onDragEnter={canEdit ? handleDrag : undefined}
                  onDragOver={canEdit ? handleDrag : undefined}
                  onDragLeave={canEdit ? handleDrag : undefined}
                  onDrop={canEdit ? handleDrop : undefined}
                >
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Arraste e solte arquivos aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Suporta arquivos PDF, JPG, PNG até 10MB
                    </p>
                    <Input
                      type="file"
                      id="paymentProof"
                      className="hidden"
                      multiple
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={!canEdit}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('paymentProof')?.click()}
                      disabled={!canEdit}
                    >
                      Selecionar Arquivos
                    </Button>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Display uploaded payment proof files */}
        {paymentProofFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Comprovantes Enviados</h4>
            <div className="space-y-2">
              {paymentProofFiles.map((file: File, index: number) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Remover</span>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
