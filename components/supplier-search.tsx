"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface Supplier {
  id: string
  name: string
  email?: string
  phone?: string
}

interface SupplierSearchProps {
  value: string
  onChange: (supplierId: string, supplierName: string) => void
  disabled?: boolean
  placeholder?: string
  initialSupplierName?: string
}

export function SupplierSearch({ value, onChange, disabled, placeholder = "Search suppliers...", initialSupplierName }: SupplierSearchProps) {
  const [searchTerm, setSearchTerm] = useState(initialSupplierName || "")
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load suppliers on component mount
  useEffect(() => {
    loadSuppliers()
  }, [])

  // Filter suppliers based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredSuppliers(suppliers.slice(0, 10)) // Show first 10 by default
    } else {
      const filtered = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredSuppliers(filtered)
    }
  }, [searchTerm, suppliers])

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const loadSuppliers = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("suppliers")
        .select("id, name, email, phone")
        .eq("deleted", false)
        .order("name")

      if (error) throw error
      setSuppliers(data || [])
    } catch (error) {
      console.error("Error loading suppliers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setIsOpen(true)
    
    // If input is cleared, clear selection
    if (value === "") {
      setSelectedSupplier(null)
      onChange("", "")
    }
  }

  const handleSupplierSelect = (supplier: Supplier) => {
    setSelectedSupplier(supplier)
    setSearchTerm(supplier.name)
    setIsOpen(false)
    onChange(supplier.id, supplier.name)
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <Label htmlFor="supplier-search">Supplier *</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="supplier-search"
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
          </div>
        )}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredSuppliers.length > 0 ? (
            filteredSuppliers.map((supplier) => (
              <button
                key={supplier.id}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                onClick={() => handleSupplierSelect(supplier)}
              >
                <div className="font-medium">{supplier.name}</div>
                {supplier.phone && <div className="text-sm text-gray-500">{supplier.phone}</div>}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 text-sm">
              {searchTerm ? "No suppliers found" : "Start typing to search suppliers"}
            </div>
          )}
        </div>
      )}

      {selectedSupplier && (
        <div className="mt-2 text-sm text-gray-600">
          Selected: <span className="font-medium">{selectedSupplier.name}</span>
        </div>
      )}
    </div>
  )
}