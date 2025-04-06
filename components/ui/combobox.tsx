'use client'

import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
  const [isOpen, setIsOpen] = React.useState(false)

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  // Always show the placeholder text regardless of selection
  const buttonText = placeholder

  return (
    <div className={cn('space-y-2', className)}>
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
            <div className="max-h-60 overflow-auto p-1">
              {options.length === 0 ? (
                <div className="px-2 py-2 text-sm text-muted-foreground">{emptyText}</div>
              ) : (
                options.map((option) => {
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
