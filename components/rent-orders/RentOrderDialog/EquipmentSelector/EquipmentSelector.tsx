'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fetchEquipments } from '@/app/actions'
import { Combobox } from '@/components/ui/combobox'
import { EquipmentItem, Equipment, EquipmentSelectorProps } from '../types'
import { EquipmentCard } from './EquipmentCard'
import { SelectedEquipment } from './SelectedEquipment'

export function EquipmentSelector({ value, onChange }: EquipmentSelectorProps) {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [appliedBrands, setAppliedBrands] = useState<string[]>([])
  const [appliedCategories, setAppliedCategories] = useState<string[]>([])
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

      // Filter by applied brands
      const matchesBrand = appliedBrands.length === 0 ||
        (equipment.brand && appliedBrands.includes(equipment.brand))

      // Filter by applied categories
      const matchesCategory = appliedCategories.length === 0 ||
        (equipment.category && appliedCategories.includes(equipment.category))

      // Filter out already selected items
      const isNotSelected = !selectedItems.includes(String(equipment.id))

      return matchesSearch && matchesBrand && matchesCategory && isNotSelected
    })
  }, [equipmentList, searchQuery, appliedBrands, appliedCategories, selectedItems])

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

  // Handle brand selection
  const handleBrandChange = (brand: string) => {
    if (brand && !appliedBrands.includes(brand)) {
      setAppliedBrands([...appliedBrands, brand])
    }
    setSelectedBrand('')
  }

  // Handle category selection
  const handleCategoryChange = (category: string) => {
    if (category && !appliedCategories.includes(category)) {
      setAppliedCategories([...appliedCategories, category])
    }
    setSelectedCategory('')
  }

  // Remove brand filter
  const removeBrandFilter = (brand: string) => {
    setAppliedBrands(appliedBrands.filter(b => b !== brand))
  }

  // Remove category filter
  const removeCategoryFilter = (category: string) => {
    setAppliedCategories(appliedCategories.filter(c => c !== category))
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('')
    setSelectedBrand('')
    setSelectedCategory('')
    setAppliedBrands([])
    setAppliedCategories([])
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
            {(appliedBrands.length > 0 || appliedCategories.length > 0) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2">
                <X className="h-3 w-3 mr-1" /> Clear All
              </Button>
            )}
          </div>

          {/* Applied Filters */}
          <div className="flex flex-wrap gap-1 mb-3">
            {appliedBrands.map(brand => (
              <Badge key={`brand-${brand}`} variant="secondary" className="flex items-center gap-1 py-1">
                Brand: {brand}
                <button
                  type="button"
                  onClick={() => removeBrandFilter(brand)}
                  className="ml-1 rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {appliedCategories.map(category => (
              <Badge key={`category-${category}`} variant="secondary" className="flex items-center gap-1 py-1">
                Category: {category}
                <button
                  type="button"
                  onClick={() => removeCategoryFilter(category)}
                  className="ml-1 rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          {/* Brand Filters */}
          {brands.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs font-medium text-muted-foreground">Filter by Brand</p>
              <Combobox
                options={brands
                  .filter(brand => !appliedBrands.includes(brand))
                  .map(brand => ({ value: brand, label: brand }))}
                value={selectedBrand}
                onChange={handleBrandChange}
                placeholder="Select brand"
                emptyText="No brands found or all brands already selected"
              />
            </div>
          )}

          {/* Category Filters */}
          {categories.length > 0 && (
            <div className="space-y-2 mb-3">
              <p className="text-xs font-medium text-muted-foreground">Filter by Category</p>
              <Combobox
                options={categories
                  .filter(category => !appliedCategories.includes(category))
                  .map(category => ({ value: category, label: category }))}
                value={selectedCategory}
                onChange={handleCategoryChange}
                placeholder="Select category"
                emptyText="No categories found or all categories already selected"
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
