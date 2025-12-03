import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BuyerCreditLedgerClient } from "@/components/buyer-credit-ledger-client"

export default async function BuyerCreditLedgerPage() {
  const supabase = await createClient()

  // Fetch all wholesale buyers
  const { data: buyers } = await supabase
    .from("wholesale_buyers")
    .select("id, name, phone")
    .order("name")

  // Fetch credit ledger data to calculate balances
  const { data: creditLedger, error } = await supabase
    .from("buyer_credit_ledger")
    .select(`
      *,
      wholesale_buyers (
        name,
        phone
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching buyer credit ledger:", error)
  }

  // Calculate current balance for each buyer
  const buyerBalances = new Map<string, { balance: number; name: string; phone?: string }>()
  
  if (buyers) {
    buyers.forEach((buyer) => {
      buyerBalances.set(buyer.id, { balance: 0, name: buyer.name, phone: buyer.phone || undefined })
    })
  }

  if (creditLedger) {
    // Process entries in chronological order to get latest balance for each buyer
    const sortedEntries = [...creditLedger].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    
    sortedEntries.forEach((entry) => {
      const current = buyerBalances.get(entry.customer_id)
      if (current) {
        buyerBalances.set(entry.customer_id, {
          ...current,
          balance: Number(entry.balance_after || 0)
        })
      }
    })
  }
  
  // Sum all current balances (amount owed by all buyers - Accounts Receivable)
  const totalBalance = Array.from(buyerBalances.values()).reduce((sum, item) => sum + item.balance, 0)
  
  // Fetch wholesale sales and payments for detailed view
  const { data: wholesaleSales } = await supabase
    .from("wholesale_sales")
    .select(`
      id,
      invoice_number,
      sale_date,
      total_amount,
      customer_id,
      wholesale_buyers(name)
    `)
    .not("customer_id", "is", null)
    .order("sale_date", { ascending: false })

  const { data: buyerPayments } = await supabase
    .from("buyer_payments")
    .select(`
      id,
      amount,
      payment_date,
      wholesale_sale_id,
      customer_id,
      method,
      reference_no,
      wholesale_sales(invoice_number)
    `)
    .order("payment_date", { ascending: false })

  // Calculate buyers with balance
  const buyersWithBalance = Array.from(buyerBalances.values()).filter(b => b.balance > 0)

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-4">
        <Link href="/dashboard/b2b">
          <Button variant="outline" size="sm">
            ← Back to B2B
          </Button>
        </Link>
      </div>

      {/* Header with Title and Credit Summary */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Buyer Credit Ledger</h1>
            <p className="text-muted-foreground mt-1 text-sm">Track buyer credit transactions and balances (Accounts Receivable)</p>
          </div>
          {/* Credit Summary - Top Right */}
          <Card className="min-w-[250px]">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Total Amount Receivable</div>
              <div className="text-3xl font-bold text-green-600">₹{totalBalance.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-2">
                {buyersWithBalance.length} {buyersWithBalance.length === 1 ? 'buyer' : 'buyers'} with balance
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Buyer-wise Credit Ledger */}
      <BuyerCreditLedgerClient 
        buyers={Array.from(buyerBalances.entries()).map(([id, data]) => ({ id, ...data }))}
        creditLedger={creditLedger || []}
        wholesaleSales={wholesaleSales || []}
        buyerPayments={buyerPayments || []}
        totalBalance={totalBalance}
      />
    </div>
  )
}

