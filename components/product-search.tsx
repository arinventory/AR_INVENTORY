"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export interface ProductSearchResult {
  id: string
  name: string
  sku: string
  wholesale_price?: number
  gst_percentage?: number
  deleted?: boolean
}

export function ProductSearch({
  value,
  onSelect,
  disabled,
  placeholder = "Search product by name or SKU...",
  autoFocus = false,
  showDeleted = false
}: {
  value: string
  onSelect: (product: ProductSearchResult) => void
  disabled?: boolean
  placeholder?: string
  autoFocus?: boolean
  showDeleted?: boolean
}) {
  const [term, setTerm] = useState("")
  const [results, setResults] = useState<ProductSearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductSearchResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const justSelectedRef = useRef(false)

  // Sync with value prop - load product name when value is provided
  useEffect(() => {
    const loadProduct = async () => {
      if (value && value.trim() !== "") {
        // Only load if we don't already have this product selected
        if (selectedProduct?.id !== value) {
          const supabase = createClient()
          let query = supabase
            .from("wholesale_products")
            .select("id, name, sku, wholesale_price, gst_percentage, deleted")
            .eq("id", value)
            
          // If not showing deleted products, filter them out
          if (!showDeleted) {
            query = query.eq("deleted", false)
          }
          
          const { data } = await query.single()
          if (data) {
            setSelectedProduct(data)
            setTerm(`${data.name} (${data.sku})${data.deleted ? ' (DELETED)' : ''}`)
          }
        }
      } else if (!value || value.trim() === "") {
        // Clear selection if value is cleared
        if (selectedProduct) {
          setSelectedProduct(null)
          setTerm("")
        }
      }
    }
    loadProduct()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    const controller = new AbortController()
    const fetchResults = async () => {
      if (!term.trim()) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const supabase = createClient()
        let query = supabase
          .from("wholesale_products")
          .select("id, name, sku, wholesale_price, gst_percentage, deleted")
          .or(`name.ilike.%${term}%,sku.ilike.%${term}%`)
          
        // If not showing deleted products, filter them out
        if (!showDeleted) {
          query = query.eq("deleted", false)
        }
          
        const { data } = await query
          .order("name")
          .limit(20)
        setResults(data || [])
      } finally {
        setLoading(false)
      }
    }

    const t = setTimeout(fetchResults, 250)
    return () => {
      clearTimeout(t)
      controller.abort()
    }
  }, [term, showDeleted])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        !listRef.current?.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [])

  const tryResolveExact = async () => {
    // Don't try to resolve if we just selected a product (prevent duplicate onSelect calls)
    if (justSelectedRef.current) {
      justSelectedRef.current = false
      return
    }
    const t = term.trim()
    if (!t || value) return
    const supabase = createClient()
    // Support patterns like "Name (SKU)" or just SKU or just Name
    const skuMatch = t.match(/\(([^)]+)\)$/)?.[1]
    const q = skuMatch || t
    let query = supabase
      .from("wholesale_products")
      .select("id, name, sku, wholesale_price, gst_percentage, deleted")
      .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
      
    // If not showing deleted products, filter them out
    if (!showDeleted) {
      query = query.eq("deleted", false)
    }
      
    const { data } = await query.limit(2)
    if (data && data.length === 1) {
      const p = data[0]
      setSelectedProduct(p)
      justSelectedRef.current = true
      onSelect(p)
      setTerm(`${p.name} (${p.sku})${p.deleted ? ' (DELETED)' : ''}`)
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={term}
        onChange={(e) => {
          setTerm(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={async (e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            if (results[0]) {
              const p = results[0]
              setSelectedProduct(p)
              justSelectedRef.current = true
              onSelect(p)
              setTerm(`${p.name} (${p.sku})${p.deleted ? ' (DELETED)' : ''}`)
              setOpen(false)
            } else {
              await tryResolveExact()
            }
          }
        }}
        onBlur={tryResolveExact}
        placeholder={placeholder}
        disabled={disabled}
      />
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full rounded-md border bg-white shadow max-h-64 overflow-auto"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">No products found</div>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`w-full text-left px-3 py-2 hover:bg-gray-100 ${p.deleted ? 'text-red-500' : ''}`}
                onClick={() => {
                  console.log("ProductSearch: Product selected:", p)
                  setSelectedProduct(p)
                  justSelectedRef.current = true
                  onSelect(p)
                  setTerm(`${p.name} (${p.sku})${p.deleted ? ' (DELETED)' : ''}`)
                  setOpen(false)
                }}
              >
                <div className="font-medium">{p.name}{p.deleted ? ' (DELETED)' : ''}</div>
                <div className="text-xs text-muted-foreground">
                  {p.sku} · ₹{Number(p.wholesale_price || 0).toFixed(2)}
                  {p.gst_percentage ? ` · GST: ${p.gst_percentage}%` : ''}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}