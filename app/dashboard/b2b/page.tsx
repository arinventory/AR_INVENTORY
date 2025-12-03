import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function B2BDashboardPage() {
  const supabase = await createClient()

  // Fetch B2B module statistics
  const [suppliersRes, wholesaleProductsRes, purchaseOrdersRes, creditLedgerRes, buyersRes, buyerCreditLedgerRes] = await Promise.all([
    supabase.from("suppliers").select("id", { count: "exact" }),
    supabase.from("wholesale_products").select("id", { count: "exact" }),
    supabase.from("purchase_orders").select("id", { count: "exact" }),
    supabase.from("credit_ledger").select("supplier_id, balance_after, created_at"),
    supabase.from("wholesale_buyers").select("id", { count: "exact" }),
    supabase.from("buyer_credit_ledger").select("customer_id, balance_after, created_at"),
  ])

  // Calculate total balance owed: Get the most recent balance_after for each supplier
  const supplierBalances = new Map<string, number>()
  if (creditLedgerRes.data) {
    // Process entries in chronological order to get latest balance for each supplier
    const sortedEntries = [...creditLedgerRes.data].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    
    sortedEntries.forEach((entry) => {
      supplierBalances.set(entry.supplier_id, Number(entry.balance_after || 0))
    })
  }
  
  // Sum all current balances (amount owed by all suppliers)
  const totalCreditBalance = Array.from(supplierBalances.values()).reduce((sum, balance) => sum + balance, 0)

  // Calculate total accounts receivable: Get the most recent balance_after for each buyer
  const buyerBalances = new Map<string, number>()
  if (buyerCreditLedgerRes.data) {
    // Process entries in chronological order to get latest balance for each buyer
    const sortedEntries = [...buyerCreditLedgerRes.data].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    
    sortedEntries.forEach((entry) => {
      buyerBalances.set(entry.customer_id, Number(entry.balance_after || 0))
    })
  }
  
  // Sum all current balances (amount owed by all buyers - Accounts Receivable)
  const totalAccountsReceivable = Array.from(buyerBalances.values()).reduce((sum, balance) => sum + balance, 0)

  const stats = [
    { label: "Total Suppliers", value: suppliersRes.count || 0, icon: "🏭" },
    { label: "Wholesale Products", value: wholesaleProductsRes.count || 0, icon: "📦" },
    { label: "Purchase Orders", value: purchaseOrdersRes.count || 0, icon: "📋" },
    { label: "Credit Balance (Owed)", value: `₹${Number(totalCreditBalance.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: "💰" },
    { label: "Total Buyers", value: buyersRes.count || 0, icon: "👥" },
    { label: "Accounts Receivable", value: `₹${Number(totalAccountsReceivable.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: "💵" },
  ]

  const b2bSections: { title: string; description: string; href: string; icon: string; color: string }[] = [
    // Removed Wholesale Products and B2B Sales cards as requested
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              ← Back to Home
            </Button>
          </Link>
        </div>
        <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
          <span className="text-4xl">🏭</span>
          B2B Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">Manage your business-to-business operations</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <span className="text-2xl">{stat.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* B2B Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {b2bSections.map((section) => (
          <Card key={section.title} className={`transition-colors ${section.color}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-3xl">{section.icon}</span>
                <div>
                  <div>{section.title}</div>
                  <p className="text-sm font-normal text-muted-foreground mt-1">
                    {section.description}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={section.href}>
                <Button className="w-full">
                  Manage {section.title}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}