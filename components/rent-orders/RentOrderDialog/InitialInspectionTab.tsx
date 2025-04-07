'use client'

import { useState } from 'react'
import { CalendarIcon, Upload, File, Trash2, Camera, CheckCircle } from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

export function InitialInspectionTab({ form, initialData }: TabProps) {
  const [dragActive, setDragActive] = useState(false)
  const { user } = useAuth()
  
  // Check if user has permission to edit inspection information
  const canEdit = ['equipment_inspector', 'financial_inspector', 'manager'].includes(user?.role || '')
  
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
      const currentFiles = form.getValues('initialInspectionImages') || []
      const newFiles = Array.from(e.dataTransfer.files)
      form.setValue('initialInspectionImages', [...currentFiles, ...newFiles], { shouldValidate: true })
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const currentFiles = form.getValues('initialInspectionImages') || []
      const newFiles = Array.from(e.target.files)
      form.setValue('initialInspectionImages', [...currentFiles, ...newFiles], { shouldValidate: true })
      e.target.value = '' // Reset input value to allow selecting the same file again
    }
  }

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const currentFiles = form.getValues('initialInspectionImages') || []
    const updatedFiles = [...currentFiles]
    updatedFiles.splice(index, 1)
    form.setValue('initialInspectionImages', updatedFiles, { shouldValidate: true })
  }

  // Get current inspection images
  const inspectionImages = form.watch('initialInspectionImages') || []
  
  // Get equipment items
  const equipmentItems = form.watch('equipmentItems') || []

  return (
    <div className="space-y-6">
      {/* Inspection Status Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Inspeção Inicial de Equipamentos</h3>
          {!canEdit && (
            <Badge variant="outline" className="text-muted-foreground">
              Visualização apenas
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="initialInspectionStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status da Inspeção</FormLabel>
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
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="initialInspectionDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data da Inspeção</FormLabel>
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
      </div>

      {/* Equipment List Section */}
      {equipmentItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Equipamentos para Inspeção</h3>
          <div className="space-y-4">
            {equipmentItems.map((item, index) => (
              <Card key={`${item.id}-${index}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{item.name}</h4>
                      <Badge variant="outline">Qtd: {item.quantity}</Badge>
                    </div>
                    <Separator className="my-2" />
                    <div className="text-sm text-muted-foreground">
                      <p>ID: {item.id}</p>
                      <p>Valor Diário: R$ {item.daily_rate.toFixed(2)}</p>
                      {item.stock && <p>Estoque: {item.stock}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Inspection Notes Section */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="initialInspectionNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações da Inspeção</FormLabel>
              <FormDescription>
                Descreva o estado dos equipamentos, condições encontradas e quaisquer observações relevantes.
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder="Detalhes da inspeção inicial dos equipamentos..."
                  className="resize-none min-h-[150px]"
                  {...field}
                  disabled={!canEdit}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Inspection Images Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Fotos da Inspeção</h3>
        
        <FormField
          control={form.control}
          name="initialInspectionImages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagens dos Equipamentos</FormLabel>
              <FormDescription>
                Envie fotos dos equipamentos para documentar seu estado inicial.
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
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Arraste e solte imagens aqui ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Suporta arquivos JPG, PNG até 10MB
                    </p>
                    <Input
                      type="file"
                      id="inspectionImages"
                      className="hidden"
                      multiple
                      onChange={handleFileChange}
                      accept=".jpg,.jpeg,.png"
                      disabled={!canEdit}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('inspectionImages')?.click()}
                      disabled={!canEdit}
                    >
                      Selecionar Imagens
                    </Button>
                  </div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Display uploaded inspection images */}
        {inspectionImages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Imagens Enviadas</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {inspectionImages.map((file: File, index: number) => (
                <div
                  key={`${file.name}-${index}`}
                  className="relative group rounded-md border overflow-hidden aspect-square"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Inspection image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {canEdit && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Complete Inspection Button */}
      {canEdit && (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => form.setValue('initialInspectionStatus', 'completed')}
            disabled={form.watch('initialInspectionStatus') === 'completed'}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {form.watch('initialInspectionStatus') === 'completed' 
              ? 'Inspeção Concluída' 
              : 'Marcar Inspeção como Concluída'}
          </Button>
        </div>
      )}
    </div>
  )
}
