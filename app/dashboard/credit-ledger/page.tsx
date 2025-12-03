import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CreditLedgerClient } from "@/components/credit-ledger-client"

export default async function CreditLedgerPage() {
  const supabase = await createClient()

  // Fetch all suppliers with their current balance
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name, email")
    .order("name")

  // Fetch credit ledger data to calculate balances
  const { data: creditLedger, error } = await supabase
    .from("credit_ledger")
    .select(`
      id,
      supplier_id,
      transaction_type,
      amount,
      balance_after,
      created_at,
      description,
      reference_id,
      reference_type
    `)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching credit ledger:", error)
  }

  // Verify no orphaned entries exist
  if (creditLedger) {
    console.log("Checking for orphaned ledger entries...");
    for (const entry of creditLedger) {
      if (entry.reference_type === "payment") {
        // Use maybeSingle() instead of single() to avoid PGRST116 error
        const { data: payment, error: paymentError } = await supabase
          .from("payments")
          .select("id")
          .eq("id", entry.reference_id)
          .maybeSingle();
        
        if (paymentError) {
          console.error("Error checking payment existence:", paymentError);
        } else if (!payment) {
          console.warn("Orphaned payment ledger entry found:", entry);
        }
      } else if (entry.reference_type === "purchase_order") {
        // Use maybeSingle() instead of single() to avoid PGRST116 error
        const { data: po, error: poError } = await supabase
          .from("purchase_orders")
          .select("id")
          .eq("id", entry.reference_id)
          .maybeSingle();
        
        if (poError) {
          console.error("Error checking purchase order existence:", poError);
        } else if (!po) {
          console.warn("Orphaned purchase order ledger entry found:", entry);
        }
      }
    }
  }

  // Calculate current balance for each supplier by processing all entries chronologically
  const supplierBalances = new Map<string, { balance: number; name: string; email?: string }>()
  
  if (suppliers) {
    suppliers.forEach((supplier) => {
      supplierBalances.set(supplier.id, { balance: 0, name: supplier.name, email: supplier.email })
    })
  }

  // Process entries in chronological order to calculate running balance for each supplier
  if (creditLedger) {
    console.log("Processing", creditLedger.length, "credit ledger entries");
    
    creditLedger.forEach((entry) => {
      const current = supplierBalances.get(entry.supplier_id)
      if (current) {
        let newBalance = current.balance
        if (entry.transaction_type === "credit") {
          newBalance += Number(entry.amount || 0)
          console.log(`Supplier ${entry.supplier_id}: Adding credit ${entry.amount || 0}, new balance: ${newBalance}`)
        } else if (entry.transaction_type === "debit") {
          newBalance -= Number(entry.amount || 0)
          console.log(`Supplier ${entry.supplier_id}: Subtracting debit ${entry.amount || 0}, new balance: ${newBalance}`)
        }
        
        supplierBalances.set(entry.supplier_id, {
          ...current,
          balance: newBalance
        })
      }
    })
  }
  
  // Sum all current balances (amount owed by all suppliers)
  const totalBalance = Array.from(supplierBalances.values()).reduce((sum, item) => {
    console.log(`Adding supplier ${item.name} balance: ${item.balance} to total`)
    return sum + item.balance
  }, 0)
  
  console.log("Final total balance:", totalBalance)
  
  // Fetch purchase orders and payments for detailed view
  const { data: purchaseOrders } = await supabase
    .from("purchase_orders")
    .select(`
      id,
      order_number,
      order_date,
      total_amount,
      supplier_id
    `)
    .order("order_date", { ascending: false })

  const { data: payments } = await supabase
    .from("payments")
    .select(`
      id,
      amount,
      payment_date,
      purchase_order_id,
      supplier_id,
      method,
      reference_no
    `)
    .order("payment_date", { ascending: false })

  // Calculate suppliers with balance
  const suppliersWithBalance = Array.from(supplierBalances.values()).filter(s => s.balance > 0)

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
            <h1 className="text-3xl font-bold text-foreground">Credit Ledger</h1>
            <p className="text-muted-foreground mt-1 text-sm">Track supplier credit transactions and balances</p>
          </div>
          {/* Credit Summary - Top Right */}
          <Card className="min-w-[250px]">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Total Amount Owed</div>
              <div className="text-3xl font-bold text-red-600">₹{totalBalance.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground mt-2">
                {suppliersWithBalance.length} {suppliersWithBalance.length === 1 ? 'supplier' : 'suppliers'} with balance
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Supplier-wise Credit Ledger */}
      <CreditLedgerClient 
        suppliers={Array.from(supplierBalances.entries()).map(([id, data]) => ({ id, ...data }))}
        creditLedger={creditLedger || []}
        purchaseOrders={purchaseOrders || []}
        payments={payments || []}
        totalBalance={totalBalance}
      />
    </div>
  )
}