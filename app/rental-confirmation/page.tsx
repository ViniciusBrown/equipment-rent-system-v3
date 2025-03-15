import Link from "next/link"
import { CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function RentalConfirmationPage({ searchParams }: { searchParams: { ref?: string } }) {
  const referenceNumber = searchParams.ref || "N/A"

  return (
    <div className="container flex h-[80vh] flex-col items-center justify-center py-10">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="mb-2 text-3xl font-bold">Rental Request Submitted</h1>
        <p className="mb-2 text-muted-foreground">
          Thank you for your equipment rental request. We've received your information and will contact you shortly to
          confirm the details for your production.
        </p>
        <div className="mb-6 p-4 bg-muted rounded-md">
          <p className="font-medium">Reference Number:</p>
          <p className="text-xl font-bold">{referenceNumber}</p>
          <p className="text-xs text-muted-foreground mt-2">Please save this reference number for your records.</p>
        </div>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">Return to Rent Orders</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
