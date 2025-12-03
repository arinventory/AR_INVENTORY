"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export interface CustomerSearchResult {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

export function CustomerPhoneSearch({
  value,
  onSelect,
  disabled,
  placeholder = "Enter phone number to search...",
}: {
  value: string
  onSelect: (customer: CustomerSearchResult) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [term, setTerm] = useState(value || "")
  const [results, setResults] = useState<CustomerSearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const isTypingRef = useRef(false)
  const prevValueRef = useRef<string | undefined>(value)

  // Sync with value prop only when it changes externally (not during typing)
  useEffect(() => {
    console.log("CustomerPhoneSearch: Value prop changed. Current value:", value, "Previous value:", prevValueRef.current, "Is typing:", isTypingRef.current)
    // Only sync if value changed externally (not from our typing)
    // Also sync on initial mount if value is provided
    if ((value !== prevValueRef.current) && !isTypingRef.current) {
      console.log("CustomerPhoneSearch: Syncing term from value prop:", value)
      setTerm(value || "")
      prevValueRef.current = value
    } else {
      console.log("CustomerPhoneSearch: Skipping sync (value unchanged or user is typing)")
    }
  }, [value])
  
  // Initialize prevValueRef on mount
  useEffect(() => {
    prevValueRef.current = value
  }, [])

  // Debug render state
  useEffect(() => {
    console.log("CustomerPhoneSearch: Render state - open:", open, "results.length:", results.length, "loading:", loading)
  }, [open, results.length, loading])

  // Live search as user types
  useEffect(() => {
    const controller = new AbortController()
    const fetchResults = async () => {
      if (!term.trim() || term.trim().length < 3) {
        console.log("CustomerPhoneSearch: Search term too short, clearing results")
        setResults([])
        setOpen(false)
        return
      }
      console.log("CustomerPhoneSearch: Searching for customers with phone:", term.trim())
      setLoading(true)
      try {
        const supabase = createClient()
        
        // First, let's check all customers to see what's in the database
        const { data: allCustomers } = await supabase
          .from("customers")
          .select("id, name, phone, customer_type")
          .limit(50)
        console.log("CustomerPhoneSearch: All customers in database (first 50):", allCustomers)
        console.log("CustomerPhoneSearch: Customers with phone numbers:", allCustomers?.filter(c => c.phone))
        
        // Search by phone (try both exact match and partial match)
        const phoneTerm = term.trim()
        
        // Search by phone - don't filter by customer_type to see all customers
        // (We'll filter in application code if needed)
        const { data: phoneResults, error: phoneError } = await supabase
          .from("customers")
          .select("*")
          .ilike("phone", `%${phoneTerm}%`)
          .order("created_at", { ascending: false })
          .limit(10)
        
        if (phoneError) {
          console.error("CustomerPhoneSearch: Database error (phone search):", phoneError)
        } else {
          console.log("CustomerPhoneSearch: Found customers by phone:", phoneResults?.length || 0, phoneResults)
        }
        
        // Show all customers regardless of customer_type (users can select any customer for sales)
        // Log what customer_type values we're seeing for debugging
        console.log("CustomerPhoneSearch: Customer types in results:", phoneResults?.map(c => ({ id: c.id, name: c.name, customer_type: c.customer_type })))
        const finalResults = phoneResults || []
        console.log("CustomerPhoneSearch: Using all results without filtering:", finalResults.length, "customers")
        
        // If no phone results, try searching by name as well (for better UX)
        let displayResults = finalResults
        if (displayResults.length === 0 && phoneTerm.length >= 3) {
          console.log("CustomerPhoneSearch: No phone results, trying name search")
          const { data: nameResults } = await supabase
            .from("customers")
            .select("*")
            .ilike("name", `%${phoneTerm}%`)
            .order("created_at", { ascending: false })
            .limit(5)
          
          if (nameResults && nameResults.length > 0) {
            console.log("CustomerPhoneSearch: Found customers by name:", nameResults.length, nameResults)
            displayResults = nameResults
          }
        }
        
        console.log("CustomerPhoneSearch: Final results to display:", displayResults.length, displayResults)
        console.log("CustomerPhoneSearch: Setting results and opening dropdown:", displayResults.length > 0)
        setResults(displayResults)
        setOpen(displayResults.length > 0)
        console.log("CustomerPhoneSearch: Results state updated, open state:", displayResults.length > 0)
      } catch (error) {
        console.error("CustomerPhoneSearch: Error searching customers:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const t = setTimeout(fetchResults, 300) // Debounce search
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [term])

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        listRef.current &&
        !listRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        // Use a small timeout to allow button clicks to fire first
        setTimeout(() => {
          setOpen(false)
        }, 100)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (customer: CustomerSearchResult) => {
    console.log("CustomerPhoneSearch: handleSelect called with customer:", customer)
    console.log("CustomerPhoneSearch: Customer details:", {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      postal_code: customer.postal_code,
      country: customer.country,
    })
    setSelectedCustomer(customer)
    const phoneValue = customer.phone || ""
    console.log("CustomerPhoneSearch: Setting term to:", phoneValue)
    setTerm(phoneValue)
    prevValueRef.current = phoneValue
    isTypingRef.current = false
    setOpen(false)
    console.log("CustomerPhoneSearch: Calling onSelect callback with customer:", customer)
    try {
      onSelect(customer)
      console.log("CustomerPhoneSearch: onSelect callback completed successfully")
    } catch (error) {
      console.error("CustomerPhoneSearch: Error in onSelect callback:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    console.log("CustomerPhoneSearch: Input changed to:", newValue)
    isTypingRef.current = true
    setTerm(newValue)
    prevValueRef.current = newValue
    if (newValue.trim().length >= 3) {
      console.log("CustomerPhoneSearch: Opening dropdown (term length >= 3)")
      setOpen(true)
    } else {
      console.log("CustomerPhoneSearch: Closing dropdown (term length < 3)")
      setOpen(false)
      // Don't clear selection if user is just typing
      if (newValue.trim().length === 0) {
        console.log("CustomerPhoneSearch: Clearing selected customer")
        setSelectedCustomer(null)
      }
    }
    // Reset typing flag after a short delay
    setTimeout(() => {
      isTypingRef.current = false
      console.log("CustomerPhoneSearch: Typing flag reset")
    }, 100)
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={term}
        onChange={handleInputChange}
        onFocus={() => {
          if (term.trim().length >= 3 && results.length > 0) {
            setOpen(true)
          }
        }}
        placeholder={placeholder}
        disabled={disabled}
        type="tel"
      />
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow-lg max-h-64 overflow-auto"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No customers found</div>
          ) : (
            <div className="py-1">
              {results.map((customer, index) => {
                if (index === 0) {
                  console.log("CustomerPhoneSearch: Rendering dropdown with", results.length, "customers")
                }
                console.log(`CustomerPhoneSearch: Rendering customer ${index}:`, customer.name, customer.id)
                return (
                <button
                  key={customer.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  onMouseDown={(e) => {
                    console.log("CustomerPhoneSearch: Button mousedown for customer:", customer.name)
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelect(customer)
                  }}
                  onClick={(e) => {
                    console.log("CustomerPhoneSearch: Button click for customer:", customer.name)
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <div className="font-medium text-sm">{customer.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {customer.phone}
                  </div>
                  {(customer.address || customer.city) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {[customer.address, customer.city, customer.state].filter(Boolean).join(", ")}
                    </div>
                  )}
                </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

