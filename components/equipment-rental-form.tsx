"use client"

// Organize imports alphabetically and group by type
import type React from "react"
import type { RentOrder } from "@/lib/supabase/database.types"
import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  Filter,
  Loader2,
  Plus,
  Upload,
  User,
  X,
} from "lucide-react"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { fetchEquipments, getEquipmentByCategory, submitRentalRequest } from "@/app/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_ID_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]

// Type definitions
export type Equipment = {
  brand: string | null
  daily_rate: string | null
  description: string | null
  id: number
  name: string | null
  stock: string | null
}

type TabType = "client" | "equipment" | "payment" | "additional"

type FileWithPreview = {
  file: File
  preview: string
  id: string
}

type SelectedEquipmentItem = Equipment & {
  quantity: number
  itemId: string // Unique ID for this selection
}

type EquipmentRentalFormProps = {
  onSuccess?: () => void
  isDialog?: boolean
  initialData?: Partial<RentOrder>
}

// Fallback equipment data in case the database fetch fails
const FALLBACK_EQUIPMENT: Equipment[] = [
  {
    id: 1,
    name: "ARRI Alexa Mini",
    brand: "ARRI",
    daily_rate: "650",
    description: "Professional digital cinema camera",
    stock: "5",
  },
  {
    id: 2,
    name: "RED DSMC2 GEMINI",
    brand: "RED",
    daily_rate: "550",
    description: "Digital cinema camera",
    stock: "3",
  },
  {
    id: 3,
    name: "Sony FX9",
    brand: "Sony",
    daily_rate: "350",
    description: "Full-frame cinema camera",
    stock: "4",
  },
  {
    id: 4,
    name: "Canon Cinema Prime Set",
    brand: "Canon",
    daily_rate: "275",
    description: "Set of cinema prime lenses",
    stock: "2",
  },
  {
    id: 5,
    name: "Zeiss Supreme Prime Set",
    brand: "Zeiss",
    daily_rate: "450",
    description: "Premium cinema lenses",
    stock: "2",
  },
  {
    id: 6,
    name: "ARRI SkyPanel S60-C",
    brand: "ARRI",
    daily_rate: "180",
    description: "LED soft light",
    stock: "6",
  },
  {
    id: 7,
    name: "Sound Devices MixPre-10 II",
    brand: "Sound Devices",
    daily_rate: "120",
    description: "Audio recorder",
    stock: "3",
  },
  {
    id: 8,
    name: "Dana Dolly Kit",
    brand: "Dana",
    daily_rate: "175",
    description: "Camera dolly system",
    stock: "2",
  },
  {
    id: 9,
    name: "Director's Monitor Package",
    brand: "SmallHD",
    daily_rate: "220",
    description: "Monitor package",
    stock: "4",
  },
]

// Form validation schema
const formSchema = z.object({
  // Personal Information
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  company: z.string().optional(),

  // Rental Details
  category: z.string().optional(),
  rentalStart: z.date({
    required_error: "Start date is required.",
  }),
  rentalEnd: z.date({
    required_error: "End date is required.",
  }),

  // Delivery Options
  deliveryOption: z.enum(["pickup", "delivery"], {
    required_error: "Please select a delivery option.",
  }),
  deliveryAddress: z
    .string()
    .optional()
    .refine((val) => !val || val.length > 0, { message: "Delivery address is required when delivery is selected" }),

  // Additional Options
  insuranceOption: z.boolean().default(false),
  operatorNeeded: z.boolean().default(false),

  // Payment Information
  paymentMethod: z.enum(["credit", "debit", "invoice"], {
    required_error: "Please select a payment method.",
  }),
  paymentStatus: z
    .enum(["pending", "paid", "partial"], {
      required_error: "Please select a payment status.",
    })
    .default("pending"),
  invoiceNumber: z.string().optional(),
  paymentNotes: z.string().optional(),

  // Additional Information
  specialRequirements: z.string().optional(),
  internalNotes: z.string().optional(),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions.",
  }),
})

export function EquipmentRentalForm({ onSuccess, isDialog = false, initialData }: EquipmentRentalFormProps) {
  const router = useRouter()

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [equipmentOptions, setEquipmentOptions] = useState<Equipment[]>([])
  const [selectedEquipmentItems, setSelectedEquipmentItems] = useState<SelectedEquipmentItem[]>([])
  const [idDocuments, setIdDocuments] = useState<FileWithPreview[]>([])
  const [paymentDocuments, setPaymentDocuments] = useState<FileWithPreview[]>([])
  const [additionalDocuments, setAdditionalDocuments] = useState<FileWithPreview[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingEquipment, setIsLoadingEquipment] = useState(false)
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null)
  const [equipmentBreakdown, setEquipmentBreakdown] = useState<Record<string, number>>({})
  const [allEquipments, setAllEquipments] = useState<Equipment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<TabType>("client")
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<number, boolean>>({})
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)

  // Prepare default values from initialData if provided
  const defaultValues = useMemo(() => {
    if (!initialData) {
      return {
        fullName: "",
        email: "",
        phone: "",
        company: "",
        rentalStart: undefined,
        rentalEnd: undefined,
        deliveryOption: "pickup",
        deliveryAddress: "",
        insuranceOption: false,
        operatorNeeded: false,
        paymentMethod: "credit",
        paymentStatus: "pending",
        invoiceNumber: "",
        paymentNotes: "",
        specialRequirements: "",
        internalNotes: "",
        termsAccepted: false,
      }
    }

    // Convert initialData to form values
    return {
      fullName: initialData.full_name || "",
      email: initialData.email || "",
      phone: initialData.phone || "",
      company: initialData.company || "",
      // Convert string date to Date object if available
      rentalStart: initialData.rental_start ? new Date(initialData.rental_start) : undefined,
      rentalEnd: initialData.rental_end ? new Date(initialData.rental_end) : undefined,
      deliveryOption: initialData.delivery_option || "pickup",
      insuranceOption: initialData.insurance_option || false,
      operatorNeeded: initialData.operator_needed || false,
      paymentMethod: initialData.payment_method || "credit",
      paymentStatus: initialData.payment_status || "pending",
      invoiceNumber: initialData.invoice_number || "",
      paymentNotes: initialData.payment_notes || "",
      specialRequirements: initialData.special_requirements || "",
      internalNotes: initialData.internal_notes || "",
      termsAccepted: true, // Auto-accept for existing orders
    }
  }, [initialData])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  // Watch form values for calculations and conditional logic
  const watchCategory = form.watch("category")
  const watchRentalStart = form.watch("rentalStart")
  const watchRentalEnd = form.watch("rentalEnd")
  const watchDeliveryOption = form.watch("deliveryOption")
  const watchInsuranceOption = form.watch("insuranceOption")
  const watchOperatorNeeded = form.watch("operatorNeeded")

  // Load all equipment on component mount
  useEffect(() => {
    loadAllEquipment()
  }, [])

  // Fetch equipment options when category changes
  useEffect(() => {
    if (!watchCategory) return
    fetchEquipmentByCategory(watchCategory)
  }, [watchCategory])

  // Calculate estimated cost when relevant fields change
  useEffect(() => {
    if (selectedEquipmentItems.length > 0 && watchRentalStart && watchRentalEnd) {
      calculateEstimatedCost(
        selectedEquipmentItems,
        watchRentalStart,
        watchRentalEnd,
        watchInsuranceOption,
        watchOperatorNeeded,
        watchDeliveryOption,
      )
    } else {
      setEstimatedCost(null)
      setEquipmentBreakdown({})
    }
  }, [
    selectedEquipmentItems,
    watchRentalStart,
    watchRentalEnd,
    watchInsuranceOption,
    watchOperatorNeeded,
    watchDeliveryOption,
  ])

  // Filter equipment based on search term
  const filteredEquipment = useMemo(() => {
    if (!searchTerm.trim()) return allEquipments

    const searchLower = searchTerm.toLowerCase()
    return allEquipments.filter(
      (item) =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.brand?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower),
    )
  }, [allEquipments, searchTerm])

  // Filter equipment by selected categories
  const categoryFilteredEquipment = useMemo(() => {
    if (selectedCategories.length === 0) return filteredEquipment
    return filteredEquipment.filter((item) => item.brand && selectedCategories.includes(item.brand))
  }, [filteredEquipment, selectedCategories])

  // Get unique categories from equipment
  const categories = useMemo(() => {
    const categorySet = new Set<string>()
    allEquipments.forEach((item) => {
      if (item.brand) {
        categorySet.add(item.brand)
      }
    })
    return Array.from(categorySet)
  }, [allEquipments])

  // Group equipment by brand for display
  const equipmentByBrand = useMemo(() => {
    return selectedEquipmentItems.reduce(
      (acc, item) => {
        const brand = item.brand || "Other"
        if (!acc[brand]) acc[brand] = []
        acc[brand].push(item)
        return acc
      },
      {} as Record<string, SelectedEquipmentItem[]>,
    )
  }, [selectedEquipmentItems])

  // Calculate rental duration in days
  const rentalDuration = useMemo(() => {
    if (!watchRentalStart || !watchRentalEnd) return 0

    return Math.ceil(
      Math.abs(new Date(watchRentalEnd).getTime() - new Date(watchRentalStart).getTime()) / (1000 * 60 * 60 * 24),
    )
  }, [watchRentalStart, watchRentalEnd])

  // Update the submit button text based on whether we're editing or creating
  const submitButtonText = initialData ? "Update Rental Request" : "Submit Rental Request"

  /**
   * Load all equipment from the database or fallback to static data
   */
  async function loadAllEquipment() {
    setIsLoadingEquipment(true)
    try {
      const data = await fetchEquipments()
      setAllEquipments(data?.length > 0 ? data : FALLBACK_EQUIPMENT)
    } catch (error) {
      console.error("Error fetching equipment:", error)
      setAllEquipments(FALLBACK_EQUIPMENT)
    } finally {
      setIsLoadingEquipment(false)
    }
  }

  /**
   * Fetch equipment by category
   */
  async function fetchEquipmentByCategory(category: string) {
    setIsLoadingEquipment(true)
    try {
      const data = await getEquipmentByCategory(category)
      setEquipmentOptions(data?.length > 0 ? data : FALLBACK_EQUIPMENT)
    } catch (error) {
      console.error("Error fetching equipment by category:", error)
      setEquipmentOptions(FALLBACK_EQUIPMENT)
    } finally {
      setIsLoadingEquipment(false)
      setSelectedCategory(category)
    }
  }

  /**
   * Calculate the estimated cost of the rental
   */
  const calculateEstimatedCost = (
    equipmentItems: SelectedEquipmentItem[],
    startDate: Date,
    endDate: Date,
    insurance: boolean,
    operator: boolean,
    deliveryOption: string,
  ) => {
    if (equipmentItems.length === 0 || !startDate || !endDate) {
      setEstimatedCost(null)
      setEquipmentBreakdown({})
      return
    }

    // Calculate number of days (including partial days)
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays <= 0) {
      setEstimatedCost(null)
      setEquipmentBreakdown({})
      return
    }

    // Calculate base cost for all equipment
    let totalEquipmentCost = 0
    const breakdown: Record<string, number> = {}

    equipmentItems.forEach((item) => {
      const dailyRate = Number.parseFloat(item.daily_rate || "0")
      const itemCost = dailyRate * diffDays * item.quantity
      totalEquipmentCost += itemCost
      breakdown[item.itemId] = itemCost
    })

    // Base cost = sum of (daily rate * number of days * quantity) for each item
    let cost = totalEquipmentCost

    // Add insurance if selected (10% of base cost)
    if (insurance) {
      cost += totalEquipmentCost * 0.1
    }

    // Add operator if selected ($150 per day)
    if (operator) {
      cost += 150 * diffDays
    }

    // Add delivery fee if selected
    if (deliveryOption === "delivery") {
      cost += 75 // Flat delivery fee
    }

    setEstimatedCost(cost)
    setEquipmentBreakdown(breakdown)
  }

  /**
   * Add equipment to the selected items
   */
  const handleAddEquipment = (equipment: Equipment) => {
    // Check if this equipment is already in the list
    const existingItemIndex = selectedEquipmentItems.findIndex((item) => item.id === equipment.id)

    if (existingItemIndex >= 0) {
      // Increment quantity if already in the list
      const updatedItems = [...selectedEquipmentItems]
      updatedItems[existingItemIndex].quantity += 1
      setSelectedEquipmentItems(updatedItems)
    } else {
      // Add new item with quantity 1
      setSelectedEquipmentItems([
        ...selectedEquipmentItems,
        {
          ...equipment,
          quantity: 1,
          itemId: crypto.randomUUID(),
        },
      ])
    }

    // Show success toast
    toast({
      title: "Equipment Added",
      description: `${equipment.name} has been added to your rental.`,
    })
  }

  /**
   * Remove equipment from the selected items
   */
  const handleRemoveEquipment = (itemId: string) => {
    setSelectedEquipmentItems((prev) => prev.filter((item) => item.itemId !== itemId))
  }

  /**
   * Update the quantity of a selected equipment item
   */
  const updateEquipmentQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    setSelectedEquipmentItems((prev) =>
      prev.map((item) => (item.itemId === itemId ? { ...item, quantity: newQuantity } : item)),
    )
  }

  /**
   * Handle ID document upload
   */
  const handleIdDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDocumentUpload(e, setIdDocuments)
  }

  /**
   * Handle payment document upload
   */
  const handlePaymentDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDocumentUpload(e, setPaymentDocuments)
  }

  /**
   * Handle additional document upload
   */
  const handleAdditionalDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDocumentUpload(e, setAdditionalDocuments)
  }

  /**
   * Generic document upload handler
   */
  const handleDocumentUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setDocuments: React.Dispatch<React.SetStateAction<FileWithPreview[]>>,
  ) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newDocuments: FileWithPreview[] = []

    Array.from(files).forEach((file) => {
      // Validate file size and type
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Error",
          description: `${file.name} is too large. Max size is 5MB.`,
          variant: "destructive",
        })
        return
      }

      if (!ACCEPTED_ID_TYPES.includes(file.type)) {
        toast({
          title: "Error",
          description: `${file.name} has an unsupported format.`,
          variant: "destructive",
        })
        return
      }

      // Create preview for images
      let preview = ""
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file)
      } else {
        // For PDFs, use a placeholder
        preview = "/placeholder.svg?height=100&width=100"
      }

      newDocuments.push({
        file,
        preview,
        id: crypto.randomUUID(),
      })
    })

    setDocuments((prev) => [...prev, ...newDocuments])
    e.target.value = ""
  }

  /**
   * Remove ID document
   */
  const removeIdDocument = (id: string) => {
    removeDocument(id, setIdDocuments)
  }

  /**
   * Remove payment document
   */
  const removePaymentDocument = (id: string) => {
    removeDocument(id, setPaymentDocuments)
  }

  /**
   * Remove additional document
   */
  const removeAdditionalDocument = (id: string) => {
    removeDocument(id, setAdditionalDocuments)
  }

  /**
   * Generic document removal handler
   */
  const removeDocument = (id: string, setDocuments: React.Dispatch<React.SetStateAction<FileWithPreview[]>>) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))
  }

  /**
   * Toggle description expansion
   */
  const toggleDescription = (id: number) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  /**
   * Toggle category selection for filtering
   */
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  /**
   * Navigate to the next tab
   */
  const goToNextTab = () => {
    if (activeTab === "client") setActiveTab("equipment")
    else if (activeTab === "equipment") setActiveTab("payment")
    else if (activeTab === "payment") setActiveTab("additional")
  }

  /**
   * Navigate to the previous tab
   */
  const goToPreviousTab = () => {
    if (activeTab === "equipment") setActiveTab("client")
    else if (activeTab === "payment") setActiveTab("equipment")
    else if (activeTab === "additional") setActiveTab("payment")
  }

  /**
   * Form submission handler
   */
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Validate that end date is after start date
    if (values.rentalEnd <= values.rentalStart) {
      form.setError("rentalEnd", {
        type: "manual",
        message: "End date must be after start date",
      })
      return
    }

    // Validate delivery address if delivery is selected
    if (values.deliveryOption === "delivery" && (!values.deliveryAddress || values.deliveryAddress.trim() === "")) {
      form.setError("deliveryAddress", {
        type: "manual",
        message: "Delivery address is required when delivery is selected",
      })
      return
    }

    // Validate that at least one equipment item is selected
    if (selectedEquipmentItems.length === 0) {
      toast({
        title: "No Equipment Selected",
        description: "Please select at least one piece of equipment to rent.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData = new FormData()

      // Add form values to FormData
      Object.entries(values).forEach(([key, value]) => {
        if (value instanceof Date) {
          formData.append(key, value.toISOString())
        } else if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false")
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      // Add estimated cost
      if (estimatedCost !== null) {
        formData.append("estimatedCost", String(estimatedCost))
      }

      // Add equipment items
      selectedEquipmentItems.forEach((item, index) => {
        formData.append(`equipmentItems[${index}][id]`, String(item.id))
        formData.append(`equipmentItems[${index}][name]`, item.name || "")
        formData.append(`equipmentItems[${index}][daily_rate]`, String(item.daily_rate || "0"))
        formData.append(`equipmentItems[${index}][quantity]`, String(item.quantity))
      })

      // Add documents to FormData
      idDocuments.forEach((doc) => {
        formData.append(`idDocuments`, doc.file)
      })

      paymentDocuments.forEach((doc) => {
        formData.append(`paymentDocuments`, doc.file)
      })

      additionalDocuments.forEach((doc) => {
        formData.append(`additionalDocuments`, doc.file)
      })

      // Submit the rental request
      const result = await submitRentalRequest(formData, initialData?.id)

      if (!result.success) {
        throw new Error(result.error || "Failed to submit rental request")
      }

      toast({
        title: "Rental Request Submitted",
        description: `Your rental request has been successfully submitted. Reference: ${result.referenceNumber}`,
      })

      // Clean up document previews
      const cleanupDocuments = (documents: FileWithPreview[]) => {
        documents.forEach((doc) => {
          if (doc.preview && doc.preview !== "/placeholder.svg?height=100&width=100") {
            URL.revokeObjectURL(doc.preview)
          }
        })
      }

      cleanupDocuments(idDocuments)
      cleanupDocuments(paymentDocuments)
      cleanupDocuments(additionalDocuments)

      // Reset form and state
      form.reset()
      setIdDocuments([])
      setPaymentDocuments([])
      setAdditionalDocuments([])
      setSelectedCategory(null)
      setEquipmentOptions([])
      setSelectedEquipmentItems([])
      setEstimatedCost(null)
      setEquipmentBreakdown({})

      if (onSuccess && isDialog) {
        onSuccess()
      } else {
        // Only redirect if not in dialog mode
        router.push(`/rental-confirmation?ref=${result.referenceNumber}`)
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        title: "Error",
        description: "There was a problem submitting your rental request. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Modify the submit button to be more compact in dialog mode
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-${isDialog ? "4" : "8"}`}>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="client" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Client Information</span>
              </TabsTrigger>
              <TabsTrigger value="equipment" className="flex items-center gap-2">
                <span className="hidden sm:inline">Equipment</span>
                {selectedEquipmentItems.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedEquipmentItems.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="payment" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payment</span>
              </TabsTrigger>
              <TabsTrigger value="additional" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Additional</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="client" className="space-y-4">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Rental Dates</h2>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="rentalStart"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Rental Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                new Date(field.value).toLocaleDateString()
                              ) : (
                                <span>Select start date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) field.onChange(date)
                            }}
                            initialFocus
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rentalEnd"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Rental End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? new Date(field.value).toLocaleDateString() : <span>Select end date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) field.onChange(date)
                            }}
                            initialFocus
                            disabled={(date) => {
                              const startDate = form.getValues("rentalStart")
                              return startDate
                                ? date <= new Date(startDate)
                                : date < new Date(new Date().setHours(0, 0, 0, 0))
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {rentalDuration > 0 && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Rental duration:{" "}
                  <span className="font-medium">
                    {rentalDuration} day{rentalDuration !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <Button type="button" onClick={goToNextTab}>
                Next
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="equipment" className="space-y-4">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Equipment Selection</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Select a category, then add equipment items to your rental. You can add multiple different items from
                various categories.
              </p>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Category</FormLabel>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="">Select a category</option>
                          <option value="cameras">Cameras</option>
                          <option value="lenses">Lenses</option>
                          <option value="lighting">Lighting</option>
                          <option value="audio">Audio Equipment</option>
                          <option value="grip">Grip Equipment</option>
                          <option value="production">Production Equipment</option>
                        </select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormLabel htmlFor="equipment-select">Search Equipment</FormLabel>
                  <Input
                    type="search"
                    placeholder="Search by name, brand, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base font-medium">Available Equipment</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                    className="flex items-center gap-1"
                  >
                    <Filter className="h-4 w-4" />
                    Filter by Brand
                    <ChevronDown className={`h-4 w-4 transition-transform ${showCategoryFilter ? "rotate-180" : ""}`} />
                  </Button>
                </div>

                {showCategoryFilter && (
                  <div className="mb-4 p-4 border rounded-md bg-muted/30">
                    <h4 className="text-sm font-medium mb-2">Filter by Brand:</h4>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <Badge
                          key={category}
                          variant={selectedCategories.includes(category) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleCategory(category)}
                        >
                          {category}
                        </Badge>
                      ))}
                      {selectedCategories.length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCategories([])}
                          className="text-xs h-6"
                        >
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <ScrollArea className="h-[660px] rounded-md border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {categoryFilteredEquipment.map((equipment) => (
                      <Card key={equipment.id} className="overflow-hidden h-[220px] flex flex-col">
                        <CardContent className="p-4 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium line-clamp-1">{equipment.name}</h3>
                              <Badge variant="outline" className="text-xs mt-1">
                                {equipment.brand || "Other"}
                              </Badge>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => handleAddEquipment(equipment)}
                              className="h-8 w-8 p-0 ml-2"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span>${equipment.daily_rate}/day</span>
                            <span className="text-xs">Stock: {equipment.stock}</span>
                          </div>

                          {equipment.description && (
                            <div className="mt-2 flex-1 relative">
                              {expandedDescriptions[equipment.id] ? (
                                <ScrollArea className="h-16 pr-4">
                                  <div className="text-xs text-muted-foreground">{equipment.description}</div>
                                </ScrollArea>
                              ) : (
                                <div className="text-xs text-muted-foreground line-clamp-3">
                                  {equipment.description}
                                </div>
                              )}
                              {equipment.description.length > 120 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleDescription(equipment.id)}
                                  className="text-xs h-6 mt-1 absolute bottom-0 right-0 bg-card"
                                >
                                  {expandedDescriptions[equipment.id] ? (
                                    <>
                                      Less <ChevronUp className="h-3 w-3 ml-1" />
                                    </>
                                  ) : (
                                    <>
                                      More <ChevronDown className="h-3 w-3 ml-1" />
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>

                {categoryFilteredEquipment.length === 0 && (
                  <div className="text-center py-8 border rounded-md bg-muted/30">
                    <p className="text-muted-foreground">No equipment found matching your criteria.</p>
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => {
                        setSearchTerm("")
                        setSelectedCategories([])
                      }}
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Delivery Options</h2>
              <FormField
                control={form.control}
                name="deliveryOption"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Delivery Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="pickup" />
                          </FormControl>
                          <FormLabel className="font-normal">Pickup from our location</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="delivery" />
                          </FormControl>
                          <FormLabel className="font-normal">Delivery to your location (+$75 fee)</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchDeliveryOption === "delivery" && (
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="deliveryAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter your full delivery address"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Additional Options</h2>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="insuranceOption"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Rental Insurance</FormLabel>
                        <FormDescription>
                          Add insurance coverage for 10% of the rental cost. Covers accidental damage.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="operatorNeeded"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Equipment Operator</FormLabel>
                        <FormDescription>Include a trained operator with your rental (+$150/day).</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
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
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
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
          </TabsContent>

          <TabsContent value="additional" className="space-y-4">
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
                          (total, item) =>
                            total + Number.parseFloat(item.daily_rate || "0") * rentalDuration * item.quantity,
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
                className={isDialog ? "w-auto" : "w-full"}
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
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  )
}
