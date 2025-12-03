"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BuyerPhoneSearch, BuyerSearchResult } from "@/components/buyer-phone-search"

export function RecordBuyerPaymentForm() {
  const router = useRouter()
  const [buyerName, setBuyerName] = useState<string>("")
  const [buyerPhone, setBuyerPhone] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split("T")[0])
  const [method, setMethod] = useState<string>("bank")
  const [referenceNo, setReferenceNo] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [buyerSales, setBuyerSales] = useState<Array<{ id: string; invoice_number: string; total_amount: number; sale_date: string; outstanding: number }>>([])
  const [wholesaleSaleId, setWholesaleSaleId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [buyerId, setBuyerId] = useState<string>("")

  // Handle buyer selection from phone search
  const handleBuyerSelect = (buyer: BuyerSearchResult) => {
    if (buyer.id) {
      // Buyer selected
      setBuyerName(buyer.name)
      setBuyerPhone(buyer.phone || "")
      setBuyerId(buyer.id)
      // Load sales for this buyer
      loadBuyerSales(buyer.id)
    } else {
      // Buyer cleared
      setBuyerName("")
      setBuyerPhone("")
      setBuyerId("")
      setBuyerSales([])
      setWholesaleSaleId("")
    }
  }

  // Load sales for a specific buyer
  const loadBuyerSales = async (buyerIdToLoad: string) => {
    if (!buyerIdToLoad) {
      setBuyerSales([])
      setWholesaleSaleId("")
      return
    }
    
    const supabase = createClient()
    // Load sales for this buyer with payment info
    const { data: sales } = await supabase
      .from("wholesale_sales")
      .select("id, invoice_number, total_amount, sale_date")
      .eq("customer_id", buyerIdToLoad)
      .order("sale_date", { ascending: false })
    
    // Get payments for each sale to calculate outstanding
    if (sales) {
      const salesWithOutstanding = await Promise.all(
        sales.map(async (sale) => {
          const { data: payments } = await supabase
            .from("buyer_payments")
            .select("amount")
            .eq("wholesale_sale_id", sale.id)
          
          const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0
          const outstanding = Number(sale.total_amount) - totalPaid
          
          return {
            ...sale,
            outstanding: outstanding > 0 ? outstanding : 0
          }
        })
      )
      setBuyerSales(salesWithOutstanding)
    } else {
      setBuyerSales([])
    }
  }

  useEffect(() => {
    const loadSaleDetails = async () => {
      if (!wholesaleSaleId) {
        setSelectedSale(null)
        return
      }
      
      const supabase = createClient()
      const { data: sale, error } = await supabase
        .from("wholesale_sales")
        .select(`
          id, 
          invoice_number, 
          sale_date, 
          total_amount,
          wholesale_sales_items(
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
        .eq("id", wholesaleSaleId)
        .single()
      
      if (error || !sale) {
        setSelectedSale(null)
        return
      }
      
      setSelectedSale(sale)
    }
    
    loadSaleDetails()
  }, [wholesaleSaleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const amountNum = Number(amount)
      if (!buyerName.trim() || !buyerPhone.trim()) {
        throw new Error("Please search and select a buyer by phone number")
      }
      if (!buyerId) {
        throw new Error("Please select a buyer from the search results")
      }
      if (!amount || !Number.isFinite(amountNum) || amountNum <= 0) {
        throw new Error("Please enter a valid amount")
      }
      if (buyerSales.length > 0 && (!wholesaleSaleId || wholesaleSaleId === "none")) {
        throw new Error("Please select an invoice to link this payment to")
      }

      const supabase = createClient()
      const finalBuyerId = buyerId

      // Insert payment received from buyer
      const { data: payment, error: payErr } = await supabase
        .from("buyer_payments")
        .insert([
          {
            customer_id: finalBuyerId,
            amount: amountNum,
            payment_date: paymentDate,
            method,
            reference_no: referenceNo?.trim() || null,
            wholesale_sale_id: wholesaleSaleId && wholesaleSaleId !== "none" ? wholesaleSaleId.trim() : null,
            notes: notes?.trim() || null,
          },
        ])
        .select()
        .single()

      if (payErr) throw payErr

      // Fetch previous balance (what buyer owes us)
      const { data: lastEntry } = await supabase
        .from("buyer_credit_ledger")
        .select("balance_after")
        .eq("customer_id", finalBuyerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const previousBalance = Number(lastEntry?.balance_after || 0)
      // When buyer pays, their balance decreases (credit entry)
      const newBalance = previousBalance - amountNum

      // Insert credit into buyer ledger (payment received reduces what they owe)
      const { error: ledgerErr } = await supabase.from("buyer_credit_ledger").insert([
        {
          customer_id: finalBuyerId,
          transaction_type: "credit", // Credit = payment received (reduces balance)
          amount: amountNum,
          reference_type: "buyer_payment",
          reference_id: payment.id,
          description: `Payment received ${method}${wholesaleSaleId && wholesaleSaleId !== "none" ? ` for ${buyerSales.find(s => s.id === wholesaleSaleId)?.invoice_number || "Invoice"}` : ""}${referenceNo ? ` (${referenceNo})` : ""}`,
          balance_after: newBalance,
        },
      ])

      if (ledgerErr) throw ledgerErr

      router.push("/dashboard/buyer-credit-ledger")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment from Buyer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="buyerPhone">Enter Buyer Phone *</Label>
            <BuyerPhoneSearch
              value={buyerPhone}
              onSelect={handleBuyerSelect}
              disabled={isLoading}
              placeholder="Enter buyer phone number to search..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Start typing the phone number. When a buyer is found, click on it to select.
            </p>
          </div>

          <div>
            <Label htmlFor="buyerName">Buyer Name *</Label>
            <Input
              id="buyerName"
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              required
              disabled={isLoading || !!buyerId}
              placeholder="Buyer name (auto-filled when selected)"
              className={buyerId ? "bg-gray-50" : ""}
            />
            {buyerId && (
              <p className="text-xs text-green-600 mt-1">✓ Buyer selected from search</p>
            )}
          </div>

          <div>
            <Label htmlFor="amount">Amount (₹) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount || ""}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="paymentDate">Payment Date *</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="method">Payment Method *</Label>
            <Select value={method} onValueChange={setMethod} required>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="wholesaleSaleId">
              Link to Invoice {buyerSales.length > 0 && "*"}
            </Label>
            <p className="text-sm text-muted-foreground mb-2">
              Select the invoice this payment is for. This helps track which payments are for which orders.
            </p>
            <Select value={wholesaleSaleId || "none"} onValueChange={(value) => setWholesaleSaleId(value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select invoice" />
              </SelectTrigger>
              <SelectContent>
                {buyerSales.length > 0 ? (
                  <>
                    {buyerSales.map((sale) => (
                      <SelectItem key={sale.id} value={sale.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{sale.invoice_number}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            (Outstanding: ₹{sale.outstanding.toFixed(2)})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <SelectItem value="none">No invoices - Payment without invoice link</SelectItem>
                )}
              </SelectContent>
            </Select>
            {buyerSales.length === 0 && buyerName && buyerPhone && (
              <p className="text-sm text-amber-600 mt-1">
                No invoices found for this buyer. Payment will be recorded without invoice link.
              </p>
            )}
          </div>

          {selectedSale && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold mb-2">Invoice Details</h4>
              <p className="text-sm">
                <strong>Invoice:</strong> {selectedSale.invoice_number}<br />
                <strong>Date:</strong> {new Date(selectedSale.sale_date).toLocaleDateString()}<br />
                <strong>Total:</strong> ₹{selectedSale.total_amount.toFixed(2)}
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="referenceNo">Reference Number (Optional)</Label>
            <Input
              id="referenceNo"
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="Cheque number, transaction ID, etc."
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Recording..." : "Record Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

