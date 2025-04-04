'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { fetchEquipments } from '@/app/actions'
import { MultiSelect } from '@/components/ui/combobox'
import { EquipmentItem, Equipment, EquipmentSelectorProps } from '../types'
import { EquipmentCard } from './EquipmentCard'
import { SelectedEquipment } from './SelectedEquipment'

export function EquipmentSelector({ value, onChange }: EquipmentSelectorProps) {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  // Fetch available equipment on component mount
  useEffect(() => {
    const getEquipment = async () => {
      try {
        const data = await fetchEquipments()
        setEquipmentList(data)
      } catch (error) {
        console.error('Error fetching equipment:', error)
      } finally {
        setLoading(false)
      }
    }

    getEquipment()
  }, [])

  // Extract unique brands and categories from equipment list
  const { brands, categories } = useMemo(() => {
    const brandSet = new Set<string>()
    const categorySet = new Set<string>()

    equipmentList.forEach(equipment => {
      if (equipment.brand) {
        brandSet.add(equipment.brand)
      }
      if (equipment.category) {
        categorySet.add(equipment.category)
      }
    })

    return {
      brands: Array.from(brandSet).sort(),
      categories: Array.from(categorySet).sort()
    }
  }, [equipmentList])

  // Filter equipment based on search query and selected brands
  const filteredEquipment = useMemo(() => {
    return equipmentList.filter(equipment => {
      // Filter by search query
      const matchesSearch = searchQuery === '' ||
        equipment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (equipment.description?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (equipment.brand?.toLowerCase().includes(searchQuery.toLowerCase()))

      // Filter by selected brands
      const matchesBrand = selectedBrands.length === 0 ||
        (equipment.brand && selectedBrands.includes(equipment.brand))

      // Filter by selected categories
      const matchesCategory = selectedCategories.length === 0 ||
        (equipment.category && selectedCategories.includes(equipment.category))

      // Filter out already selected items
      const isNotSelected = !selectedItems.includes(String(equipment.id))

      return matchesSearch && matchesBrand && matchesCategory && isNotSelected
    })
  }, [equipmentList, searchQuery, selectedBrands, selectedCategories, selectedItems])

  // Update selected items when value changes
  useEffect(() => {
    setSelectedItems(value.map(item => item.id))
  }, [value])

  // Add a new equipment item
  const addEquipmentItem = (equipment: Equipment) => {
    const newItem: EquipmentItem = {
      id: String(equipment.id),
      name: equipment.name,
      daily_rate: typeof equipment.daily_rate === 'string'
        ? parseFloat(String(equipment.daily_rate).replace('R$', '').replace('.', '').replace(',', '.').trim()) || 0
        : Number(equipment.daily_rate) || 0,
      quantity: 1,
    }

    onChange([...value, newItem])
  }

  // Remove an equipment item
  const removeEquipmentItem = (index: number) => {
    const newItems = [...value]
    newItems.splice(index, 1)
    onChange(newItems)
  }

  // Update an equipment item quantity
  const updateEquipmentQuantity = (index: number, newQuantity: number) => {
    const newItems = [...value]
    newItems[index] = {
      ...newItems[index],
      quantity: newQuantity,
    }
    onChange(newItems)
  }

  // Handle brand filter changes
  const handleBrandFilterChange = (selected: string[]) => {
    setSelectedBrands(selected)
  }

  // Handle category filter changes
  const handleCategoryFilterChange = (selected: string[]) => {
    setSelectedCategories(selected)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedBrands([])
    setSelectedCategories([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selected Equipment Section */}
      <div className="border rounded-md p-4 bg-background">
        <h3 className="text-sm font-medium mb-2">Selected Equipment</h3>
        <SelectedEquipment
          items={value}
          onRemove={removeEquipmentItem}
          onUpdateQuantity={updateEquipmentQuantity}
        />
      </div>

      {/* Equipment Search and Filter Section */}
      <div className="border rounded-md p-4 bg-background">
        <h3 className="text-sm font-medium mb-2">Add Equipment</h3>

        {/* Search and Filter Controls */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Filters</p>
            {(selectedBrands.length > 0 || selectedCategories.length > 0) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2">
                <X className="h-3 w-3 mr-1" /> Clear All
              </Button>
            )}
          </div>

          {/* Brand Filters */}
          {brands.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs font-medium text-muted-foreground">Filter by Brand</p>
              <MultiSelect
                options={brands.map(brand => ({ value: brand, label: brand }))}
                selected={selectedBrands}
                onChange={handleBrandFilterChange}
                placeholder="Select brands"
                emptyText="No brands found"
              />
            </div>
          )}

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs font-medium text-muted-foreground">Filter by Category</p>
              <MultiSelect
                options={categories.map(category => ({ value: category, label: category }))}
                selected={selectedCategories}
                onChange={handleCategoryFilterChange}
                placeholder="Select categories"
                emptyText="No categories found"
              />
            </div>
          )}
        </div>

        {/* Equipment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredEquipment.length === 0 ? (
            <div className="col-span-full text-center py-4 bg-muted/20 rounded-md">
              <p className="text-sm text-muted-foreground">No equipment found</p>
            </div>
          ) : (
            filteredEquipment.map(equipment => (
              <EquipmentCard
                key={equipment.id}
                equipment={equipment}
                onAdd={addEquipmentItem}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
