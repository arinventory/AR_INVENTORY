import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function B2CDashboardPage() {
  const supabase = await createClient()

  // Fetch B2C module statistics
  const [customersRes, retailProductsRes, salesRes, inventoryTransactionsRes] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact" }),
    supabase.from("retail_products").select("id", { count: "exact" }),
    supabase.from("sales").select("total_amount", { count: "exact" }),
    supabase.from("inventory_transactions").select("id", { count: "exact" }),
  ])

  const totalRevenue = salesRes.data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0

  const stats = [
    { label: "Total Customers", value: customersRes.count || 0, icon: "👥" },
    { label: "Retail Products", value: retailProductsRes.count || 0, icon: "🛍️" },
    { label: "Total Sales", value: salesRes.count || 0, icon: "💰" },
    { label: "Total Revenue", value: `₹${Number(totalRevenue.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: "📈" },
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
          <span className="text-4xl">🛍️</span>
          B2C Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">Manage your business-to-consumer operations</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
    </div>
  )
}
