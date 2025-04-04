'use client'

import { useState } from 'react'
import { X, Upload, File, Trash2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { TabProps } from './types'

export function DocumentsTab({ form, initialData }: TabProps) {
  const [files, setFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...newFiles])
      
      // Add files to form data
      const currentFiles = form.getValues('documents') || []
      form.setValue('documents', [...currentFiles, ...newFiles])
    }
  }

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
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles(prev => [...prev, ...newFiles])
      
      // Add files to form data
      const currentFiles = form.getValues('documents') || []
      form.setValue('documents', [...currentFiles, ...newFiles])
    }
  }

  // Remove a file
  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
    
    // Update form data
    form.setValue('documents', newFiles)
  }

  // Format file size
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} bytes`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Special Requirements */}
      <FormField
        control={form.control}
        name="specialRequirements"
        render={({ field }) => (
          <FormItem>
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
      {/* Document Upload */}
      <FormItem>
        <FormLabel>Upload Documents</FormLabel>
        <FormDescription>
          Upload ID documents, contracts, or other relevant files
        </FormDescription>
        
        <div 
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag and drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported formats: PDF, JPG, PNG (Max 10MB)
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              Select Files
            </Button>
            <input
              id="file-upload"
              name="idDocuments"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />
          </div>
        </div>
      </FormItem>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected Files</p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center space-x-3">
                  <File className="h-5 w-5 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display existing documents if any */}
      {initialData?.originalData.document_urls && initialData.originalData.document_urls.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Existing Documents</p>
          <div className="space-y-2">
            {initialData.originalData.document_urls.map((url, index) => {
              const fileName = url.split('/').pop() || `Document ${index + 1}`
              return (
                <div 
                  key={url}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{fileName}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(url, '_blank')}
                  >
                    View
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
