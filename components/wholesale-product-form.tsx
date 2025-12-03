"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SupplierSearch } from "@/components/supplier-search"

interface Supplier {
  id: string
  name: string
}

interface ProductFormProps {
  initialData?: {
    id: string
    supplier_id: string
    name: string
    sku: string
    description: string
    cost_price: number
    expenses: number
    gst_amount: number
    wholesale_price: number
    quantity_in_stock: number
    reorder_level: number
    suppliers?: {
      name: string
    }
  }
}

export function WholesaleProductForm({ initialData }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState(
    initialData 
      ? {
          supplier_id: initialData.supplier_id || "",
          name: initialData.name || "",
          sku: initialData.sku || "",
          description: initialData.description || "",
          cost_price: initialData.cost_price || "",
          expenses: initialData.expenses || "",
          gst_amount: initialData.gst_amount || "",
          wholesale_price: initialData.wholesale_price || "",
          quantity_in_stock: initialData.quantity_in_stock || "",
          reorder_level: initialData.reorder_level || "",
        }
      : {
          supplier_id: "",
          name: "",
          sku: "",
          description: "",
          cost_price: "",
          expenses: "",
          gst_amount: "",
          wholesale_price: "",
          quantity_in_stock: "",
          reorder_level: "",
        },
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        name.includes("price") || name.includes("quantity") || name.includes("level") || name === "expenses" || name === "gst_amount"
          ? value === "" ? "" : Number.parseFloat(value) || ""
          : value,
    }))
  }

  // Calculate total cost with GST - use only gst_amount
  const totalCostBeforeGST = (Number(formData.cost_price) || 0) + (Number(formData.expenses) || 0)
  const gstAmount = Number(formData.gst_amount) || 0
  const totalCostWithGST = totalCostBeforeGST + gstAmount

  const handleSupplierChange = (supplierId: string, supplierName: string) => {
    setFormData((prev) => ({ ...prev, supplier_id: supplierId }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.supplier_id || formData.supplier_id.trim() === "") {
        throw new Error("Please select a supplier")
      }

      const supabase = createClient()

      // Prepare data, converting empty strings to null for UUID fields
      const dataToSubmit = {
        ...formData,
        supplier_id: formData.supplier_id.trim() || null,
        cost_price: Number(formData.cost_price) || 0,
        expenses: Number(formData.expenses) || 0,
        gst_amount: Number(formData.gst_amount) || 0,
        wholesale_price: Number(formData.wholesale_price) || 0,
        quantity_in_stock: Number(formData.quantity_in_stock) || 0,
        reorder_level: Number(formData.reorder_level) || 0,
      }

      if (initialData?.id) {
        const { error: updateError } = await supabase
          .from("wholesale_products")
          .update(dataToSubmit)
          .eq("id", initialData.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("wholesale_products").insert([dataToSubmit])

        if (insertError) throw insertError
      }

      router.push("/dashboard/wholesale-products")
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
          <SupplierSearch
            value={formData.supplier_id}
            onChange={handleSupplierChange}
            disabled={isLoading}
            placeholder="Search suppliers..."
            initialSupplierName={initialData?.suppliers?.name}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" name="sku" value={formData.sku} onChange={handleChange} required disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost_price">Cost Price *</Label>
              <Input
                id="cost_price"
                name="cost_price"
                type="number"
                step="any"
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
                step="any"
                value={formData.expenses || ""}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="Transport, handling, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_amount">GST Amount (₹)</Label>
              <Input
                id="gst_amount"
                name="gst_amount"
                type="number"
                step="any"
                value={formData.gst_amount || ""}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Total Cost</Label>
              <div className="px-3 py-2 border border-input rounded-md bg-muted text-sm font-medium">
                ₹{totalCostWithGST.toFixed(2)}
                {gstAmount > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (₹{totalCostBeforeGST.toFixed(2)} + GST ₹{gstAmount.toFixed(2)})
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wholesale_price">Wholesale Price *</Label>
              <Input
                id="wholesale_price"
                name="wholesale_price"
                type="number"
                step="any"
                value={formData.wholesale_price || ""}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity_in_stock">Quantity in Stock</Label>
              <Input
                id="quantity_in_stock"
                name="quantity_in_stock"
                type="number"
                step="any"
                value={formData.quantity_in_stock || ""}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorder_level">Reorder Level</Label>
              <Input
                id="reorder_level"
                name="reorder_level"
                type="number"
                step="any"
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
