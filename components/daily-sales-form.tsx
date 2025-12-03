"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Product {
  id: string
  name: string
  size: string
  product_type: string
  cost_price: number
  retail_price: number
  quantity_in_stock: number
  expenses?: number
}

interface SaleItem {
  product_type: string
  product_id: string
  product_name: string
  product_size: string
  quantity: number
  unit_price: number
  cost_price: number
  expenses: number
  line_total: number
  line_profit: number
}

interface DailySalesFormProps {
  selectedDate: string
  products: Product[]
  existingSaleId?: string
}

export function DailySalesForm({ selectedDate, products: initialProducts, existingSaleId }: DailySalesFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [isLoadingExisting, setIsLoadingExisting] = useState(!!existingSaleId)
  const [products, setProducts] = useState(initialProducts)

  // Load existing sale if editing
  useEffect(() => {
    if (existingSaleId) {
      const loadExistingSale = async () => {
        try {
          const supabase = createClient()
          
          // First, refresh products to get current stock
          const { data: freshProducts, error: productsError } = await supabase
            .from("retail_products")
            .select("id, name, size, product_type, cost_price, expenses, retail_price, quantity_in_stock")
            .order("product_type, name")

          if (productsError) throw productsError
          if (freshProducts) {
            setProducts(freshProducts)
          }

          // Then load the sale
          const { data: sale, error: saleError } = await supabase
            .from("sales")
            .select(`
              *,
              sales_items(
                id,
                quantity,
                unit_price,
                product_id,
                retail_products(id, name, size, product_type, cost_price, expenses, retail_price)
              )
            `)
            .eq("id", existingSaleId)
            .single()

          if (saleError) {
            console.error("Error loading sale:", saleError)
            throw saleError
          }

          console.log("Loaded sale:", sale)
          console.log("Sales items:", sale?.sales_items)

          if (sale?.sales_items && sale.sales_items.length > 0) {
            const items: SaleItem[] = sale.sales_items.map((item: any) => {
              console.log("Processing item:", item)
              const totalCost = (item.retail_products?.cost_price || 0) + (item.retail_products?.expenses || 0)
              return {
                product_type: item.retail_products?.product_type || "",
                product_id: item.product_id,
                product_name: item.retail_products?.name || "",
                product_size: item.retail_products?.size || "",
                quantity: item.quantity,
                unit_price: item.unit_price,
                cost_price: item.retail_products?.cost_price || 0,
                expenses: item.retail_products?.expenses || 0,
                line_total: item.quantity * item.unit_price,
                line_profit: (item.quantity * item.unit_price) - (item.quantity * totalCost),
              }
            })
            console.log("Mapped items:", items)
            setSaleItems(items)
          } else {
            console.log("No sales items found or empty array")
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to load existing sale")
        } finally {
          setIsLoadingExisting(false)
        }
      }
      loadExistingSale()
    } else {
      // For new sales, also refresh products to ensure we have latest stock
      const refreshProducts = async () => {
        try {
          const supabase = createClient()
          const { data: freshProducts } = await supabase
            .from("retail_products")
            .select("id, name, size, product_type, cost_price, expenses, retail_price, quantity_in_stock")
            .order("product_type, name")
          
          if (freshProducts) {
            setProducts(freshProducts)
          }
        } catch (err) {
          console.error("Error refreshing products:", err)
        }
      }
      refreshProducts()
    }
  }, [existingSaleId])

  // Calculate totals
  const totalRevenue = saleItems.reduce((sum, item) => sum + item.line_total, 0)
  const totalCost = saleItems.reduce((sum, item) => sum + ((item.cost_price + item.expenses) * item.quantity), 0)
  const totalProfit = totalRevenue - totalCost

  const handleAddItem = () => {
    setSaleItems([...saleItems, {
      product_type: "",
      product_id: "",
      product_name: "",
      product_size: "",
      quantity: 0,
      unit_price: 0,
      cost_price: 0,
      expenses: 0,
      line_total: 0,
      line_profit: 0,
    }])
  }

  const handleRemoveItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof SaleItem, value: string | number) => {
    const newItems = [...saleItems]
    const item = newItems[index]

    if (field === "product_type") {
      item.product_type = value as string
      // Reset product_id and size when product type changes
      item.product_id = ""
      item.product_name = ""
      item.product_size = ""
      item.unit_price = 0
      item.cost_price = 0
      item.expenses = 0
    } else if (field === "product_size") {
      item.product_size = value as string
      // Find the product with matching type and size
      const product = products.find(p => p.product_type === item.product_type && p.size === value)
      if (product) {
        item.product_id = product.id
        item.product_name = product.name
        item.unit_price = product.retail_price
        item.cost_price = product.cost_price
        item.expenses = product.expenses || 0
      } else {
        item.product_id = ""
        item.product_name = ""
        item.unit_price = 0
        item.cost_price = 0
        item.expenses = 0
      }
    } else if (field === "quantity") {
      item.quantity = Number(value) || 0
    } else if (field === "unit_price") {
      item.unit_price = Number(value) || 0
    }

    // Recalculate line totals
    const totalCost = item.cost_price + item.expenses
    item.line_total = item.quantity * item.unit_price
    item.line_profit = item.line_total - (totalCost * item.quantity)
    
    newItems[index] = item
    setSaleItems(newItems)
  }

  // Get unique product types
  const productTypes = Array.from(new Set(products.map(p => p.product_type).filter(Boolean)))

  // Get available sizes for a product type
  const getSizesForProductType = (productType: string) => {
    return products
      .filter(p => p.product_type === productType)
      .map(p => ({ size: p.size, stock: p.quantity_in_stock, product: p }))
      .sort((a, b) => {
        // Sort sizes logically (X, S, M, L, XL, XXL, XXXL or numeric)
        const sizeA = a.size
        const sizeB = b.size
        const numA = Number.parseInt(sizeA)
        const numB = Number.parseInt(sizeB)
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
          return numA - numB
        }
        return sizeA.localeCompare(sizeB)
      })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validate
      if (saleItems.length === 0) {
        throw new Error("Please add at least one product")
      }

      const invalidItems = saleItems.filter(item => !item.product_type || !item.product_size || !item.product_id || item.quantity <= 0)
      if (invalidItems.length > 0) {
        throw new Error("All items must have product type, size selected and quantity greater than 0")
      }

      // Check inventory availability
      for (const item of saleItems) {
        if (!item.product_id) {
          throw new Error("Please select both product type and size for all items")
        }
        const product = products.find(p => p.id === item.product_id)
        if (product && item.quantity > product.quantity_in_stock) {
          throw new Error(`Insufficient stock for ${item.product_type} (Size: ${item.product_size}). Available: ${product.quantity_in_stock}, Requested: ${item.quantity}`)
        }
      }

      const supabase = createClient()

      // Get or create a special "Daily Sales" customer for daily sales entries
      let dailySalesCustomerId: string
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id")
        .eq("name", "Daily Sales")
        .eq("customer_type", "retail")
        .maybeSingle()

      if (existingCustomer) {
        dailySalesCustomerId = existingCustomer.id
      } else {
        // Create a special customer for daily sales
        const { data: newCustomer, error: customerError } = await supabase
          .from("customers")
          .insert([{
            name: "Daily Sales",
            phone: "",
            customer_type: "retail",
          }])
          .select()
          .single()

        if (customerError) throw customerError
        dailySalesCustomerId = newCustomer.id
      }

      if (existingSaleId) {
        console.log("Updating existing sale, will restore old items first")
        // Fetch old sale items to restore inventory
        const { data: oldSaleItems, error: oldItemsError } = await supabase
          .from("sales_items")
          .select("product_id, quantity")
          .eq("sale_id", existingSaleId)

        if (oldItemsError) throw oldItemsError
        console.log("Found old sale items to restore:", oldSaleItems)

        // Restore inventory for old items
        // Aggregate quantities by product_id to handle multiple items of same product
        if (oldSaleItems && oldSaleItems.length > 0) {
          const quantitiesByProduct = new Map<string, number>()
          oldSaleItems.forEach(item => {
            const current = quantitiesByProduct.get(item.product_id) || 0
            quantitiesByProduct.set(item.product_id, current + item.quantity)
          })

          console.log("Restoring inventory for old items:", Array.from(quantitiesByProduct.entries()))

          for (const [productId, totalQuantity] of quantitiesByProduct.entries()) {
            // Fetch current stock from database to ensure accuracy
            const { data: currentProduct, error: fetchError } = await supabase
              .from("retail_products")
              .select("quantity_in_stock")
              .eq("id", productId)
              .single()

            if (fetchError) {
              console.error(`Error fetching product ${productId}:`, fetchError)
              throw fetchError
            }

            if (currentProduct) {
              const currentStock = Number(currentProduct.quantity_in_stock) || 0
              const quantityToRestore = Number(totalQuantity) || 0
              
              console.log(`[RESTORE] Product ${productId}:`)
              console.log(`  Current stock in DB: ${currentStock}`)
              console.log(`  Quantity to restore (from old sale): ${quantityToRestore}`)
              
              // Check if items were actually deducted in the first place
              // If current stock is already >= quantity to restore, items were likely never deducted
              // In this case, we should NOT restore (would double-add items)
              if (currentStock >= quantityToRestore) {
                console.warn(`  ⚠️ WARNING: Current stock (${currentStock}) >= quantity to restore (${quantityToRestore})`)
                console.warn(`  ⚠️ This suggests items were NEVER deducted when sale was created!`)
                console.warn(`  ⚠️ SKIPPING RESTORE to prevent double-adding items.`)
                console.log(`  ✅ Skipped restore - stock remains at ${currentStock}`)
                continue // Skip this restore
              }
              
              const restoredQuantity = currentStock + quantityToRestore
              console.log(`  Stock after restore: ${restoredQuantity}`)
              
              const { error: restoreError } = await supabase
                .from("retail_products")
                .update({ quantity_in_stock: restoredQuantity })
                .eq("id", productId)

              if (restoreError) {
                console.error(`Error restoring inventory for product ${productId}:`, restoreError)
                throw restoreError
              }
              
              console.log(`  ✅ Successfully restored to ${restoredQuantity}`)
            }
          }
        }

        // Update existing sale
        const { error: updateError } = await supabase
          .from("sales")
          .update({
            subtotal: totalRevenue,
            total_amount: totalRevenue,
            notes: `Daily sales for ${new Date(selectedDate).toLocaleDateString()}`,
          })
          .eq("id", existingSaleId)

        if (updateError) throw updateError

        // Delete existing items
        await supabase.from("sales_items").delete().eq("sale_id", existingSaleId)
      } else {
        // Create new daily sales record
        const invoiceNumber = `DAILY-${selectedDate.replace(/-/g, "")}-${Date.now()}`
        
        const { data: sale, error: saleError } = await supabase
          .from("sales")
          .insert([{
            customer_id: dailySalesCustomerId,
            invoice_number: invoiceNumber,
            sale_date: selectedDate,
            subtotal: totalRevenue,
            tax_amount: 0,
            discount_amount: 0,
            total_amount: totalRevenue,
            payment_status: "paid", // Daily sales are considered paid
            status: "completed",
            notes: `Daily sales for ${new Date(selectedDate).toLocaleDateString()}`,
          }])
          .select()
          .single()

        if (saleError) throw saleError
        existingSaleId = sale.id
      }

      const saleId = existingSaleId!
      
      // Create/update sale items
      const itemsToInsert = saleItems.map(item => ({
        sale_id: saleId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
      }))

      const { error: itemsError } = await supabase
        .from("sales_items")
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      // Update inventory for each product
      // Aggregate quantities by product_id to handle multiple items of same product
      const quantitiesByProduct = new Map<string, number>()
      saleItems.forEach(item => {
        if (item.product_id) {
          const current = quantitiesByProduct.get(item.product_id) || 0
          quantitiesByProduct.set(item.product_id, current + item.quantity)
        }
      })

      console.log("Deducting inventory for new items:", Array.from(quantitiesByProduct.entries()))
      console.log("Is updating existing sale?", !!existingSaleId)

      // Fetch current stock from database to ensure accuracy (especially after restoring old items)
      for (const [productId, totalQuantity] of quantitiesByProduct.entries()) {
        const { data: currentProduct, error: fetchError } = await supabase
          .from("retail_products")
          .select("quantity_in_stock")
          .eq("id", productId)
          .single()

        if (fetchError) {
          console.error(`Error fetching product ${productId}:`, fetchError)
          throw fetchError
        }

        if (currentProduct && totalQuantity > 0) {
          const currentStock = Number(currentProduct.quantity_in_stock) || 0
          const quantityToDeduct = Number(totalQuantity) || 0
          const newQuantity = currentStock - quantityToDeduct
          
          console.log(`[DEDUCT] Product ${productId}:`)
          console.log(`  Current stock in DB: ${currentStock}`)
          console.log(`  Quantity to deduct: ${quantityToDeduct}`)
          console.log(`  Stock after deduction: ${newQuantity}`)
          
          if (newQuantity < 0) {
            console.warn(`  ⚠️ WARNING: Stock would go negative! Current: ${currentStock}, Deducting: ${quantityToDeduct}`)
          }
          
          const { error: updateError } = await supabase
            .from("retail_products")
            .update({ quantity_in_stock: newQuantity })
            .eq("id", productId)

          if (updateError) {
            console.error(`  ❌ Error updating inventory:`, updateError)
            throw updateError
          }
          
          console.log(`  ✅ Successfully updated stock to ${newQuantity}`)
        } else {
          console.warn(`Skipping inventory update for product ${productId}: currentProduct=${!!currentProduct}, totalQuantity=${totalQuantity}`)
        }
      }

      // Refresh products to get updated stock
      const { data: refreshedProducts } = await supabase
        .from("retail_products")
        .select("id, name, size, product_type, cost_price, expenses, retail_price, quantity_in_stock")
        .order("product_type, name")
      
      if (refreshedProducts) {
        setProducts(refreshedProducts)
      }

      router.push("/dashboard/sales")
      router.refresh()
    } catch (err) {
      console.error("Daily sales error:", err)
      if (err instanceof Error) {
        setError(err.message)
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError(String(err.message))
      } else {
        setError("An error occurred. Please check the console for details.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Sales Entry - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoadingExisting ? (
          <div className="text-center py-8 text-muted-foreground">Loading existing sales...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Products Sold</Label>
              <Button type="button" variant="outline" onClick={handleAddItem} disabled={isLoading}>
                + Add Product
              </Button>
            </div>

          {saleItems.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">Product Type *</TableHead>
                    <TableHead className="w-[15%]">Size *</TableHead>
                    <TableHead className="w-[10%]">Stock</TableHead>
                    <TableHead className="w-[12%]">Quantity *</TableHead>
                    <TableHead className="w-[12%]">Unit Price</TableHead>
                    <TableHead className="w-[12%]">Line Total</TableHead>
                    <TableHead className="w-[12%]">Profit</TableHead>
                    <TableHead className="w-[2%]">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {saleItems.map((item, index) => {
                    const availableSizes = getSizesForProductType(item.product_type)
                    const selectedSizeData = availableSizes.find(s => s.size === item.product_size)
                    // Get the actual product to ensure we have the latest stock
                    const actualProduct = products.find(p => p.id === item.product_id)
                    let baseStock = actualProduct ? actualProduct.quantity_in_stock : (selectedSizeData?.stock ?? 0)
                    
                    // If viewing an existing sale, the database stock already has these items deducted
                    // So we need to add them back to get the "real" current stock before this sale
                    if (existingSaleId && item.product_id) {
                      // Find total quantity of this product in the current sale items
                      const totalQuantityInCurrentSale = saleItems
                        .filter(i => i.product_id === item.product_id)
                        .reduce((sum, i) => sum + (i.quantity || 0), 0)
                      
                      // Add back what's already in this sale (since DB stock already deducted it)
                      baseStock = baseStock + totalQuantityInCurrentSale
                    }
                    
                    // Display what the stock will be AFTER this sale is saved
                    // This is: current stock - what we're selling
                    const totalQuantityBeingSold = saleItems
                      .filter(i => i.product_id === item.product_id)
                      .reduce((sum, i) => sum + (i.quantity || 0), 0)
                    
                    const displayStock = Math.max(0, baseStock - totalQuantityBeingSold)
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.product_type}
                            onValueChange={(value) => handleItemChange(index, "product_type", value)}
                            disabled={isLoading}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product type" />
                            </SelectTrigger>
                            <SelectContent>
                              {productTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.product_size}
                            onValueChange={(value) => handleItemChange(index, "product_size", value)}
                            disabled={isLoading || !item.product_type}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableSizes.map((sizeData) => (
                                <SelectItem key={sizeData.size} value={sizeData.size}>
                                  {sizeData.size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.product_id ? (
                            <span className={displayStock > 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                              {displayStock}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity || ""}
                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                            disabled={isLoading || !item.product_id}
                            className="w-full"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unit_price || ""}
                            onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
                            disabled={isLoading}
                            className="w-full"
                          />
                        </TableCell>
                        <TableCell className="font-semibold">
                          ₹{item.line_total.toFixed(2)}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          ₹{item.line_profit.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            disabled={isLoading}
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
          )}

          {saleItems.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Revenue:</span>
                <span className="font-semibold">₹{totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Cost:</span>
                <span className="font-semibold">₹{totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t">
                <span className="font-bold">Total Profit:</span>
                <span className="font-bold text-green-600">₹{totalProfit.toFixed(2)}</span>
              </div>
            </div>
          )}

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading || saleItems.length === 0}>
              {isLoading ? "Saving..." : "Save Daily Sales"}
            </Button>
            <Link href="/dashboard/sales">
              <Button type="button" variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
        )}
      </CardContent>
    </Card>
  )
}

