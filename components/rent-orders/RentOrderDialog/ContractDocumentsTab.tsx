'use client'

import { useState } from 'react'
import { FileText, Upload, File, Trash2, Download, Printer, Copy } from 'lucide-react'
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
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

export function ContractDocumentsTab({ form, initialData }: TabProps) {
  const [dragActive, setDragActive] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Check if user has permission to edit contract documents
  const canEdit = user?.role === 'manager'
  
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
      const currentFiles = form.getValues('contractDocuments') || []
      const newFiles = Array.from(e.dataTransfer.files)
      form.setValue('contractDocuments', [...currentFiles, ...newFiles], { shouldValidate: true })
    }
  }

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const currentFiles = form.getValues('contractDocuments') || []
      const newFiles = Array.from(e.target.files)
      form.setValue('contractDocuments', [...currentFiles, ...newFiles], { shouldValidate: true })
      e.target.value = '' // Reset input value to allow selecting the same file again
    }
  }

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const currentFiles = form.getValues('contractDocuments') || []
    const updatedFiles = [...currentFiles]
    updatedFiles.splice(index, 1)
    form.setValue('contractDocuments', updatedFiles, { shouldValidate: true })
  }

  // Get current contract documents
  const contractDocuments = form.watch('contractDocuments') || []
  
  // Handle contract generation
  const handleGenerateContract = () => {
    // This would be implemented with an actual contract generation system
    // For now, we'll just set a dummy URL and update the contract status
    const contractUrl = `https://example.com/contracts/${initialData?.originalData.reference_number || 'sample'}.pdf`
    form.setValue('contractGeneratedUrl', contractUrl)
    form.setValue('contractStatus', 'generated')
    
    toast({
      title: "Contrato gerado",
      description: "O contrato foi gerado com sucesso.",
    })
  }
  
  // Handle contract signing
  const handleSignContract = () => {
    form.setValue('contractStatus', 'signed')
    
    toast({
      title: "Contrato assinado",
      description: "O contrato foi marcado como assinado.",
    })
  }
  
  // Handle copy link
  const handleCopyLink = () => {
    const contractUrl = form.getValues('contractGeneratedUrl')
    if (contractUrl) {
      navigator.clipboard.writeText(contractUrl)
      toast({
        title: "Link copiado",
        description: "O link do contrato foi copiado para a área de transferência.",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Contract Status Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Contrato de Aluguel</h3>
          {!canEdit && (
            <Badge variant="outline" className="text-muted-foreground">
              Visualização apenas
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="contractStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Contrato</FormLabel>
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
                    <SelectItem value="generated">Gerado</SelectItem>
                    <SelectItem value="signed">Assinado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="flex items-end space-x-2">
            <Button
              type="button"
              onClick={handleGenerateContract}
              disabled={!canEdit || form.watch('contractStatus') === 'signed'}
            >
              <FileText className="mr-2 h-4 w-4" />
              Gerar Contrato
            </Button>
            
            {form.watch('contractStatus') === 'generated' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSignContract}
                disabled={!canEdit}
              >
                <FileText className="mr-2 h-4 w-4" />
                Marcar como Assinado
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Generated Contract Section */}
      {form.watch('contractGeneratedUrl') && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Contrato Gerado</h3>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="font-medium">Contrato de Aluguel</h4>
                    <p className="text-sm text-muted-foreground">
                      {initialData?.originalData.reference_number || 'Contrato'} - 
                      {initialData?.originalData.full_name || 'Cliente'}
                    </p>
                  </div>
                </div>
                <Badge variant={form.watch('contractStatus') === 'signed' ? 'default' : 'outline'}>
                  {form.watch('contractStatus') === 'signed' ? 'Assinado' : 'Gerado'}
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 p-2 flex justify-end space-x-2">
              <Button variant="outline" size="sm" asChild>
                <a href={form.watch('contractGeneratedUrl')} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </a>
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="h-4 w-4 mr-1" />
                Copiar Link
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`/api/print?url=${encodeURIComponent(form.watch('contractGeneratedUrl'))}`} target="_blank" rel="noopener noreferrer">
                  <Printer className="h-4 w-4 mr-1" />
                  Imprimir
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* Contract Notes Section */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="contractNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações do Contrato</FormLabel>
              <FormDescription>
                Adicione informações adicionais ou cláusulas especiais para o contrato.
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder="Observações sobre o contrato..."
                  className="resize-none min-h-[100px]"
                  {...field}
                  disabled={!canEdit}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Internal Documents Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Documentos Internos</h3>
        
        <FormField
          control={form.control}
          name="contractDocuments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Documentos Adicionais</FormLabel>
              <FormDescription>
                Envie documentos internos relacionados a este aluguel (autorizações, termos especiais, etc).
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
                      Suporta arquivos PDF, DOC, DOCX até 10MB
                    </p>
                    <Input
                      type="file"
                      id="contractDocuments"
                      className="hidden"
                      multiple
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      disabled={!canEdit}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('contractDocuments')?.click()}
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

        {/* Display uploaded documents */}
        {contractDocuments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Documentos Enviados</h4>
            <div className="space-y-2">
              {contractDocuments.map((file: File, index: number) => (
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
