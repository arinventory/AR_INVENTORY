import { createClient } from "@/lib/supabase/server"
import { SalesPageClient } from "@/components/sales-page-client"

export default async function SalesPage() {
  const supabase = await createClient()
  
  // Fetch products and sales
  const [{ data: products }, { data: sales }] = await Promise.all([
    supabase
      .from("retail_products")
      .select("id, name, size, product_type, cost_price, expenses, retail_price, quantity_in_stock")
      .order("product_type, name"),
    supabase
      .from("sales")
      .select(`
        id,
        sale_date,
        total_amount,
        sales_items(
          quantity,
          unit_price,
          retail_products(cost_price, expenses)
        )
      `)
      .order("sale_date", { ascending: false })
  ])

  // Calculate daily sales summaries
  const dailySalesMap = new Map<string, {
    total_revenue: number
    total_cost: number
    items_count: number
  }>()

  sales?.forEach((sale) => {
    const date = sale.sale_date
    const existing = dailySalesMap.get(date) || {
      total_revenue: 0,
      total_cost: 0,
      items_count: 0,
    }

    existing.total_revenue += sale.total_amount || 0
    
    // Calculate cost from items
    if (sale.sales_items) {
      sale.sales_items.forEach((item: any) => {
        const costPrice = item.retail_products?.cost_price || 0
        const expenses = item.retail_products?.expenses || 0
        const totalCost = costPrice + expenses
        existing.total_cost += totalCost * (item.quantity || 0)
        existing.items_count += item.quantity || 0
      })
    }
    
    dailySalesMap.set(date, existing)
  })

  // Get sale IDs for each date (get the first sale ID for each date)
  const saleIdsByDate = new Map<string, string>()
  sales?.forEach((sale) => {
    if (sale.id && !saleIdsByDate.has(sale.sale_date)) {
      saleIdsByDate.set(sale.sale_date, sale.id)
    }
  })

  // Convert to array format
  const dailySales = Array.from(dailySalesMap.entries()).map(([date, data]) => ({
    date,
    sale_id: saleIdsByDate.get(date),
    total_revenue: data.total_revenue,
    total_cost: data.total_cost,
    total_profit: data.total_revenue - data.total_cost,
    items_count: data.items_count,
  })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Daily Sales</h1>
        <p className="text-muted-foreground mt-2">Enter and manage daily sales by date</p>
      </div>

      <SalesPageClient 
        products={products || []} 
        dailySales={dailySales}
      />
    </div>
  )
}
