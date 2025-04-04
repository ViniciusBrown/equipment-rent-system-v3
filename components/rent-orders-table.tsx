"use client"

import { useState } from "react"
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { RentalRequest } from "@/lib/supabase/database.types"

// Define the status type
type Status = "pending" | "success" | "warning"

// Define the rent order type for the table display
export type RentOrder = {
  id: string
  reference: string
  customer: string
  date: string
  amount: number
  payment_ready: Status
  document_emitted: Status
  initial_inspection: Status
  rented: Status
  returned_equipment: Status
  final_inspection: Status
  // Additional fields from the original rental request
  originalData: RentalRequest
}

// Sample data
const data: RentOrder[] = [
  {
    id: "1",
    reference: "RNT-123456",
    customer: "John Doe",
    date: "2023-05-15",
    amount: 1250.0,
    payment_ready: "success",
    document_emitted: "success",
    initial_inspection: "success",
    rented: "success",
    returned_equipment: "pending",
    final_inspection: "pending",
    originalData: {
      id: "1",
      full_name: "John Doe",
      email: "john.doe@example.com",
      phone: "555-123-4567",
      equipment_items: [{ id: "cam1", name: "ARRI Alexa Mini", daily_rate: 650, quantity: 1 }],
      rental_start: "2023-05-15",
      rental_end: "2023-05-20",
      delivery_option: "pickup",
      insurance_option: false,
      operator_needed: false,
      payment_method: "credit",
      special_requirements: "",
      estimated_cost: 1250.0,
      status: "pending",
      reference_number: "RNT-123456",
      payment_ready: "success",
      document_emitted: "success",
      initial_inspection: "success",
      rented: "success",
      returned_equipment: "pending",
      final_inspection: "pending",
    },
  },
  {
    id: "2",
    reference: "RNT-789012",
    customer: "Jane Smith",
    date: "2023-05-18",
    amount: 2340.5,
    payment_ready: "success",
    document_emitted: "success",
    initial_inspection: "warning",
    rented: "success",
    returned_equipment: "warning",
    final_inspection: "pending",
    originalData: {
      id: "2",
      full_name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "555-987-6543",
      equipment_items: [{ id: "lens2", name: "Zeiss Supreme Prime Set", daily_rate: 450, quantity: 1 }],
      rental_start: "2023-05-18",
      rental_end: "2023-05-25",
      delivery_option: "delivery",
      delivery_address: "123 Main St, Anytown, USA",
      insurance_option: true,
      operator_needed: true,
      payment_method: "credit",
      special_requirements: "",
      estimated_cost: 2340.5,
      status: "pending",
      reference_number: "RNT-789012",
      payment_ready: "success",
      document_emitted: "success",
      initial_inspection: "warning",
      rented: "success",
      returned_equipment: "warning",
      final_inspection: "pending",
    },
  },
  {
    id: "3",
    reference: "RNT-345678",
    customer: "Bob Johnson",
    date: "2023-05-20",
    amount: 890.75,
    payment_ready: "pending",
    document_emitted: "pending",
    initial_inspection: "pending",
    rented: "pending",
    returned_equipment: "pending",
    final_inspection: "pending",
    originalData: {
      id: "3",
      full_name: "Bob Johnson",
      email: "bob.johnson@example.com",
      phone: "555-456-7890",
      equipment_items: [{ id: "audio3", name: "Wireless Lavalier Kit", daily_rate: 85, quantity: 2 }],
      rental_start: "2023-05-20",
      rental_end: "2023-05-25",
      delivery_option: "pickup",
      insurance_option: false,
      operator_needed: false,
      payment_method: "debit",
      special_requirements: "",
      estimated_cost: 890.75,
      status: "pending",
      reference_number: "RNT-345678",
      payment_ready: "pending",
      document_emitted: "pending",
      initial_inspection: "pending",
      rented: "pending",
      returned_equipment: "pending",
      final_inspection: "pending",
    },
  },
  {
    id: "4",
    reference: "RNT-901234",
    customer: "Alice Williams",
    date: "2023-05-22",
    amount: 1750.25,
    payment_ready: "success",
    document_emitted: "success",
    initial_inspection: "success",
    rented: "success",
    returned_equipment: "success",
    final_inspection: "warning",
    originalData: {
      id: "4",
      full_name: "Alice Williams",
      email: "alice.williams@example.com",
      phone: "555-789-0123",
      equipment_items: [{ id: "light1", name: "ARRI SkyPanel S60-C", daily_rate: 180, quantity: 2 }],
      rental_start: "2023-05-22",
      rental_end: "2023-05-27",
      delivery_option: "delivery",
      delivery_address: "456 Oak St, Somewhere, USA",
      insurance_option: true,
      operator_needed: false,
      payment_method: "credit",
      special_requirements: "",
      estimated_cost: 1750.25,
      status: "pending",
      reference_number: "RNT-901234",
      payment_ready: "success",
      document_emitted: "success",
      initial_inspection: "success",
      rented: "success",
      returned_equipment: "success",
      final_inspection: "warning",
    },
  },
  {
    id: "5",
    reference: "RNT-567890",
    customer: "Charlie Brown",
    date: "2023-05-25",
    amount: 3200.0,
    payment_ready: "warning",
    document_emitted: "pending",
    initial_inspection: "pending",
    rented: "pending",
    returned_equipment: "pending",
    final_inspection: "pending",
    originalData: {
      id: "5",
      full_name: "Charlie Brown",
      email: "charlie.brown@example.com",
      phone: "555-234-5678",
      equipment_items: [
        { id: "prod1", name: "Director's Monitor Package", daily_rate: 220, quantity: 1 },
        { id: "prod2", name: "Teradek Wireless Video System", daily_rate: 180, quantity: 1 },
      ],
      rental_start: "2023-05-25",
      rental_end: "2023-06-01",
      delivery_option: "pickup",
      insurance_option: true,
      operator_needed: true,
      payment_method: "invoice",
      special_requirements: "Need extra batteries for all equipment",
      estimated_cost: 3200.0,
      status: "pending",
      reference_number: "RNT-567890",
      payment_ready: "warning",
      document_emitted: "pending",
      initial_inspection: "pending",
      rented: "pending",
      returned_equipment: "pending",
      final_inspection: "pending",
    },
  },
]

// Status badge component
const StatusBadge = ({ status, label }: { status: Status; label: string }) => {
  const variants = {
    pending: "secondary",
    success: "success",
    warning: "warning",
  } as const

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variants[status]} className="text-[10px] px-1.5 py-0 font-normal mr-1 mb-1">
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {label}: {status}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function RentOrdersTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [selectedOrder, setSelectedOrder] = useState<RentOrder | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  const columns: ColumnDef<RentOrder>[] = [
    {
      accessorKey: "reference",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Reference
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue("reference")}</div>,
    },
    {
      accessorKey: "customer",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Customer
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "date",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        // Format the date
        const dateValue = row.getValue("date")
        const date = new Date(dateValue as string)
        return <div>{date.toLocaleDateString()}</div>
      },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Amount
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = Number.parseFloat(row.getValue("amount") as string)
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount)
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="flex flex-wrap max-w-[180px]">
            <StatusBadge status={order.payment_ready} label="Payment" />
            <StatusBadge status={order.document_emitted} label="Document" />
            <StatusBadge status={order.initial_inspection} label="Initial Insp" />
            <StatusBadge status={order.rented} label="Rented" />
            <StatusBadge status={order.returned_equipment} label="Returned" />
            <StatusBadge status={order.final_inspection} label="Final Insp" />
          </div>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const order = row.original

        const handleViewDetails = () => {
          setSelectedOrder(order)
          setDetailsDialogOpen(true)
        }

        return (
          <div data-no-row-click className="action-menu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(order.id)}>
                  Copy order ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleViewDetails}>View details</DropdownMenuItem>
                <DropdownMenuItem>Update status</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      {/* Details Dialog placeholder - dialog component has been removed */}

      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id.replace(/_/g, " ")}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={(e) => {
                    // Prevent row click when clicking on actions dropdown or its children
                    if (
                      e.target instanceof HTMLElement &&
                      (e.target.closest("[data-no-row-click]") || e.target.closest(".action-menu"))
                    ) {
                      return
                    }
                    setSelectedOrder(row.original)
                    setDetailsDialogOpen(true)
                  }}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
          selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
