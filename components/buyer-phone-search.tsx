"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export interface BuyerSearchResult {
  id: string
  name: string
  phone?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
}

export function BuyerPhoneSearch({
  value,
  onSelect,
  disabled,
  placeholder = "Enter buyer phone number...",
}: {
  value: string
  onSelect: (buyer: BuyerSearchResult) => void
  disabled?: boolean
  placeholder?: string
}) {
  const [term, setTerm] = useState(value || "")
  const [results, setResults] = useState<BuyerSearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerSearchResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const isTypingRef = useRef(false)
  const prevValueRef = useRef<string | undefined>(value)

  // Sync with value prop only when it changes externally (not during typing)
  useEffect(() => {
    if ((value !== prevValueRef.current) && !isTypingRef.current) {
      setTerm(value || "")
      prevValueRef.current = value
    }
  }, [value])
  
  // Initialize prevValueRef on mount
  useEffect(() => {
    prevValueRef.current = value
  }, [])

  // Live search as user types
  useEffect(() => {
    const controller = new AbortController()
    const fetchResults = async () => {
      if (!term.trim() || term.trim().length < 3) {
        setResults([])
        setOpen(false)
        return
      }
      
      setLoading(true)
      try {
        const supabase = createClient()
        const phoneTerm = term.trim()
        
        // Search by phone (partial match)
        const { data: phoneResults, error: phoneError } = await supabase
          .from("wholesale_buyers")
          .select("*")
          .ilike("phone", `%${phoneTerm}%`)
          .order("created_at", { ascending: false })
          .limit(10)
        
        if (phoneError) {
          console.error("BuyerPhoneSearch: Database error:", phoneError)
        }
        
        const finalResults = phoneResults || []
        
        // If no phone results, try searching by name as well
        let displayResults = finalResults
        if (displayResults.length === 0 && phoneTerm.length >= 3) {
          const { data: nameResults } = await supabase
            .from("wholesale_buyers")
            .select("*")
            .ilike("name", `%${phoneTerm}%`)
            .order("created_at", { ascending: false })
            .limit(5)
          
          if (nameResults && nameResults.length > 0) {
            displayResults = nameResults
          }
        }
        
        setResults(displayResults)
        setOpen(displayResults.length > 0)
      } catch (error) {
        console.error("BuyerPhoneSearch: Error searching buyers:", error)
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
        setTimeout(() => {
          setOpen(false)
        }, 100)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelect = (buyer: BuyerSearchResult) => {
    setSelectedBuyer(buyer)
    const phoneValue = buyer.phone || ""
    setTerm(phoneValue)
    prevValueRef.current = phoneValue
    isTypingRef.current = false
    setOpen(false)
    onSelect(buyer)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    isTypingRef.current = true
    setTerm(newValue)
    prevValueRef.current = newValue
    if (newValue.trim().length >= 3) {
      setOpen(true)
    } else {
      setOpen(false)
      if (newValue.trim().length === 0) {
        setSelectedBuyer(null)
        // Clear selection when input is cleared
        onSelect({ id: "", name: "", phone: "" })
      }
    }
    setTimeout(() => {
      isTypingRef.current = false
    }, 100)
  }

  // Allow manual entry of new buyer when no match is found
  const handleInputBlur = () => {
    // If there's a term but no selected buyer, treat it as a new buyer entry
    if (term.trim() && !selectedBuyer) {
      // Don't auto-create, but allow the form to handle it
      onSelect({ 
        id: "", 
        name: "", 
        phone: term.trim() 
      })
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={term}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
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
            <div className="px-3 py-2 text-sm text-muted-foreground">No buyers found</div>
          ) : (
            <div className="py-1">
              {results.map((buyer) => (
                <button
                  key={buyer.id}
                  type="button"
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelect(buyer)
                  }}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                >
                  <div className="font-medium text-sm">{buyer.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {buyer.phone}
                  </div>
                  {(buyer.address || buyer.city) && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {[buyer.address, buyer.city, buyer.state].filter(Boolean).join(", ")}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

