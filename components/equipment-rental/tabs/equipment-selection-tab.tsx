"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { useFormContext } from "react-hook-form"
import { ChevronDown, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import type { Equipment, SelectedEquipmentItem } from "../types"
import { EquipmentCard } from "../components/equipment-card"
import type { FormValues } from "../form-schema"

interface EquipmentSelectionTabProps {
  goToNextTab: () => void
  goToPreviousTab: () => void
  allEquipments: Equipment[]
  selectedEquipmentItems: SelectedEquipmentItem[]
  setSelectedEquipmentItems: React.Dispatch<React.SetStateAction<SelectedEquipmentItem[]>>
  isLoadingEquipment: boolean
}

export function EquipmentSelectionTab({
  goToNextTab,
  goToPreviousTab,
  allEquipments,
  selectedEquipmentItems,
  setSelectedEquipmentItems,
  isLoadingEquipment,
}: EquipmentSelectionTabProps) {
  const form = useFormContext<FormValues>()

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [showCategoryFilter, setShowCategoryFilter] = useState(false)

  const watchDeliveryOption = form.watch("deliveryOption")

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

  // Filter equipment by selected categories
  const categoryFilteredEquipment = useMemo(() => {
    if (selectedCategories.length === 0) return filteredEquipment
    return filteredEquipment.filter((item) => item.brand && selectedCategories.includes(item.brand))
  }, [filteredEquipment, selectedCategories])

  // Toggle category selection for filtering
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  // Add equipment to the selected items
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

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Equipment Selection</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Select a category, then add equipment items to your rental. You can add multiple different items from various
          categories.
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
                <EquipmentCard key={equipment.id} equipment={equipment} onAddEquipment={handleAddEquipment} />
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
                    <Textarea placeholder="Enter your full delivery address" className="min-h-[80px]" {...field} />
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
    </div>
  )
}
