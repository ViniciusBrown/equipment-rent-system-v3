'use client'

import * as React from 'react'
import { Check, ChevronDown, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

export type ComboboxOption = {
  value: string
  label: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyText?: string
  className?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select option',
  emptyText = 'No options found.',
  className,
}: ComboboxProps) {
  const [searchTerm, setSearchTerm] = React.useState('')

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options

    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  return (
    <div className={cn('relative space-y-1', className)}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <div className="px-2 py-2">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
          </div>
          {filteredOptions.length === 0 ? (
            <div className="px-2 py-2 text-sm text-muted-foreground">{emptyText}</div>
          ) : (
            <SelectGroup>
              {filteredOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}

interface MultiSelectProps {
  options: ComboboxOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  emptyText?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options',
  emptyText = 'No options found.',
  className,
}: MultiSelectProps) {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options

    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const handleRemove = (value: string) => {
    onChange(selected.filter(item => item !== value))
  }

  const selectedLabels = selected.map(
    (value) => options.find((option) => option.value === value)?.label
  ).filter(Boolean)

  const buttonText = selectedLabels.length > 0
    ? `${selectedLabels.length} selected`
    : placeholder

  return (
    <div className={cn('space-y-2', className)}>
      {/* Selected items */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 min-h-8">
          {selected.map(value => {
            const option = options.find(opt => opt.value === value)
            return (
              <Badge key={value} variant="secondary" className="flex items-center gap-1 py-1">
                {option?.label || value}
                <button
                  type="button"
                  onClick={() => handleRemove(value)}
                  className="ml-1 rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}

      <div className="relative">
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          {buttonText}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover shadow-md">
            <div className="p-2">
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-2"
              />
            </div>
            <div className="max-h-60 overflow-auto p-1">
              {filteredOptions.length === 0 ? (
                <div className="px-2 py-2 text-sm text-muted-foreground">{emptyText}</div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selected.includes(option.value)
                  return (
                    <div
                      key={option.value}
                      className={cn(
                        'flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer',
                        isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                      )}
                      onClick={() => handleSelect(option.value)}
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'opacity-50'
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <span>{option.label}</span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
