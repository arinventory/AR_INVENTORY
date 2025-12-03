import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BuyerSalesList } from "@/components/buyer-sales-list"
import { notFound } from "next/navigation"
import { PrintButton } from "@/components/print-button"

export default async function BuyerCreditPage({
  params,
}: {
  params: Promise<{ buyerId: string }>
}) {
  const { buyerId } = await params
  console.log("Buyer credit page accessed with buyerId:", buyerId);
  
  const supabase = await createClient()

  if (!buyerId || buyerId.trim() === "") {
    console.log("Invalid buyerId:", buyerId);
    notFound()
  }

  // Fetch buyer details
  const { data: buyer, error: buyerError } = await supabase
    .from("wholesale_buyers")
    .select("id, name, phone")
    .eq("id", buyerId.trim())
    .single()

  if (buyerError || !buyer) {
    notFound()
  }

  // Fetch credit ledger to calculate current balance
  const { data: creditLedger } = await supabase
    .from("buyer_credit_ledger")
    .select("balance_after, created_at")
    .eq("customer_id", buyerId.trim())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const currentBalance = Number(creditLedger?.balance_after || 0)

  // Fetch wholesale sales (invoices) for this buyer
  const { data: wholesaleSales } = await supabase
    .from("wholesale_sales")
    .select(`
      id,
      invoice_number,
      sale_date,
      total_amount,
      payment_status
    `)
    .eq("customer_id", buyerId.trim())
    .order("sale_date", { ascending: false })

  // Fetch all payments from this buyer
  const { data: payments } = await supabase
    .from("buyer_payments")
    .select(`
      id,
      amount,
      payment_date,
      wholesale_sale_id,
      method,
      reference_no
    `)
    .eq("customer_id", buyerId.trim())
    .order("payment_date", { ascending: false })

  // Fetch all credit ledger entries for this buyer
  const { data: creditLedgerEntries } = await supabase
    .from("buyer_credit_ledger")
    .select(`
      id,
      transaction_type,
      amount,
      balance_after,
      created_at,
      description,
      reference_id,
      reference_type
    `)
    .eq("customer_id", buyerId.trim())
    .order("created_at", { ascending: false })

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-4">
        <Link href="/dashboard/buyer-credit-ledger">
          <Button variant="outline" size="sm">
            ← Back to Buyer Credit Ledger
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{buyer.name}</h1>
            <div className="text-muted-foreground mt-1 space-y-1">
              {buyer.phone && <div className="text-sm">{buyer.phone}</div>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <PrintButton printUrl={`/dashboard/buyer-credit-ledger/${buyerId}/print`} />
            <Card className="min-w-[250px]">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Outstanding Balance</div>
                <div className="text-3xl font-bold text-green-600">₹{Number(currentBalance.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <BuyerSalesList
        sales={wholesaleSales || []}
        payments={payments || []}
        creditLedger={creditLedgerEntries || []}
        buyerId={buyerId}
      />
    </div>
  )
}

