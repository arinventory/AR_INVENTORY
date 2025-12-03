"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ProductFormProps {
  initialData?: {
    id: string
    name: string
    size: string
    description: string
    cost_price: number
    retail_price: number
    quantity_in_stock: number
    reorder_level: number
    product_type: string
    expenses?: number
  }
}

// Product types and their size ranges
const PRODUCT_TYPES = [
  { value: "SHIRT", label: "Shirt", sizes: ["X", "S", "M", "L", "XL", "XXL", "XXXL"] },
  { value: "FULL T SHIRT", label: "Full T Shirt", sizes: ["X", "S", "M", "L", "XL", "XXL", "XXXL"] },
  { value: "HALF T SHIRT", label: "Half T Shirt", sizes: ["X", "S", "M", "L", "XL", "XXL", "XXXL"] },
  { value: "JEANS", label: "Jeans", sizes: ["26", "28", "30", "32", "34", "36", "38"] },
  { value: "COTTON PANTS", label: "Cotton Pants", sizes: ["26", "28", "30", "32", "34", "36", "38"] },
  { value: "JUUBA", label: "Juuba", sizes: ["X", "S", "M", "L", "XL", "XXL"] },
  { value: "UNDERWEAR", label: "Underwear", sizes: ["81", "82", "83", "84", "85", "86", "87", "88", "89", "90", "91", "92", "93", "94", "95"] },
]

export function RetailProductForm({ initialData }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [productType, setProductType] = useState(initialData?.product_type || "")
  const [selectedSize, setSelectedSize] = useState(initialData?.size || "")
  const [isCustomSize, setIsCustomSize] = useState(false)
  const [customSize, setCustomSize] = useState("")
  
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      description: "",
      cost_price: 0,
      expenses: 0,
      retail_price: 0,
      quantity_in_stock: 0,
      reorder_level: 5,
    },
  )

  // Get available sizes for selected product type
  const availableSizes = PRODUCT_TYPES.find(pt => pt.value === productType)?.sizes || []

  // Auto-generate product name when type and size are selected
  useEffect(() => {
    if (productType && selectedSize && !initialData) {
      const productTypeLabel = PRODUCT_TYPES.find(pt => pt.value === productType)?.label || productType
      setFormData(prev => ({
        ...prev,
        name: `${productTypeLabel} - Size ${selectedSize}`.trim()
      }))
    }
  }, [productType, selectedSize, initialData])

  // Handle size selection
  const handleSizeChange = (value: string) => {
    if (value === "__custom__") {
      setIsCustomSize(true)
      setSelectedSize("")
      setCustomSize("")
    } else {
      setIsCustomSize(false)
      setSelectedSize(value)
      setCustomSize("")
    }
  }

  // Get the actual size value (either selected or custom)
  const actualSize = isCustomSize ? customSize : selectedSize

  const totalCost = (formData.cost_price || 0) + (formData.expenses || 0)
  const margin =
    formData.retail_price > 0
      ? (((formData.retail_price - totalCost) / formData.retail_price) * 100).toFixed(1)
      : "0"

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("price") || name.includes("quantity") || name.includes("level") || name === "expenses"
          ? value === "" ? 0 : (Number.parseFloat(value) || 0)
          : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!productType) {
        throw new Error("Please select a product type")
      }

      if (!actualSize || actualSize.trim() === "") {
        throw new Error("Please select or enter a size")
      }

      if (!formData.name.trim()) {
        throw new Error("Product name is required")
      }

      const supabase = createClient()

      const productData = {
        name: formData.name.trim(),
        size: actualSize.trim(),
        description: formData.description || "",
        cost_price: formData.cost_price,
        expenses: formData.expenses || 0,
        retail_price: formData.retail_price,
        quantity_in_stock: formData.quantity_in_stock || 0,
        reorder_level: formData.reorder_level || 5,
        product_type: productType,
      }

      if (initialData?.id) {
        // Update existing product
        const { error: updateError } = await supabase
          .from("retail_products")
          .update(productData)
          .eq("id", initialData.id)

        if (updateError) throw updateError
      } else {
        // Create new product - check if product_type + size combination already exists
        const { data: existing } = await supabase
          .from("retail_products")
          .select("id")
          .eq("product_type", productType)
          .eq("size", actualSize.trim())
          .maybeSingle()

        if (existing) {
          throw new Error(`A product with type "${productType}" and size "${actualSize}" already exists. Please edit that product instead.`)
        }

        const { error: insertError } = await supabase
          .from("retail_products")
          .insert([productData])

        if (insertError) throw insertError
      }

      router.push("/dashboard/retail-products")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? "Edit Product" : "New Product"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productType">Product Type *</Label>
              <Select 
                value={productType} 
                onValueChange={setProductType} 
                disabled={isLoading || !!initialData}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {initialData && (
                <p className="text-xs text-muted-foreground">Product type cannot be changed after creation</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Size *</Label>
              {!isCustomSize ? (
                <Select
                  value={selectedSize}
                  onValueChange={handleSizeChange}
                  disabled={isLoading || !productType || !!initialData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSizes.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">+ Custom Size</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter custom size"
                    value={customSize}
                    onChange={(e) => {
                      setCustomSize(e.target.value)
                      setSelectedSize(e.target.value)
                    }}
                    disabled={isLoading || !!initialData}
                    required
                  />
                  {!initialData && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsCustomSize(false)
                        setCustomSize("")
                        setSelectedSize("")
                      }}
                      disabled={isLoading}
                    >
                      Use Standard Size
                    </Button>
                  )}
                </div>
              )}
              {initialData && (
                <p className="text-xs text-muted-foreground">Size cannot be changed after creation</p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="Auto-generated from product type and size"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price *</Label>
              <Input
                id="cost_price"
                name="cost_price"
                type="number"
                step="0.01"
                value={formData.cost_price || ""}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expenses">Expenses</Label>
              <Input
                id="expenses"
                name="expenses"
                type="number"
                step="0.01"
                value={formData.expenses || ""}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Transport, handling, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retail_price">Retail Price *</Label>
              <Input
                id="retail_price"
                name="retail_price"
                type="number"
                step="0.01"
                value={formData.retail_price || ""}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity_in_stock">Quantity in Stock *</Label>
              <Input
                id="quantity_in_stock"
                name="quantity_in_stock"
                type="number"
                min="0"
                value={formData.quantity_in_stock || ""}
                onChange={handleChange}
                required
                disabled={isLoading}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                name="reorder_level"
                type="number"
                min="0"
                value={formData.reorder_level || ""}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-input rounded-md"
                rows={3}
              />
            </div>
            <div className="bg-blue-50 p-4 rounded-lg md:col-span-2">
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-xl font-bold text-foreground">₹{totalCost.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-2">Profit Margin</p>
              <p className="text-2xl font-bold text-foreground">{margin}%</p>
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Product"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
