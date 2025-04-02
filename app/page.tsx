import { RentOrdersKanban } from "@/components/rent-orders/rent-orders-kanban"
import { Button } from "@/components/ui/button"
import { AddRentOrderDialog } from "@/components/add-rent-order-dialog"

export default function HomePage() {
  return (
    <div className="container py-10 max-w-[95%]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Rent Orders</h1>
        <AddRentOrderDialog>
          <Button>Add Rent Order</Button>
        </AddRentOrderDialog>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          <RentOrdersKanban />
        </div>
      </div>
    </div>
  )
}
