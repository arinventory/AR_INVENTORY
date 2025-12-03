import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function RecalculateBalancesPage() {
  const supabase = await createClient()
  
  // Get all suppliers
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id")
  
  let results = []
  
  if (suppliers) {
    for (const supplier of suppliers) {
      // Get all credit ledger entries for this supplier ordered by creation date
      const { data: entries, error } = await supabase
        .from("credit_ledger")
        .select("id, transaction_type, amount")
        .eq("supplier_id", supplier.id)
        .order("created_at", { ascending: true })
      
      if (error) {
        results.push({
          supplierId: supplier.id,
          status: "error",
          message: error.message
        })
        continue
      }
      
      // Recalculate balances
      let runningBalance = 0
      let updatedCount = 0
      
      for (const entry of entries || []) {
        if (entry.transaction_type === "credit") {
          runningBalance += Number(entry.amount || 0)
        } else if (entry.transaction_type === "debit") {
          runningBalance -= Number(entry.amount || 0)
        }
        
        // Update the balance_after field
        const { error: updateError } = await supabase
          .from("credit_ledger")
          .update({ balance_after: runningBalance })
          .eq("id", entry.id)
        
        if (!updateError) {
          updatedCount++
        }
      }
      
      results.push({
        supplierId: supplier.id,
        status: "success",
        message: `Updated ${updatedCount} entries`,
        finalBalance: runningBalance
      })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Recalculate Balances</h1>
        <p className="text-muted-foreground mt-2">Maintenance tool to fix credit ledger balances</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Balance Recalculation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="p-4 border rounded">
                <div className="font-medium">Supplier ID: {result.supplierId}</div>
                <div className={`mt-1 ${result.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {result.status}
                </div>
                <div className="text-sm mt-1">Message: {result.message}</div>
                {result.finalBalance !== undefined && (
                  <div className="text-sm mt-1">Final Balance: ₹{result.finalBalance.toFixed(2)}</div>
                )}
              </div>
            ))}
          </div>
          
          {results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No suppliers found or no recalculation performed.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <Link href="/dashboard">
          <Button variant="outline">← Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}