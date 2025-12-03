"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Supplier { id: string; name: string }

interface PaymentData {
  id?: string
  supplier_id: string
  amount: number
  payment_date: string
  method: string
  reference_no?: string
  notes?: string
  purchase_order_id?: string
}

export function RecordPaymentForm({ 
  suppliers, 
  initialData 
}: { 
  suppliers: Supplier[]
  initialData?: PaymentData
}) {
  const router = useRouter()
  const isEditMode = !!initialData?.id
  
  const [supplierId, setSupplierId] = useState(initialData?.supplier_id || suppliers[0]?.id || "")
  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || "")
  const [paymentDate, setPaymentDate] = useState<string>(
    initialData?.payment_date || new Date().toISOString().split("T")[0]
  )
  const [method, setMethod] = useState<string>(initialData?.method || "bank")
  const [referenceNo, setReferenceNo] = useState<string>(initialData?.reference_no || "")
  const [notes, setNotes] = useState<string>(initialData?.notes || "")
  const [supplierOrders, setSupplierOrders] = useState<Array<{ id: string; order_number: string }>>([])
  const [purchaseOrderId, setPurchaseOrderId] = useState<string>(initialData?.purchase_order_id || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)

  useEffect(() => {
    const loadOrders = async () => {
      if (!supplierId) {
        setSupplierOrders([])
        setPurchaseOrderId("")
        return
      }
      const supabase = createClient()
      const { data } = await supabase
        .from("purchase_orders")
        .select("id, order_number")
        .eq("supplier_id", supplierId)
        .order("order_date", { ascending: false })
      setSupplierOrders(data || [])
    }
    loadOrders()
  }, [supplierId])

  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!purchaseOrderId) {
        setSelectedOrder(null)
        return
      }
      
      const supabase = createClient()
      const { data: order, error } = await supabase
        .from("purchase_orders")
        .select(`
          id, 
          order_number, 
          order_date, 
          total_amount,
          purchase_order_items(
            id,
            quantity,
            unit_price,
            line_total,
            wholesale_products(
              id,
              name,
              sku
            )
          )
        `)
        .eq("id", purchaseOrderId)
        .single()
      
      if (error || !order) {
        setSelectedOrder(null)
        return
      }
      
      setSelectedOrder(order)
    }
    
    loadOrderDetails()
  }, [purchaseOrderId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const amountNum = Number(amount)
      // Validate supplier_id is not empty
      if (!supplierId || supplierId.trim() === "" || !amount || !Number.isFinite(amountNum) || amountNum <= 0) {
        throw new Error("Please select supplier and enter a valid amount")
      }

      const supabase = createClient()
      
      if (isEditMode && initialData?.id) {
        // Update existing payment
        const { error: updateErr } = await supabase
          .from("payments")
          .update({
            supplier_id: supplierId.trim(),
            amount: amountNum,
            payment_date: paymentDate,
            method,
            reference_no: referenceNo?.trim() || null,
            purchase_order_id: purchaseOrderId?.trim() || null,
            notes: notes?.trim() || null,
          })
          .eq("id", initialData.id)

        if (updateErr) throw updateErr
        
        // Update the corresponding credit ledger entry
        const { error: ledgerErr } = await supabase
          .from("credit_ledger")
          .update({
            supplier_id: supplierId.trim(),
            amount: amountNum,
            description: `Payment ${method}${purchaseOrderId ? ` for ${supplierOrders.find(o => o.id === purchaseOrderId)?.order_number || "PO"}` : ""}${referenceNo ? ` (${referenceNo})` : ""}`,
          })
          .eq("reference_id", initialData.id)
          .eq("reference_type", "payment")

        if (ledgerErr) throw ledgerErr
        
        router.push("/dashboard/payments")
        router.refresh()
      } else {
        // Insert payment - ensure UUID fields are valid
        const { data: payment, error: payErr } = await supabase
          .from("payments")
          .insert([
            {
              supplier_id: supplierId.trim(),
              amount: amountNum,
              payment_date: paymentDate,
              method,
              reference_no: referenceNo?.trim() || null,
              purchase_order_id: purchaseOrderId?.trim() || null,
              notes: notes?.trim() || null,
            },
          ])
          .select()
          .single()

        if (payErr) throw payErr

        // Fetch previous balance
        const { data: lastEntry } = await supabase
          .from("credit_ledger")
          .select("balance_after")
          .eq("supplier_id", supplierId.trim())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        const previousBalance = Number(lastEntry?.balance_after || 0)
        const newBalance = previousBalance - amountNum

        // Insert debit into ledger - ensure supplier_id is valid UUID
        const { error: ledgerErr } = await supabase.from("credit_ledger").insert([
          {
            supplier_id: supplierId.trim(),
            transaction_type: "debit",
            amount: amountNum,
            reference_type: "payment",
            reference_id: payment.id,
            description: `Payment ${method}${purchaseOrderId ? ` for ${supplierOrders.find(o => o.id === purchaseOrderId)?.order_number || "PO"}` : ""}${referenceNo ? ` (${referenceNo})` : ""}`,
            balance_after: newBalance,
          },
        ])

        if (ledgerErr) throw ledgerErr

        router.push("/dashboard/payments")
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? "Edit Payment" : "New Payment"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Supplier *</Label>
              <Select value={supplierId} onValueChange={(v) => { setSupplierId(v); setPurchaseOrderId("") }} disabled={isLoading || isEditMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input
                type="number"
                step="0.01"
                value={amount || ""}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={setMethod} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Purchase Order (optional)</Label>
              <select
                className="w-full h-9 rounded-md border border-input px-3"
                value={purchaseOrderId}
                onChange={(e) => setPurchaseOrderId(e.target.value)}
                disabled={isLoading || supplierOrders.length === 0 || isEditMode}
              >
                <option value="">Select order</option>
                {supplierOrders.map((o) => (
                  <option key={o.id} value={o.id}>{o.order_number}</option>
                ))}
              </select>
              {selectedOrder && (
                <div className="bg-muted p-3 rounded-md text-sm mt-2 border border-muted-foreground/10">
                  <div className="mb-3 space-y-1">
                    <div><span className="text-muted-foreground font-semibold">Date:</span> {selectedOrder.order_date ? new Date(selectedOrder.order_date).toLocaleDateString() : '-'}</div>
                    <div><span className="text-muted-foreground font-semibold">Total:</span> ₹{Number(selectedOrder.total_amount || 0).toFixed(2)}</div>
                  </div>
                  {selectedOrder.purchase_order_items && selectedOrder.purchase_order_items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-muted-foreground/20">
                      <div className="font-semibold text-gray-900 mb-2">Order Items:</div>
                      <div className="space-y-2">
                        {selectedOrder.purchase_order_items.map((item: any, idx: number) => (
                          <div key={item.id || idx} className="text-xs bg-white p-2 rounded border border-gray-200">
                            <div className="font-medium text-gray-900">
                              {item.wholesale_products?.name || 'Unknown Product'}
                              {item.wholesale_products?.sku && <span className="text-gray-500 ml-2">({item.wholesale_products.sku})</span>}
                            </div>
                            <div className="text-gray-600 mt-1">
                              Qty: {item.quantity} × ₹{Number(item.unit_price || 0).toFixed(2)} = ₹{Number(item.line_total || 0).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {typeof selectedOrder.outstanding === 'number' && (
                    <div className="mt-2 pt-2 border-t border-muted-foreground/20">
                      <div><span className="text-muted-foreground font-semibold">Outstanding:</span> ₹{Number(selectedOrder.outstanding).toFixed(2)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Reference No</Label>
              <Input value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <textarea className="w-full px-3 py-2 border border-input rounded-md" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isLoading} />
            </div>
          </div>

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "Saving..." : (isEditMode ? "Update Payment" : "Save Payment")}
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


