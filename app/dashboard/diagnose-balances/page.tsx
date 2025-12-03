import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DiagnoseBalancesPage() {
  const supabase = await createClient()

  // Fetch all suppliers
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("id, name")
    .order("name")

  // Fetch all credit ledger entries
  const { data: creditLedger } = await supabase
    .from("credit_ledger")
    .select("*")
    .order("created_at", { ascending: true })

  // Calculate balances for each supplier (same as main credit ledger page)
  const supplierBalancesMain = new Map<string, { name: string, balance: number }>()
  
  if (suppliers) {
    suppliers.forEach((supplier) => {
      supplierBalancesMain.set(supplier.id, { balance: 0, name: supplier.name })
    })
  }

  if (creditLedger) {
    // Process entries in chronological order (same as main credit ledger page)
    const sortedEntries = [...creditLedger].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    
    sortedEntries.forEach((entry) => {
      const current = supplierBalancesMain.get(entry.supplier_id)
      if (current) {
        let newBalance = current.balance
        if (entry.transaction_type === "credit") {
          newBalance += Number(entry.amount || 0)
        } else if (entry.transaction_type === "debit") {
          newBalance -= Number(entry.amount || 0)
        }
        
        supplierBalancesMain.set(entry.supplier_id, {
          ...current,
          balance: newBalance
        })
      }
    })
  }
  
  // Calculate total balance (same as main credit ledger page)
  const totalBalanceMain = Array.from(supplierBalancesMain.values()).reduce((sum, item) => sum + item.balance, 0)

  // Calculate individual supplier balances (same as supplier credit ledger page)
  const supplierDetails = []
  if (suppliers) {
    for (const supplier of suppliers) {
      // Fetch credit ledger entries for this supplier (same as supplier page)
      const { data: supplierEntries } = await supabase
        .from("credit_ledger")
        .select("*")
        .eq("supplier_id", supplier.id)
        .order("created_at", { ascending: true })

      // Calculate balance for this supplier (same as supplier page)
      let supplierBalance = 0
      if (supplierEntries && supplierEntries.length > 0) {
        supplierEntries.forEach(entry => {
          if (entry.transaction_type === "credit") {
            supplierBalance += Number(entry.amount || 0)
          } else if (entry.transaction_type === "debit") {
            supplierBalance -= Number(entry.amount || 0)
          }
        })
      }

      supplierDetails.push({
        id: supplier.id,
        name: supplier.name,
        mainBalance: supplierBalancesMain.get(supplier.id)?.balance || 0,
        individualBalance: supplierBalance,
        difference: Math.abs((supplierBalancesMain.get(supplier.id)?.balance || 0) - supplierBalance),
        entriesCount: supplierEntries?.length || 0
      })
    }
  }

  // Identify discrepancies
  const discrepancies = supplierDetails.filter(s => s.difference > 0.01)
  const totalDiscrepancy = discrepancies.reduce((sum, s) => sum + s.difference, 0)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Balance Diagnosis</h1>
        <p className="text-muted-foreground mt-1">Comparing main ledger vs individual supplier calculations</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Summary Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-sm text-muted-foreground">Main Ledger Total</div>
              <div className="text-2xl font-bold">₹{totalBalanceMain.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <div className="text-sm text-muted-foreground">Sum of Individual</div>
              <div className="text-2xl font-bold">₹{supplierDetails.reduce((sum, s) => sum + s.individualBalance, 0).toFixed(2)}</div>
            </div>
            <div className="p-4 bg-yellow-50 rounded">
              <div className="text-sm text-muted-foreground">Total Discrepancy</div>
              <div className="text-2xl font-bold text-orange-600">₹{totalDiscrepancy.toFixed(2)}</div>
            </div>
            <div className="p-4 bg-red-50 rounded">
              <div className="text-sm text-muted-foreground">Suppliers with Issues</div>
              <div className="text-2xl font-bold text-red-600">{discrepancies.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {discrepancies.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Discrepancies Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Main Ledger</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Individual</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entries</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {discrepancies.map((supplier) => (
                    <tr key={supplier.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{supplier.mainBalance.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{supplier.individualBalance.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">₹{supplier.difference.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.entriesCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Main Ledger</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Individual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Difference</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supplierDetails.map((supplier) => (
                  <tr key={supplier.id} className={supplier.difference > 0.01 ? "bg-red-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{supplier.mainBalance.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{supplier.individualBalance.toFixed(2)}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${supplier.difference > 0.01 ? "text-red-600 font-bold" : "text-gray-500"}`}>
                      ₹{supplier.difference.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 text-center">
        <Link href="/dashboard/credit-ledger">
          <Button variant="outline" className="mr-4">← Back to Credit Ledger</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">← Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}