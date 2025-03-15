"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EquipmentRentalForm } from "@/components/equipment-rental-form"
import type { RentalRequest } from "@/lib/supabase/database.types"

interface AddRentOrderDialogProps {
  children: React.ReactNode
  initialData?: RentalRequest
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function AddRentOrderDialog({
  children,
  initialData,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: AddRentOrderDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)

  // Use controlled or uncontrolled state based on props
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
  const setOpen = setControlledOpen || setUncontrolledOpen

  // This ensures the form is only rendered when the dialog is open
  // which helps prevent context issues with useFormField
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Rent Order" : "Add New Rent Order"}</DialogTitle>
        </DialogHeader>
        {open && (
          <div className="mt-4">
            <EquipmentRentalForm onSuccess={() => setOpen(false)} isDialog={true} initialData={initialData} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
