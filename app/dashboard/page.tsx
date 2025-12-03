import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RecalculateBalancesButton } from "@/components/recalculate-balances-button"

// Define types for our data
interface StatCard {
  label: string
  value: string | number
  icon: string
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch all required data in parallel
  const [
    suppliersRes,
    wholesaleProductsRes,
    purchaseOrdersRes,
    creditLedgerRes,
    buyersRes,
    buyerCreditLedgerRes,
    customersRes,
    retailProductsRes,
    salesRes,
    inventoryTransactionsRes
  ] = await Promise.all([
    supabase.from("suppliers").select("id", { count: "exact" }),
    supabase.from("wholesale_products").select("id", { count: "exact" }),
    supabase.from("purchase_orders").select("id", { count: "exact" }),
    supabase.from("credit_ledger").select("supplier_id, balance_after, created_at"),
    supabase.from("wholesale_buyers").select("id", { count: "exact" }),
    supabase.from("buyer_credit_ledger").select("customer_id, balance_after, created_at"),
    supabase.from("customers").select("id", { count: "exact" }),
    supabase.from("retail_products").select("id", { count: "exact" }),
    supabase.from("sales").select("total_amount", { count: "exact" }),
    supabase.from("inventory_transactions").select("id", { count: "exact" }),
  ])

  // Calculate B2B metrics
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

  // Calculate B2C metrics
  const totalRevenue = salesRes.data?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0

  // Prepare stats data
  const stats: StatCard[] = [
    { label: "Total Suppliers", value: suppliersRes.count || 0, icon: "🏭" },
    { label: "Wholesale Products", value: wholesaleProductsRes.count || 0, icon: "📦" },
    { label: "Purchase Orders", value: purchaseOrdersRes.count || 0, icon: "📋" },
    { label: "Credit Balance (Owed)", value: `₹${Number(totalCreditBalance.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: "💰" },
    { label: "Total Buyers", value: buyersRes.count || 0, icon: "👥" },
    { label: "Accounts Receivable", value: `₹${Number(totalAccountsReceivable.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: "💵" },
    { label: "Total Customers", value: customersRes.count || 0, icon: "👤" },
    { label: "Retail Products", value: retailProductsRes.count || 0, icon: "🛍️" },
    { label: "Total Sales", value: salesRes.count || 0, icon: "💰" },
    { label: "Total Revenue", value: `₹${Number(totalRevenue.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: "📈" },
    { label: "Inventory Transactions", value: inventoryTransactionsRes.count || 0, icon: "🔄" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
            Welcome to <span className="text-primary">AR Fashion Inventory</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Your comprehensive solution for managing wholesale and retail inventory, tracking sales, and optimizing supply chain operations.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6">
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              View Reports
            </Button>
          </div>
        </div>

        {/* Maintenance Section */}
        <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">System Maintenance</h3>
          <p className="text-yellow-700 mb-4">
            If you notice incorrect balances in the credit ledger, use this tool to recalculate all supplier balances.
          </p>
          <RecalculateBalancesButton />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-4xl">🏭</span>
                <div>
                  <div>B2B Operations</div>
                  <CardDescription>Wholesale Management</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Manage suppliers, purchase orders, wholesale products, and supplier payments with our comprehensive B2B tools.
              </p>
              <Link href="/dashboard/b2b">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Enter B2B Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-4xl">🛍️</span>
                <div>
                  <div>B2C Operations</div>
                  <CardDescription>Retail Management</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Track retail products, customer sales, inventory levels, and customer relationships with our intuitive B2C tools.
              </p>
              <Link href="/dashboard/b2c">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Enter B2C Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <span className="text-4xl">📊</span>
                <div>
                  <div>Analytics & Reports</div>
                  <CardDescription>Data Insights</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Gain valuable insights with detailed reports on sales trends, inventory levels, and financial performance.
              </p>
              <Link href="/dashboard/reports">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Actual System Overview */}
        <div className="bg-card rounded-xl shadow-md p-8 border border-primary/10">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">System Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-primary/5 rounded-lg hover:shadow-md transition-shadow">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer with Copyright */}
      <footer className="border-t border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">
              © {new Date().getFullYear()} AR Fashion Inventory System. All rights reserved.
            </p>
            <p className="text-xs mt-2 text-muted-foreground/70">
              IP Workspace • Designed for AR Fashion Enterprises
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}