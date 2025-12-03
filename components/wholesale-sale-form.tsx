"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductSearch, type ProductSearchResult } from "@/components/product-search"
import { BuyerPhoneSearch, type BuyerSearchResult } from "@/components/buyer-phone-search"

interface Product { 
  id: string; 
  name: string; 
  sku: string; 
  wholesale_price: number;
  gst_percentage?: number;
  gst_amount?: number; // Add gst_amount field
}

interface Line { 
  product_id: string; 
  quantity: number | ""; 
  unit_price: number | "";
  cgst_amount: number | "";
  sgst_amount: number | "";
}

interface SaleData {
  id?: string
  customer_id?: string
  customer_name?: string
  sale_date?: string
  invoice_number?: string
  payment_status?: string
  customer_phone?: string
  customer_email?: string
  customer_city?: string
  customer_state?: string
  customer_postal_code?: string
  customer_country?: string
  wholesale_sales_items?: Array<{
    product_id: string
    quantity: number
    unit_price: number
    cgst_amount: number
    sgst_amount: number
    wholesale_products?: { id: string }
  }>
}

export function WholesaleSaleForm({ 
  products, 
  initialData 
}: { 
  products: Product[]
  initialData?: SaleData
}) {
  const router = useRouter()
  const isEditMode = !!initialData?.id
  
  // Load customer details from initialData if available
  const [buyerName, setBuyerName] = useState(initialData?.customer_name || "")
  const [buyerPhone, setBuyerPhone] = useState(initialData?.customer_phone || "")
  const [buyerAddress, setBuyerAddress] = useState("")
  const [buyerCity, setBuyerCity] = useState(initialData?.customer_city || "")
  const [buyerState, setBuyerState] = useState(initialData?.customer_state || "")
  const [buyerPostalCode, setBuyerPostalCode] = useState(initialData?.customer_postal_code || "")
  const [buyerCountry, setBuyerCountry] = useState(initialData?.customer_country || "")
  const [saleDate, setSaleDate] = useState(
    initialData?.sale_date ? new Date(initialData.sale_date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  )
  const [cgstAmount, setCgstAmount] = useState("")
  const [sgstAmount, setSgstAmount] = useState("")
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(initialData?.customer_id || null)
  
  // Initialize lines from existing items or empty
  const initialLines: Line[] = initialData?.wholesale_sales_items?.length 
    ? initialData.wholesale_sales_items.map((item: any) => ({
        product_id: item.product_id || item.wholesale_products?.id || "",
        quantity: item.quantity || "",
        unit_price: item.unit_price || "",
        cgst_amount: item.cgst_amount || "",
        sgst_amount: item.sgst_amount || "",
      }))
    : [{ product_id: "", quantity: "", unit_price: "", cgst_amount: "", sgst_amount: "" }]
  
  const [lines, setLines] = useState<Line[]>(initialLines)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [printAfterSave, setPrintAfterSave] = useState(false)
  
  // Treat a line as valid if it has either a selected product_id OR a positive unit_price (user typed), and positive qty
  const validLines = lines.filter((l) => ((l.product_id && l.product_id.length > 0) || (Number(l.unit_price) || 0) > 0) && (Number(l.quantity) || 0) > 0)
  const displayLines = lines.filter((l) => (Number(l.quantity) || 0) > 0 && (Number(l.unit_price) || 0) >= 0)
  
  // GST calculation - using actual amounts entered by user
  const gstAmount = (parseFloat(cgstAmount) || 0) + (parseFloat(sgstAmount) || 0)

  // Calculate subtotal, GST amounts, and total
  const subtotal = displayLines.reduce((s, l) => s + ((Number(l.quantity) || 0) * (Number(l.unit_price) || 0)), 0)
  
  // Calculate total GST amount from all lines
  const totalGstAmount = displayLines.reduce((total, l) => {
    const cgst = Number(l.cgst_amount) || 0
    const sgst = Number(l.sgst_amount) || 0
    return total + cgst + sgst
  }, 0)
  
  const total = subtotal + totalGstAmount
  
  const onChangeLine = (index: number, field: keyof Line, value: string | number) => {
    setLines((prevLines) => {
      const newLines = [...prevLines]
      // @ts-ignore
      newLines[index] = { ...newLines[index], [field]: value }
      
      return newLines
    })
  }
  
  const addLine = () => setLines([...lines, { product_id: "", quantity: "", unit_price: "", cgst_amount: "", sgst_amount: "" }])
  const removeLine = (i: number) => setLines(lines.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      if (!buyerName.trim() || !buyerPhone.trim()) throw new Error("Buyer name and phone are required")
      
      // Filter lines that have both product_id AND valid quantity - these are the ones we can insert
      const itemsWithProduct = lines.filter(
        (l) => l.product_id && l.product_id.trim() !== "" && (Number(l.quantity) || 0) > 0
      )

      if (itemsWithProduct.length === 0) {
        throw new Error("Please select a product for at least one line item")
      }

      const supabase = createClient()
      
      if (isEditMode && initialData?.id) {
        // Update existing sale
        // First, update or create the buyer record
        let customerId = initialData.customer_id
        if (buyerName.trim() && buyerPhone.trim()) {
          if (customerId && selectedBuyerId) {
            // Update existing buyer
            const { error: buyerErr } = await supabase
              .from("wholesale_buyers")
              .update({
                name: buyerName.trim(),
                phone: buyerPhone,
                address: buyerAddress || null,
                city: buyerCity || null,
                state: buyerState || null,
                postal_code: buyerPostalCode || null,
                country: buyerCountry || null,
              })
              .eq("id", customerId)
            
            if (buyerErr) throw buyerErr
          } else {
            // Create new buyer
            const { data: newBuyer, error: buyerErr } = await supabase
              .from("wholesale_buyers")
              .insert([
                {
                  name: buyerName.trim(),
                  phone: buyerPhone,
                  address: buyerAddress || null,
                  city: buyerCity || null,
                  state: buyerState || null,
                  postal_code: buyerPostalCode || null,
                  country: buyerCountry || null,
                },
              ])
              .select()
              .single()
            
            if (buyerErr) throw buyerErr
            customerId = newBuyer.id
            setSelectedBuyerId(newBuyer.id)
          }
        }
        
        const { error: saleErr } = await supabase
          .from("wholesale_sales")
          .update({
            customer_id: customerId || null,
            customer_name: buyerName || null,
            customer_phone: buyerPhone || null,
            customer_address: buyerAddress || null,
            customer_city: buyerCity || null,
            customer_state: buyerState || null,
            customer_postal_code: buyerPostalCode || null,
            customer_country: buyerCountry || null,
            sale_date: saleDate,
            subtotal: subtotal,
            tax_amount: totalGstAmount,
            total_amount: total,
            payment_status: initialData.payment_status || "pending",
          })
          .eq("id", initialData.id)
        
        if (saleErr) throw saleErr

        // Get old items to restore stock before deleting them
        const { data: oldItems } = await supabase
          .from("wholesale_sales_items")
          .select("product_id, quantity")
          .eq("sale_id", initialData.id)

        // Restore stock from old items
        if (oldItems && oldItems.length > 0) {
          console.log("Restoring stock from old sale items...")
          for (const oldItem of oldItems) {
            const productId = oldItem.product_id
            const quantityToRestore = Number(oldItem.quantity) || 0
            
            if (quantityToRestore > 0) {
              const { data: currentProduct } = await supabase
                .from("wholesale_products")
                .select("quantity_in_stock")
                .eq("id", productId)
                .single()
              
              if (currentProduct) {
                const currentStock = Number(currentProduct.quantity_in_stock) || 0
                const newStock = currentStock + quantityToRestore
                
                console.log(`Restoring stock for product ${productId}: ${currentStock} + ${quantityToRestore} = ${newStock}`)
                
                await supabase
                  .from("wholesale_products")
                  .update({ quantity_in_stock: newStock })
                  .eq("id", productId)
              }
            }
          }
        }

        // Delete existing items and insert new ones
        await supabase.from("wholesale_sales_items").delete().eq("sale_id", initialData.id)

        const items = itemsWithProduct.map((l) => ({
          sale_id: initialData.id,
          product_id: l.product_id.trim(),
          quantity: l.quantity,
          unit_price: l.unit_price,
          cgst_amount: l.cgst_amount || 0,
          sgst_amount: l.sgst_amount || 0,
          line_total: (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
        }))

        const { error: itemsErr } = await supabase.from("wholesale_sales_items").insert(items)
        if (itemsErr) throw itemsErr

        // Update wholesale product stock - deduct sold quantities
        console.log("Updating wholesale product stock for edited sale...")
        for (const item of itemsWithProduct) {
          const productId = item.product_id.trim()
          const quantitySold = Number(item.quantity) || 0
          
          if (quantitySold > 0) {
            // Get current stock
            const { data: currentProduct, error: productError } = await supabase
              .from("wholesale_products")
              .select("quantity_in_stock")
              .eq("id", productId)
              .single()
            
            if (productError) {
              console.error(`Error fetching product ${productId}:`, productError)
              // Continue with other products even if one fails
              continue
            }
            
            if (currentProduct) {
              const currentStock = Number(currentProduct.quantity_in_stock) || 0
              const newStock = currentStock - quantitySold
              
              console.log(`Product ${productId}: Current stock: ${currentStock}, Deducting: ${quantitySold}, New stock: ${newStock}`)
              
              if (newStock < 0) {
                console.warn(`⚠️ WARNING: Stock would go negative for product ${productId}!`)
              }
              
              const { error: updateError } = await supabase
                .from("wholesale_products")
                .update({ quantity_in_stock: newStock })
                .eq("id", productId)
              
              if (updateError) {
                console.error(`Error updating stock for product ${productId}:`, updateError)
                // Continue with other products
              } else {
                console.log(`✅ Successfully updated stock for product ${productId} to ${newStock}`)
              }
            }
          }
        }

        // Redirect with print parameter if needed
        router.push(`/dashboard/b2b-sales/${initialData.id}${printAfterSave ? "/print" : ""}`)
      } else {
        // Create new sale
        const invoice = `WB-${Date.now()}`

        // Find or create buyer by phone number only
        let customerId: string
        const { data: existingBuyer } = await supabase
          .from("wholesale_buyers")
          .select("id")
          .eq("phone", buyerPhone)
          .maybeSingle()

        if (existingBuyer) {
          customerId = existingBuyer.id
          // Update existing buyer with any new information
          await supabase
            .from("wholesale_buyers")
            .update({
              name: buyerName.trim(),
              address: buyerAddress || null,
              city: buyerCity || null,
              state: buyerState || null,
              postal_code: buyerPostalCode || null,
              country: buyerCountry || null,
            })
            .eq("id", customerId)
        } else {
          // Create new buyer
          const { data: newBuyer, error: buyerErr } = await supabase
            .from("wholesale_buyers")
            .insert([
              {
                name: buyerName.trim(),
                phone: buyerPhone,
                address: buyerAddress || null,
                city: buyerCity || null,
                state: buyerState || null,
                postal_code: buyerPostalCode || null,
                country: buyerCountry || null,
              },
            ])
            .select()
            .single()

          if (buyerErr) throw buyerErr
          customerId = newBuyer.id
          setSelectedBuyerId(newBuyer.id)
        }

        const { data: sale, error: saleErr } = await supabase
          .from("wholesale_sales")
          .insert([
            {
              customer_id: customerId,
              customer_name: buyerName || null,
              customer_phone: buyerPhone || null,
              customer_address: buyerAddress || null,
              customer_city: buyerCity || null,
              customer_state: buyerState || null,
              customer_postal_code: buyerPostalCode || null,
              customer_country: buyerCountry || null,
              invoice_number: invoice,
              sale_date: saleDate,
              subtotal: subtotal,
              tax_amount: totalGstAmount,
              discount_amount: 0,
              total_amount: total,
              payment_status: "pending",
            },
          ])
          .select()
          .single()
        
        if (saleErr) throw saleErr

        const items = itemsWithProduct.map((l) => ({
          sale_id: sale.id,
          product_id: l.product_id.trim(),
          quantity: l.quantity,
          unit_price: l.unit_price,
          cgst_amount: l.cgst_amount || 0,
          sgst_amount: l.sgst_amount || 0,
          line_total: (Number(l.quantity) || 0) * (Number(l.unit_price) || 0),
        }))

        const { error: itemsErr } = await supabase.from("wholesale_sales_items").insert(items)
        
        if (itemsErr) throw itemsErr

        // Update wholesale product stock - deduct sold quantities
        console.log("Updating wholesale product stock for new sale...")
        for (const item of itemsWithProduct) {
          const productId = item.product_id.trim()
          const quantitySold = Number(item.quantity) || 0
          
          if (quantitySold > 0) {
            // Get current stock
            const { data: currentProduct, error: productError } = await supabase
              .from("wholesale_products")
              .select("quantity_in_stock")
              .eq("id", productId)
              .single()
            
            if (productError) {
              console.error(`Error fetching product ${productId}:`, productError)
              throw new Error(`Failed to fetch product stock for ${productId}: ${productError.message}`)
            }
            
            if (currentProduct) {
              const currentStock = Number(currentProduct.quantity_in_stock) || 0
              const newStock = currentStock - quantitySold
              
              console.log(`Product ${productId}: Current stock: ${currentStock}, Deducting: ${quantitySold}, New stock: ${newStock}`)
              
              if (newStock < 0) {
                console.warn(`⚠️ WARNING: Stock would go negative for product ${productId}! Current: ${currentStock}, Deducting: ${quantitySold}`)
                // You might want to throw an error here or show a warning
                // throw new Error(`Insufficient stock for product. Available: ${currentStock}, Required: ${quantitySold}`)
              }
              
              const { data: updatedProduct, error: updateError } = await supabase
                .from("wholesale_products")
                .update({ quantity_in_stock: newStock })
                .eq("id", productId)
                .select()
              
              if (updateError) {
                console.error(`❌ Error updating stock for product ${productId}:`, updateError)
                console.error(`Error details:`, JSON.stringify(updateError, null, 2))
                throw new Error(`Failed to update product stock for ${productId}: ${updateError.message}. Code: ${updateError.code || 'N/A'}, Hint: ${updateError.hint || 'N/A'}`)
              }
              
              if (!updatedProduct || updatedProduct.length === 0) {
                console.warn(`⚠️ WARNING: Update returned no rows for product ${productId}. This might indicate an RLS policy issue.`)
                throw new Error(`Stock update returned no rows for product ${productId}. This might be due to Row Level Security (RLS) policies.`)
              }
              
              console.log(`✅ Successfully updated stock for product ${productId} to ${newStock}`)
              console.log(`Updated product data:`, updatedProduct[0])
              
              // Verify the update by reading back the value
              const { data: verifyProduct, error: verifyError } = await supabase
                .from("wholesale_products")
                .select("quantity_in_stock")
                .eq("id", productId)
                .single()
              
              if (verifyError) {
                console.warn(`⚠️ Could not verify stock update for product ${productId}:`, verifyError)
              } else if (verifyProduct) {
                const verifiedStock = Number(verifyProduct.quantity_in_stock) || 0
                if (verifiedStock !== newStock) {
                  console.error(`❌ STOCK UPDATE MISMATCH for product ${productId}: Expected ${newStock}, but database shows ${verifiedStock}`)
                  throw new Error(`Stock update verification failed for product ${productId}. Expected ${newStock}, but database shows ${verifiedStock}`)
                } else {
                  console.log(`✓ Verified: Stock correctly updated to ${verifiedStock} for product ${productId}`)
                }
              }
            }
          }
        }

        // Create credit ledger entry (debit - buyer owes us more)
        const { data: lastEntry } = await supabase
          .from("buyer_credit_ledger")
          .select("balance_after")
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        const previousBalance = Number(lastEntry?.balance_after || 0)
        const newBalance = previousBalance + total // Debit increases balance (what buyer owes)

        const { error: ledgerErr } = await supabase.from("buyer_credit_ledger").insert([
          {
            customer_id: customerId,
            transaction_type: "debit", // Debit = sale/invoice (increases what buyer owes)
            amount: total,
            reference_type: "wholesale_sale",
            reference_id: sale.id,
            description: `Sale ${invoice}`,
            balance_after: newBalance,
          },
        ])

        if (ledgerErr) throw ledgerErr

        // Redirect with print parameter if needed
        router.push(`/dashboard/b2b-sales/${sale.id}${printAfterSave ? "/print" : ""}`)
      }
      
      router.refresh()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create sale"
      console.error("❌ Sale creation error:", err)
      console.error("Error details:", JSON.stringify(err, null, 2))
      setError(errorMessage)
      // Also show alert for visibility
      alert(`Error: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Create a map of products for quick lookup
  const productMap = new Map<string, Product>()
  products.forEach(product => {
    productMap.set(product.id, product)
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Wholesale Sale" : "Wholesale Sale"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Buyer Name *</Label>
              <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} disabled={isLoading} required />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <BuyerPhoneSearch 
                value={buyerPhone} 
                onSelect={(buyer: BuyerSearchResult) => {
                  setBuyerPhone(buyer.phone || "")
                  if (buyer.id) {
                    // Existing buyer selected
                    setBuyerName(buyer.name || "")
                    setBuyerAddress(buyer.address || "")
                    setBuyerCity(buyer.city || "")
                    setBuyerState(buyer.state || "")
                    setBuyerPostalCode(buyer.postal_code || "")
                    setSelectedBuyerId(buyer.id)
                  } else if (buyer.phone && !buyer.name) {
                    // New buyer with phone only - keep current name if already entered
                    // Or clear name if it was auto-filled from previous selection
                  }
                }} 
                disabled={isLoading}
                placeholder="Enter buyer phone number..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Address</Label>
              <Input value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={buyerCity} onChange={(e) => setBuyerCity(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={buyerState} onChange={(e) => setBuyerState(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label>Postal Code</Label>
              <Input value={buyerPostalCode} onChange={(e) => setBuyerPostalCode(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input value={buyerCountry} onChange={(e) => setBuyerCountry(e.target.value)} disabled={isLoading} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Items</Label>
              <Button type="button" variant="outline" onClick={addLine} disabled={isLoading}>+ Add Item</Button>
            </div>

            {lines.map((l, i) => {
              const lineSubtotal = (Number(l.quantity) || 0) * (Number(l.unit_price) || 0)
              const lineCgst = Number(l.cgst_amount) || 0
              const lineSgst = Number(l.sgst_amount) || 0
              const lineTotal = lineSubtotal + lineCgst + lineSgst
              
              return (
                <div key={i} className="grid grid-cols-1 md:grid-cols-7 gap-2 items-end">
                  <div className="space-y-2">
                    <Label>Product *</Label>
                    <ProductSearch
                      value={l.product_id}
                      showDeleted={true}
                      onSelect={(p: ProductSearchResult) => {
                        // Update both product_id and unit_price in a single state update to avoid race conditions
                        setLines((prevLines) => {
                          const newLines = [...prevLines]
                          if (p.id && p.id.trim() !== "") {
                            // Get the full product details including GST amount
                            const product = productMap.get(p.id)
                            const unitPrice = Number(p.wholesale_price || 0)
                            
                            // Simply split the gst_amount by 2
                            let cgstAmount: number | "" = ""
                            let sgstAmount: number | "" = ""
                            if (product && product.gst_amount) {
                              const gstAmount = product.gst_amount
                              cgstAmount = gstAmount / 2
                              sgstAmount = gstAmount / 2
                            }
                            
                            newLines[i] = {
                              ...newLines[i],
                              product_id: p.id.trim(),
                              unit_price: unitPrice,
                              cgst_amount: cgstAmount,
                              sgst_amount: sgstAmount,
                            }
                          }
                          return newLines
                        })
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={Number.isFinite(l.quantity) && l.quantity !== 0 ? l.quantity : ""}
                      onChange={(e) => {
                        const v = e.target.value
                        onChangeLine(i, "quantity", v === "" ? "" : Number.parseInt(v))
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit Price *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={Number.isFinite(l.unit_price) && l.unit_price !== 0 ? l.unit_price : ""}
                      onChange={(e) => {
                        const v = e.target.value
                        onChangeLine(i, "unit_price", v === "" ? "" : Number.parseFloat(v))
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CGST Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={l.cgst_amount}
                      onChange={(e) => {
                        const v = e.target.value
                        onChangeLine(i, "cgst_amount", v === "" ? "" : Number.parseFloat(v))
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SGST Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={l.sgst_amount}
                      onChange={(e) => {
                        const v = e.target.value
                        onChangeLine(i, "sgst_amount", v === "" ? "" : Number.parseFloat(v))
                      }}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Line Total</Label>
                    <Input type="text" value={`₹${lineTotal.toFixed(2)}`} disabled />
                  </div>
                  <Button type="button" variant="destructive" onClick={() => removeLine(i)} disabled={isLoading || lines.length === 1}>Remove</Button>
                </div>
              )
            })}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total GST:</span>
                <span className="font-semibold">₹{totalGstAmount.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-sm text-muted-foreground">Total Amount</span>
                <span className="text-3xl font-bold text-foreground">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Sale"}
            </Button>
            <Button 
              type="submit" 
              variant="outline" 
              disabled={isLoading}
              onClick={() => setPrintAfterSave(true)}
            >
              {isLoading ? "Saving..." : "Save & Print"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}