"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Supplier {
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

interface Product {
  id: string
  name: string
  sku: string
  wholesale_price: number
  supplier_id: string
}

interface OrderItem {
  product_id: string
  quantity: number | ""
  unit_price: number | ""
}

interface OrderData {
  id?: string
  supplier_id?: string
  order_date?: string
  expected_delivery_date?: string
  status?: string
  purchase_order_items?: Array<{
    product_id: string
    quantity: number
    unit_price: number
  }>
}

export function PurchaseOrderForm({
  suppliers,
  products,
  initialData,
}: {
  suppliers: Supplier[]
  products: Product[]
  initialData?: OrderData
}) {
  const router = useRouter()
  const isEditMode = !!initialData?.id
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supplierId, setSupplierId] = useState(initialData?.supplier_id || suppliers[0]?.id || "")
  const initialItems: OrderItem[] = initialData?.purchase_order_items?.length
    ? initialData.purchase_order_items.map((item: any) => ({
        product_id: item.product_id || "",
        quantity: item.quantity || "",
        unit_price: item.unit_price || "",
      }))
    : [{ product_id: "", quantity: "", unit_price: "" }]
  const [orderItems, setOrderItems] = useState<OrderItem[]>(initialItems)
  const [orderDate, setOrderDate] = useState(
    initialData?.order_date ? new Date(initialData.order_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  )
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(initialData?.expected_delivery_date || "")

  const supplierProducts = products.filter((p) => p.supplier_id === supplierId)
  const totalAmount = orderItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0)
  
  // Get selected supplier details
  const selectedSupplier = suppliers.find(s => s.id === supplierId)

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product_id: "", quantity: "", unit_price: "" }])
  }

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...orderItems]
    if (field === "product_id") {
      // Prevent setting empty string or invalid values
      if (!value || (typeof value === "string" && value.trim() === "")) {
        console.warn("Attempted to set empty product_id, ignoring")
        return
      }
      const product = products.find((p) => p.id === value)
      newItems[index] = {
        ...newItems[index],
        product_id: value as string,
        unit_price: product?.wholesale_price || 0,
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    setOrderItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate required fields - ensure supplierId is not empty
      if (!supplierId || supplierId.trim() === "") {
        throw new Error("Please select a supplier")
      }

      if (orderItems.length === 0) {
        throw new Error("Please add at least one order item")
      }

      // Check if there are products available for the selected supplier
      if (supplierProducts.length === 0) {
        throw new Error("No products available for the selected supplier. Please select a different supplier or add products first.")
      }

      // Filter out items with empty product_id early to check if we have any valid items
      const validItems = orderItems.filter(
        (item) => item.product_id && typeof item.product_id === "string" && item.product_id.trim() !== ""
      )
      
      if (validItems.length === 0) {
        throw new Error("Please select a product for at least one order item")
      }

      // Validate that all product_ids are valid UUIDs (non-empty and properly formatted)
      const invalidItems = validItems.filter((item) => !item.product_id || item.product_id.trim() === "")
      if (invalidItems.length > 0) {
        throw new Error("Some items have invalid product selections. Please reselect the products.")
      }

      const supabase = createClient()
      const orderNumber = `PO-${Date.now()}`

      // Create purchase order - ensure supplier_id is valid UUID
      const { data: orderData, error: orderError } = await supabase
        .from("purchase_orders")
        .insert([
          {
            supplier_id: supplierId.trim(),
            order_number: orderNumber,
            order_date: orderDate,
            expected_delivery_date: expectedDeliveryDate || null,
            total_amount: totalAmount,
            status: "pending",
          },
        ])
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items - use the already filtered valid items
      const itemsToInsert = validItems.map((item) => ({
        purchase_order_id: orderData.id,
        product_id: item.product_id.trim(),
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
      }))

      const { error: itemsError } = await supabase.from("purchase_order_items").insert(itemsToInsert)

      if (itemsError) throw itemsError

      // Update credit ledger for the supplier (increase payable)
      // 1) Get previous balance
      const { data: lastEntry } = await supabase
        .from("credit_ledger")
        .select("balance_after")
        .eq("supplier_id", supplierId.trim())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const previousBalance = Number(lastEntry?.balance_after || 0)
      const newBalance = previousBalance + Number(totalAmount || 0)

      // 2) Insert credit transaction - ensure supplier_id is valid UUID
      const { error: ledgerError } = await supabase.from("credit_ledger").insert([
        {
          supplier_id: supplierId.trim(),
          transaction_type: "credit",
          amount: totalAmount,
          reference_id: orderData.id,
          reference_type: "purchase_order",
          description: `Purchase order ${orderNumber}`,
          balance_after: newBalance,
        },
      ])

      if (ledgerError) throw ledgerError

      router.push("/dashboard/purchase-orders")
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
        <CardTitle>{isEditMode ? "Edit Purchase Order" : "New Purchase Order"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select value={supplierId} onValueChange={setSupplierId} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSupplier && (
                <div className="mt-2 p-3 bg-gray-50 rounded-md text-sm space-y-1">
                  <div className="font-semibold text-gray-900">Supplier Details:</div>
                  {selectedSupplier.phone && <div>Phone: {selectedSupplier.phone}</div>}
                  {(selectedSupplier.address || selectedSupplier.city || selectedSupplier.state) && (
                    <div>
                      Address: {[selectedSupplier.address, selectedSupplier.city, selectedSupplier.state, selectedSupplier.postal_code, selectedSupplier.country].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderDate">Order Date *</Label>
              <Input
                id="orderDate"
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Order Items</Label>
              <Button type="button" variant="outline" onClick={handleAddItem} disabled={isLoading}>
                + Add Item
              </Button>
            </div>

            {orderItems.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-end">
                <div className="space-y-2">
                  <Label>Product *</Label>
                  <Select
                    value={item.product_id || undefined}
                    onValueChange={(value) => {
                      if (value && value.trim() !== "") {
                        handleItemChange(index, "product_id", value)
                      }
                    }}
                    disabled={isLoading || supplierProducts.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={supplierProducts.length === 0 ? "No products available" : "Select product"} />
                    </SelectTrigger>
                    <SelectContent>
                      {supplierProducts.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">No products available for this supplier</div>
                      ) : (
                        supplierProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.sku})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity || ""}
                    onChange={(e) => handleItemChange(index, "quantity", Number.parseInt(e.target.value) || "")}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.unit_price || ""}
                    onChange={(e) => handleItemChange(index, "unit_price", Number.parseFloat(e.target.value) || "")}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Line Total</Label>
                  <Input type="text" value={`₹${((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toFixed(2)}`} disabled />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleRemoveItem(index)}
                  disabled={isLoading || orderItems.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-foreground">₹{totalAmount.toFixed(2)}</p>
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Order"}
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
