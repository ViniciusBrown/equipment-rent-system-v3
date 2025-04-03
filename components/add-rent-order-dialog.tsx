"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EquipmentRentalForm } from "@/components/equipment-rental-form"
import type { RentalRequest } from "@/lib/supabase/database.types"
import { cn } from "@/lib/utils"

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
    <div className="relative">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent
          className={cn(
            "fixed inset-0 flex items-center justify-center !p-0 !m-0 !max-w-none !w-screen !h-screen !translate-x-0 !translate-y-0 !top-0 !left-0 !rounded-none !border-0 !shadow-none !bg-transparent"
          )}
          onPointerDownOutside={() => setOpen(false)}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background rounded-lg border shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <DialogHeader>
              <DialogTitle>{initialData ? "Edit Rent Order" : "Add New Rent Order"}</DialogTitle>
            </DialogHeader>
            {open && (
              <div className="mt-4">
                <EquipmentRentalForm onSuccess={() => setOpen(false)} isDialog={true} initialData={initialData} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
