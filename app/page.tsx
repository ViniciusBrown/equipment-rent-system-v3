import { RentOrdersScheduler } from "@/components/rent-orders/rent-orders-scheduler"
import { Button } from "@/components/ui/button"
import { AddRentOrderDialog } from "@/components/add-rent-order-dialog"
import { fetchRentalRequests } from "@/app/actions"
import { getCurrentDate } from "@/app/current-date"
import type { RentOrder, Status } from "@/components/rent-orders/types"

export default async function HomePage() { // Make page async
  // Fetch data on the server
  const rentalRequests = await fetchRentalRequests()

  // Map DB data to the format needed by the Kanban UI
  const rentOrders: RentOrder[] = rentalRequests.map((req) => ({
    id: req.id!,
    reference: req.reference_number!,
    customer: req.full_name!,
    date: req.created_at!,
    amount: req.estimated_cost!,
    status: req.status as Status,
    originalData: req,
  }))

  return (
    <div className="container py-8 max-w-[95%] mx-auto px-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Rent Orders</h1>
          <p className="text-muted-foreground">
            Manage and track all equipment rental orders in one place.
          </p>
        </div>
        <AddRentOrderDialog>
          <Button size="lg" className="gap-2">
            <span>New Rent Order</span>
            <span className="hidden md:inline">+</span>
          </Button>
        </AddRentOrderDialog>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1400px] pb-6">
          <RentOrdersScheduler
            initialRentOrders={rentOrders}
            serverDate={getCurrentDate()}
          />
        </div>
      </div>
    </div>
  )
}
