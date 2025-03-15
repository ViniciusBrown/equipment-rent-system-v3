"use client"

import type React from "react"
import { useFormContext } from "react-hook-form"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { handleDocumentUpload, removeDocument } from "../utils"
import type { FileWithPreview } from "../types"
import type { FormValues } from "../form-schema"
import { ACCEPTED_ID_TYPES } from "../types"

interface PaymentInformationTabProps {
  goToNextTab: () => void
  goToPreviousTab: () => void
  idDocuments: FileWithPreview[]
  setIdDocuments: React.Dispatch<React.SetStateAction<FileWithPreview[]>>
  paymentDocuments: FileWithPreview[]
  setPaymentDocuments: React.Dispatch<React.SetStateAction<FileWithPreview[]>>
}

export function PaymentInformationTab({
  goToNextTab,
  goToPreviousTab,
  idDocuments,
  setIdDocuments,
  paymentDocuments,
  setPaymentDocuments,
}: PaymentInformationTabProps) {
  const form = useFormContext<FormValues>()

  const handleIdDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDocumentUpload(e, setIdDocuments)
  }

  const handlePaymentDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDocumentUpload(e, setPaymentDocuments)
  }

  const removeIdDocument = (id: string) => {
    removeDocument(id, setIdDocuments)
  }

  const removePaymentDocument = (id: string) => {
    removeDocument(id, setPaymentDocuments)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Payment Method</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="credit" />
                    </FormControl>
                    <FormLabel className="font-normal">Credit Card</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="debit" />
                    </FormControl>
                    <FormLabel className="font-normal">Debit Card</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="invoice" />
                    </FormControl>
                    <FormLabel className="font-normal">Invoice (for business accounts only)</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-6">
          <FormField
            control={form.control}
            name="paymentStatus"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Payment Status (Internal)</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="pending" />
                      </FormControl>
                      <FormLabel className="font-normal">Pending</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="partial" />
                      </FormControl>
                      <FormLabel className="font-normal">Partially Paid</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="paid" />
                      </FormControl>
                      <FormLabel className="font-normal">Paid in Full</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="INV-12345" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-6">
          <FormField
            control={form.control}
            name="paymentNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payment Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any notes about payment arrangements, discounts, etc."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="mt-6">
          <div className="mb-2">
            <p className="text-sm font-medium leading-none">ID Verification</p>
            <p className="text-sm text-muted-foreground mb-2">
              Please upload a photo ID (driver's license, passport, etc.). Max 5MB per file (JPG, PNG, PDF).
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {idDocuments.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={doc.preview || "/placeholder.svg"}
                    alt="ID document preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    onClick={() => removeIdDocument(doc.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <CardContent className="p-2">
                  <p className="truncate text-xs text-muted-foreground">{doc.file.name}</p>
                </CardContent>
              </Card>
            ))}

            <label htmlFor="id-upload">
              <div className="flex aspect-square cursor-pointer flex-col items-center justify-center border-dashed border rounded-md">
                <div className="flex h-full flex-col items-center justify-center p-6">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload ID</p>
                  <p className="text-xs text-muted-foreground">Click to browse</p>
                </div>
              </div>
              <input
                id="id-upload"
                type="file"
                accept={ACCEPTED_ID_TYPES.join(",")}
                className="hidden"
                onChange={handleIdDocumentChange}
              />
            </label>
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-2">
            <p className="text-sm font-medium leading-none">Payment Documents (Optional)</p>
            <p className="text-sm text-muted-foreground mb-2">
              Upload receipts, payment confirmations, or other payment-related documents.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {paymentDocuments.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={doc.preview || "/placeholder.svg"}
                    alt="Payment document preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    onClick={() => removePaymentDocument(doc.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <CardContent className="p-2">
                  <p className="truncate text-xs text-muted-foreground">{doc.file.name}</p>
                </CardContent>
              </Card>
            ))}

            <label htmlFor="payment-upload">
              <div className="flex aspect-square cursor-pointer flex-col items-center justify-center border-dashed border rounded-md">
                <div className="flex h-full flex-col items-center justify-center p-6">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload Document</p>
                  <p className="text-xs text-muted-foreground">Click to browse</p>
                </div>
              </div>
              <input
                id="payment-upload"
                type="file"
                accept={ACCEPTED_ID_TYPES.join(",")}
                className="hidden"
                onChange={handlePaymentDocumentChange}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between space-x-2 mt-4">
        <Button type="button" variant="outline" onClick={goToPreviousTab}>
          Back
        </Button>
        <Button type="button" onClick={goToNextTab}>
          Next
        </Button>
      </div>
    </div>
  )
}
