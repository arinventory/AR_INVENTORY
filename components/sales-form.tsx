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
import { CustomerPhoneSearch, type CustomerSearchResult } from "@/components/customer-phone-search"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Customer {
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
  size: string
  retail_price: number
  cost_price?: number
  expenses?: number
  deleted?: boolean
}

interface SaleItem {
  product_id: string
  quantity: number | ""
  unit_price: number
  line_total: number
}

interface SaleData {
  id?: string
  customer_id?: string
  sale_date?: string
  invoice_number?: string
  tax_amount?: number
  discount_amount?: number
  sales_items?: Array<{
    product_id: string
    quantity: number
    unit_price: number
  }>
}

export function SalesForm({
  customers,
  products,
  initialData,
}: {
  customers: Customer[]
  products: Product[]
  initialData?: SaleData
}) {
  const router = useRouter()
  const isEditMode = !!initialData?.id
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Customer selection mode: 'existing' or 'new'
  const [customerMode, setCustomerMode] = useState<'existing' | 'new'>('new')
  const [customerId, setCustomerId] = useState(initialData?.customer_id || "")
  
  // Direct customer input fields
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [customerAddress, setCustomerAddress] = useState("")
  const [customerCity, setCustomerCity] = useState("")
  const [customerState, setCustomerState] = useState("")
  const [customerPostalCode, setCustomerPostalCode] = useState("")
  const [customerCountry, setCustomerCountry] = useState("")
  // Handle customer selection from phone search
  const handleCustomerSelect = (customer: CustomerSearchResult) => {
    console.log("SalesForm: handleCustomerSelect called")
    console.log("SalesForm: Received customer data:", customer)
    console.log("SalesForm: Customer details:", {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      postal_code: customer.postal_code,
      country: customer.country,
    })
    
    console.log("SalesForm: Before state update - current values:", {
      customerPhone,
      customerName,
      customerAddress,
      customerCity,
      customerState,
      customerPostalCode,
      customerCountry,
      customerId,
      customerMode,
    })
    
    setCustomerPhone(customer.phone || "")
    setCustomerName(customer.name || "")
    setCustomerAddress(customer.address || "")
    setCustomerCity(customer.city || "")
    setCustomerState(customer.state || "")
    setCustomerPostalCode(customer.postal_code || "")
    setCustomerCountry(customer.country || "")
    setCustomerId(customer.id)
    setCustomerMode('existing')
    
    console.log("SalesForm: State updates called for:", {
      phone: customer.phone || "",
      name: customer.name || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      postal_code: customer.postal_code || "",
      country: customer.country || "",
      id: customer.id,
    })
  }
  
  // Get selected customer details
  const selectedCustomer = customers.find(c => c.id === customerId)
  
  // Initialize form with existing customer data if editing
  useEffect(() => {
    if (isEditMode && selectedCustomer) {
      setCustomerMode('existing')
      setCustomerName(selectedCustomer.name)
      setCustomerPhone(selectedCustomer.phone || "")
      setCustomerAddress(selectedCustomer.address || "")
      setCustomerCity(selectedCustomer.city || "")
      setCustomerState(selectedCustomer.state || "")
      setCustomerPostalCode(selectedCustomer.postal_code || "")
      setCustomerCountry(selectedCustomer.country || "")
    }
  }, [isEditMode, selectedCustomer])
  const initialItems: SaleItem[] = initialData?.sales_items?.map((item: any) => ({
    product_id: item.product_id || "",
    quantity: item.quantity || "",
    unit_price: item.unit_price || 0,
    line_total: item.quantity * item.unit_price || 0,
  })) || [{ product_id: "", quantity: "", unit_price: 0, line_total: 0 }]
  const [saleItems, setSaleItems] = useState<SaleItem[]>(initialItems)
  const [saleDate, setSaleDate] = useState(
    initialData?.sale_date ? new Date(initialData.sale_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  )
  // Calculate tax rate from existing tax amount if editing
  const initialSubtotal = initialData?.sales_items?.reduce((s: number, i: any) => s + (i.quantity || 0) * (i.unit_price || 0), 0) || 0
  const initialDiscount = initialData?.discount_amount || 0
  const initialSubtotalAfterDiscount = initialSubtotal - initialDiscount
  const calculatedTaxRate = initialData?.tax_amount && initialSubtotalAfterDiscount > 0 
    ? (initialData.tax_amount / initialSubtotalAfterDiscount) * 100 
    : 0
  const [taxRate, setTaxRate] = useState(calculatedTaxRate)
  const [discountAmount, setDiscountAmount] = useState(initialData?.discount_amount || 0)

  const subtotal = saleItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * item.unit_price, 0)
  const taxAmount = (subtotal * taxRate) / 100
  const totalAmount = subtotal + taxAmount - discountAmount

  const handleAddItem = () => {
    setSaleItems([...saleItems, { product_id: "", quantity: "", unit_price: 0, line_total: 0 }])
  }

  const handleRemoveItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...saleItems]
    if (field === "product_id") {
      const product = products.find((p) => p.id === value)
      newItems[index] = {
        ...newItems[index],
        product_id: value as string,
        unit_price: product?.retail_price || 0,
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    setSaleItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent, shouldPrint: boolean = false) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate customer details
      if (!customerName || customerName.trim() === "") {
        throw new Error("Please enter customer name")
      }

      // Filter out items with empty product_id early to check if we have any valid items
      const validItems = saleItems.filter((item) => item.product_id && item.product_id.trim() !== "")
      
      if (validItems.length === 0) {
        throw new Error("Please select a product for at least one sale item")
      }

      const supabase = createClient()
      
      // Create or find customer
      let finalCustomerId = customerId
      
      if (customerMode === 'new' || !customerId) {
        // Check if customer already exists by phone
        let existingCustomer = null
        if (customerPhone && customerPhone.trim() !== "") {
          const { data: existing } = await supabase
            .from("customers")
            .select("id")
            .eq("phone", customerPhone.trim())
            .eq("customer_type", "retail")
            .limit(1)
            .maybeSingle()
          
          existingCustomer = existing
        }
        
        if (existingCustomer) {
          // Update existing customer with new details
          const { error: updateError } = await supabase
            .from("customers")
            .update({
              name: customerName.trim(),
              phone: customerPhone?.trim() || null,
              address: customerAddress?.trim() || null,
              city: customerCity?.trim() || null,
              state: customerState?.trim() || null,
              postal_code: customerPostalCode?.trim() || null,
              country: customerCountry?.trim() || null,
            })
            .eq("id", existingCustomer.id)
          
          if (updateError) throw updateError
          finalCustomerId = existingCustomer.id
        } else {
          // Create new customer
          const { data: newCustomer, error: customerError } = await supabase
            .from("customers")
            .insert([
              {
                name: customerName.trim(),
                phone: customerPhone?.trim() || null,
                address: customerAddress?.trim() || null,
                city: customerCity?.trim() || null,
                state: customerState?.trim() || null,
                postal_code: customerPostalCode?.trim() || null,
                country: customerCountry?.trim() || null,
                customer_type: "retail",
              },
            ])
            .select()
            .single()
          
          if (customerError) throw customerError
          finalCustomerId = newCustomer.id
        }
      }
      
      if (isEditMode && initialData?.id) {
        // Update existing sale
        const { error: saleError } = await supabase
          .from("sales")
          .update({
            customer_id: finalCustomerId,
            sale_date: saleDate,
            subtotal,
            tax_amount: taxAmount,
            discount_amount: discountAmount,
            total_amount: totalAmount,
          })
          .eq("id", initialData.id)

        if (saleError) throw saleError

        // Delete existing items and insert new ones
        await supabase.from("sales_items").delete().eq("sale_id", initialData.id)

        const itemsToInsert = validItems.map((item) => ({
          sale_id: initialData.id,
          product_id: item.product_id.trim(),
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: (Number(item.quantity) || 0) * item.unit_price,
        }))

        const { error: itemsError } = await supabase.from("sales_items").insert(itemsToInsert)
        if (itemsError) throw itemsError

        if (shouldPrint) {
          router.push(`/dashboard/sales/${initialData.id}/print`)
        } else {
          router.push(`/dashboard/sales/${initialData.id}`)
        }
      } else {
        // Create new sale
        const invoiceNumber = `INV-${Date.now()}`

        const { data: saleData, error: saleError } = await supabase
          .from("sales")
          .insert([
            {
              customer_id: finalCustomerId,
              invoice_number: invoiceNumber,
              sale_date: saleDate,
              subtotal,
              tax_amount: taxAmount,
              discount_amount: discountAmount,
              total_amount: totalAmount,
              payment_status: "pending",
              status: "completed",
            },
          ])
          .select()
          .single()

        if (saleError) throw saleError

        const itemsToInsert = validItems.map((item) => ({
          sale_id: saleData.id,
          product_id: item.product_id.trim(),
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: (Number(item.quantity) || 0) * item.unit_price,
        }))

        const { error: itemsError } = await supabase.from("sales_items").insert(itemsToInsert)
        if (itemsError) throw itemsError

        if (shouldPrint) {
          router.push(`/dashboard/sales/${saleData.id}/print`)
        } else {
          router.push(`/dashboard/sales/${saleData.id}`)
        }
      }
      
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Create a map of all products including deleted ones from initial data
  const allProductsMap = new Map<string, Product>()
  
  // Add all current products
  products.forEach(product => {
    allProductsMap.set(product.id, product)
  })
  
  // Add products from initial data that might be deleted
  if (initialData?.sales_items) {
    initialData.sales_items.forEach(item => {
      if (item.product_id && !allProductsMap.has(item.product_id)) {
        // Create a placeholder product for deleted items
        allProductsMap.set(item.product_id, {
          id: item.product_id,
          name: "Deleted Product",
          size: "N/A",
          retail_price: item.unit_price || 0,
          deleted: true
        })
      }
    })
  }
  
  const allProducts = Array.from(allProductsMap.values())

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Sale" : "New Sale"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Details Section */}
          <div className="space-y-5">
            <h3 className="text-lg font-semibold mb-2">Customer Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Search by Phone Number</Label>
                <CustomerPhoneSearch
                  value={customerPhone}
                  onSelect={handleCustomerSelect}
                  disabled={isLoading}
                  placeholder="Enter phone number to search..."
                />
                <p className="text-xs text-muted-foreground">Start typing phone number to see matching customers</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="saleDate">Sale Date *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="customerAddress">Address</Label>
                <Input
                  id="customerAddress"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerCity">City</Label>
                <Input
                  id="customerCity"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerState">State</Label>
                <Input
                  id="customerState"
                  value={customerState}
                  onChange={(e) => setCustomerState(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter state"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPostalCode">Postal Code</Label>
                <Input
                  id="customerPostalCode"
                  value={customerPostalCode}
                  onChange={(e) => setCustomerPostalCode(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter postal code"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerCountry">Country</Label>
                <Input
                  id="customerCountry"
                  value={customerCountry}
                  onChange={(e) => setCustomerCountry(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>

          <div className="space-y-5 pt-2">
            <div className="flex justify-between items-center mb-4">
              <Label className="text-lg font-semibold">Sale Items</Label>
              <Button type="button" variant="outline" onClick={handleAddItem} disabled={isLoading}>
                + Add Item
              </Button>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Product *</TableHead>
                    <TableHead className="w-[15%]">Quantity *</TableHead>
                    <TableHead className="w-[15%]">Unit Price *</TableHead>
                    <TableHead className="w-[15%]">Line Total</TableHead>
                    <TableHead className="w-[15%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleItems.map((item, index) => {
                    // Find the product for this item
                    const product = allProductsMap.get(item.product_id)
                    const isDeleted = product?.deleted
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => handleItemChange(index, "product_id", value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger className={isDeleted ? "text-red-500" : ""}>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {allProducts.map((product) => (
                                <SelectItem 
                                  key={product.id} 
                                  value={product.id}
                                  className={product.deleted ? "text-red-500" : ""}
                                >
                                  {product.name} (Size: {product.size}){product.deleted ? ' (DELETED)' : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {isDeleted && (
                            <p className="text-xs text-red-500 mt-1">Note: This product has been deleted from inventory</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity || ""}
                            onChange={(e) => handleItemChange(index, "quantity", Number.parseInt(e.target.value) || "")}
                            disabled={isLoading}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_price || ""}
                            onChange={(e) => handleItemChange(index, "unit_price", Number.parseFloat(e.target.value) || 0)}
                            disabled={isLoading}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="text" 
                            value={`₹${((Number(item.quantity) || 0) * item.unit_price).toFixed(2)}`} 
                            disabled 
                            className="w-full font-semibold"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            disabled={isLoading || saleItems.length === 1}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                value={taxRate || ""}
                onChange={(e) => setTaxRate(Number.parseFloat(e.target.value) || 0)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountAmount">Discount Amount (₹)</Label>
              <Input
                id="discountAmount"
                type="number"
                step="0.01"
                value={discountAmount || ""}
                onChange={(e) => setDiscountAmount(Number.parseFloat(e.target.value) || 0)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-5 rounded-lg space-y-3 pt-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({taxRate}%):</span>
              <span className="font-medium">₹{taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount:</span>
              <span className="font-medium">-₹{discountAmount.toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-2xl font-bold text-foreground">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {error && <div className="p-4 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

          <div className="flex gap-4 pt-2">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Saving..." : isEditMode ? "Update Sale" : "Save Sale"}
            </Button>
            <Button 
              type="button" 
              className="bg-green-600 hover:bg-green-700 text-white" 
              disabled={isLoading}
              onClick={async (e) => {
                e.preventDefault()
                const fakeEvent = {
                  preventDefault: () => {},
                } as React.FormEvent<HTMLFormElement>
                await handleSubmit(fakeEvent, true)
              }}
            >
              {isLoading ? "Saving..." : "Save & Print"}
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
