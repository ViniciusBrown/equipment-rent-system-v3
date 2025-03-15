"use client"

import type React from "react"

import { useFormContext } from "react-hook-form"
import { Loader2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { handleDocumentUpload, removeDocument, calculateRentalDuration } from "../utils"
import type { FileWithPreview, SelectedEquipmentItem } from "../types"
import type { FormValues } from "../form-schema"
import { ACCEPTED_ID_TYPES } from "../types"

interface AdditionalInformationTabProps {
  goToPreviousTab: () => void
  additionalDocuments: FileWithPreview[]
  setAdditionalDocuments: React.Dispatch<React.SetStateAction<FileWithPreview[]>>
  selectedEquipmentItems: SelectedEquipmentItem[]
  estimatedCost: number | null
  isSubmitting: boolean
  submitButtonText: string
  initialData?: any
}

export function AdditionalInformationTab({
  goToPreviousTab,
  additionalDocuments,
  setAdditionalDocuments,
  selectedEquipmentItems,
  estimatedCost,
  isSubmitting,
  submitButtonText,
  initialData,
}: AdditionalInformationTabProps) {
  const form = useFormContext<FormValues>()

  const watchRentalStart = form.watch("rentalStart")
  const watchRentalEnd = form.watch("rentalEnd")
  const watchInsuranceOption = form.watch("insuranceOption")
  const watchOperatorNeeded = form.watch("operatorNeeded")
  const watchDeliveryOption = form.watch("deliveryOption")

  const rentalDuration = calculateRentalDuration(watchRentalStart, watchRentalEnd)

  const handleAdditionalDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDocumentUpload(e, setAdditionalDocuments)
  }

  const removeAdditionalDocument = (id: string) => {
    removeDocument(id, setAdditionalDocuments)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
        <FormField
          control={form.control}
          name="specialRequirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Requirements (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special requirements for your production? (e.g., specific configurations, additional accessories needed, or production details)"
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-6">
          <FormField
            control={form.control}
            name="internalNotes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Internal Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notes for internal use only (not visible to customer)"
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
            <p className="text-sm font-medium leading-none">Additional Documents (Optional)</p>
            <p className="text-sm text-muted-foreground mb-2">
              Upload any additional documents related to this rental.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {additionalDocuments.map((doc) => (
              <Card key={doc.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={doc.preview || "/placeholder.svg"}
                    alt="Additional document preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    onClick={() => removeAdditionalDocument(doc.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <CardContent className="p-2">
                  <p className="truncate text-xs text-muted-foreground">{doc.file.name}</p>
                </CardContent>
              </Card>
            ))}

            <label htmlFor="additional-upload">
              <div className="flex aspect-square cursor-pointer flex-col items-center justify-center border-dashed border rounded-md">
                <div className="flex h-full flex-col items-center justify-center p-6">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Upload Document</p>
                  <p className="text-xs text-muted-foreground">Click to browse</p>
                </div>
              </div>
              <input
                id="additional-upload"
                type="file"
                accept={ACCEPTED_ID_TYPES.join(",")}
                className="hidden"
                onChange={handleAdditionalDocumentChange}
              />
            </label>
          </div>
        </div>
      </div>

      {estimatedCost !== null && (
        <div className="rounded-lg border bg-primary/10 p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Rental Cost Breakdown</h2>
          <div className="space-y-2">
            <h3 className="font-medium text-sm">
              Equipment Rental ({rentalDuration} day{rentalDuration !== 1 ? "s" : ""})
            </h3>

            {selectedEquipmentItems.map((item) => (
              <div key={item.itemId} className="flex justify-between text-sm pl-4">
                <span>
                  {item.name} {item.quantity > 1 ? `(${item.quantity}x)` : ""}:
                </span>
                <span>
                  ${Number.parseFloat(item.daily_rate || "0").toFixed(2)} × {rentalDuration} days
                  {item.quantity > 1 ? ` × ${item.quantity}` : ""} = $
                  {(Number.parseFloat(item.daily_rate || "0") * rentalDuration * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}

            <div className="border-t pt-2 mt-2"></div>

            <div className="flex justify-between">
              <span>Equipment Subtotal:</span>
              <span>
                $
                {selectedEquipmentItems
                  .reduce(
                    (total, item) => total + Number.parseFloat(item.daily_rate || "0") * rentalDuration * item.quantity,
                    0,
                  )
                  .toFixed(2)}
              </span>
            </div>

            {watchInsuranceOption && (
              <div className="flex justify-between">
                <span>Insurance (10%):</span>
                <span>
                  +$
                  {(
                    selectedEquipmentItems.reduce(
                      (total, item) =>
                        total + Number.parseFloat(item.daily_rate || "0") * rentalDuration * item.quantity,
                      0,
                    ) * 0.1
                  ).toFixed(2)}
                </span>
              </div>
            )}

            {watchOperatorNeeded && (
              <div className="flex justify-between">
                <span>Equipment Operator:</span>
                <span>
                  +$150.00 × {rentalDuration} days = ${(150 * rentalDuration).toFixed(2)}
                </span>
              </div>
            )}

            {watchDeliveryOption === "delivery" && (
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>+$75.00</span>
              </div>
            )}

            <div className="flex justify-between border-t pt-2 font-bold">
              <span>Total Estimated Cost:</span>
              <span>${estimatedCost.toFixed(2)}</span>
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Note: Final cost may vary based on actual rental duration and any additional services required.
            </p>
          </div>
        </div>
      )}

      <FormField
        control={form.control}
        name="termsAccepted"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                I agree to the{" "}
                <a href="/terms" className="text-primary underline">
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-primary underline">
                  Privacy Policy
                </a>
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />

      <div className="flex justify-between space-x-2 mt-4">
        <Button type="button" variant="outline" onClick={goToPreviousTab}>
          Back
        </Button>
        <Button
          type="submit"
          className={initialData ? "w-auto" : "w-full"}
          disabled={isSubmitting || selectedEquipmentItems.length === 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {initialData ? "Updating..." : "Submitting..."}
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      </div>
    </div>
  )
}
