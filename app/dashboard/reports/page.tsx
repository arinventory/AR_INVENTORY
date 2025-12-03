import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { SalesReport } from "@/components/sales-report"
import { PurchaseReport } from "@/components/purchase-report"

export default async function ReportsPage() {
  const supabase = await createClient()

  const [salesRes, purchaseRes] = await Promise.all([
    supabase.from("sales").select("total_amount, sale_date").order("sale_date", { ascending: false }).limit(30),
    supabase
      .from("purchase_orders")
      .select("total_amount, order_date")
      .order("order_date", { ascending: false })
      .limit(30),
  ])

  const totalSales = salesRes.data?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0
  const totalPurchases = purchaseRes.data?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-2">View business analytics and reports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales (30 days)</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{salesRes.data?.length || 0} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases (30 days)</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPurchases.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{purchaseRes.data?.length || 0} orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesReport sales={salesRes.data || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <PurchaseReport purchases={purchaseRes.data || []} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Comprehensive Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Link href="/dashboard/reports/b2b-sales">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  B2B Sales Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Detailed B2B sales with profit/loss analysis, margins, and outstanding balances
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/reports/b2c-sales">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🛒</span>
                  B2C Sales Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Detailed B2C sales with profit/loss analysis, margins, and outstanding balances
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/reports/b2b-suppliers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🏭</span>
                  B2B Supplier Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Supplier payables, purchase history, payment status, and outstanding balances
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/reports/b2b-buyers">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">👥</span>
                  B2B Buyer Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Buyer receivables, sales history, payment status, and outstanding balances
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/reports/sales-detail">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  Detailed Sales Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  General sales report with transaction details
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/reports/purchase-detail">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  Detailed Purchase Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  General purchase report with order details
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
