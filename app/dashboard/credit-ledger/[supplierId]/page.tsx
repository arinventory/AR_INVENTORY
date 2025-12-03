import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SupplierOrdersList } from "@/components/supplier-orders-list"
import { notFound } from "next/navigation"
import { PrintButton } from "@/components/print-button"

export default async function SupplierCreditPage({
  params,
}: {
  params: Promise<{ supplierId: string }>
}) {
  const { supplierId } = await params
  const supabase = await createClient()

  if (!supplierId || supplierId.trim() === "") {
    notFound()
  }

  // Fetch supplier details
  const { data: supplier, error: supplierError } = await supabase
    .from("suppliers")
    .select("id, name, email, phone, address")
    .eq("id", supplierId.trim())
    .single()

  if (supplierError || !supplier) {
    notFound()
  }

  // Fetch all credit ledger entries for this supplier ordered by creation date to calculate current balance
  const { data: creditLedgerEntries } = await supabase
    .from("credit_ledger")
    .select("id, transaction_type, amount, balance_after, created_at, description, reference_id, reference_type")
    .eq("supplier_id", supplierId.trim())
    .order("created_at", { ascending: true })

  // Calculate the current balance by processing all entries in chronological order
  let currentBalance = 0
  if (creditLedgerEntries && creditLedgerEntries.length > 0) {
    console.log(`Calculating balance for supplier ${supplierId} with ${creditLedgerEntries.length} entries`);
    
    // Process all entries to get the final balance
    creditLedgerEntries.forEach(entry => {
      if (entry.transaction_type === "credit") {
        currentBalance += Number(entry.amount || 0)
        console.log(`Adding credit ${entry.amount || 0}, new balance: ${currentBalance}`)
      } else if (entry.transaction_type === "debit") {
        currentBalance -= Number(entry.amount || 0)
        console.log(`Subtracting debit ${entry.amount || 0}, new balance: ${currentBalance}`)
      }
    })
  }
  
  console.log(`Final balance for supplier ${supplierId}: ${currentBalance}`);

  // Fetch purchase orders for this supplier
  const { data: purchaseOrders } = await supabase
    .from("purchase_orders")
    .select(`
      id,
      order_number,
      order_date,
      total_amount,
      status
    `)
    .eq("supplier_id", supplierId.trim())
    .order("order_date", { ascending: false })

  // Fetch all payments for this supplier
  const { data: payments } = await supabase
    .from("payments")
    .select(`
      id,
      amount,
      payment_date,
      purchase_order_id,
      method,
      reference_no
    `)
    .eq("supplier_id", supplierId.trim())
    .order("payment_date", { ascending: false })

  return (
    <div className="p-6">
      {/* Back Button */}
      <div className="mb-4">
        <Link href="/dashboard/credit-ledger">
          <Button variant="outline" size="sm">
            ← Back to Credit Ledger
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{supplier.name}</h1>
            <div className="text-muted-foreground mt-1 space-y-1">
              {supplier.email && <div className="text-sm">{supplier.email}</div>}
              {supplier.phone && <div className="text-sm">{supplier.phone}</div>}
              {supplier.address && <div className="text-sm">{supplier.address}</div>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <PrintButton printUrl={`/dashboard/credit-ledger/${supplierId}/print`} />
            <Card className="min-w-[250px]">
              <CardContent className="pt-6">
                <div className="text-sm text-muted-foreground mb-1">Outstanding Balance</div>
                <div className="text-3xl font-bold text-red-600">₹{Number(currentBalance.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <SupplierOrdersList
        orders={purchaseOrders || []}
        payments={payments || []}
        creditLedger={creditLedgerEntries || []}
      />
    </div>
  )
}