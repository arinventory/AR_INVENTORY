import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { B2CSalesExportClient } from "@/components/b2c-sales-export-client"
import { ReportDateFilter } from "@/components/report-date-filter"

export default async function B2CSalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; month?: string; year?: string; quarter?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  // Build date filter query
  let dateQuery = supabase
    .from("sales")
    .select(`
      *,
      sales_items(
        quantity,
        unit_price,
        line_total,
        retail_products(
          name,
          size,
          cost_price
        )
      ),
      customers(name, phone)
    `)

  // Apply date filters
  const filterType = params.filter || "all"
  if (filterType === "month" && params.month && params.year) {
    const month = parseInt(params.month)
    const year = parseInt(params.year)
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`
    const endDate = new Date(year, month, 0).toISOString().split("T")[0]
    dateQuery = dateQuery.gte("sale_date", startDate).lte("sale_date", endDate)
  } else if (filterType === "year" && params.year) {
    const year = parseInt(params.year)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    dateQuery = dateQuery.gte("sale_date", startDate).lte("sale_date", endDate)
  } else if (filterType === "quarter" && params.quarter && params.year) {
    const year = parseInt(params.year)
    const quarter = params.quarter
    let startMonth = 1
    let endMonth = 3
    if (quarter === "Q2") {
      startMonth = 4
      endMonth = 6
    } else if (quarter === "Q3") {
      startMonth = 7
      endMonth = 9
    } else if (quarter === "Q4") {
      startMonth = 10
      endMonth = 12
    }
    const startDate = `${year}-${String(startMonth).padStart(2, "0")}-01`
    const endDate = new Date(year, endMonth, 0).toISOString().split("T")[0]
    dateQuery = dateQuery.gte("sale_date", startDate).lte("sale_date", endDate)
  }

  const { data: sales } = await dateQuery.order("sale_date", { ascending: false })

  // Calculate detailed metrics
  let totalRevenue = 0
  let totalCost = 0
  let totalProfit = 0
  let totalTax = 0
  let totalDiscount = 0
  let totalOutstanding = 0

  const reportData = sales?.map((sale) => {
    const items = sale.sales_items || []
    let saleRevenue = Number(sale.total_amount || 0)
    let saleCost = 0
    let saleProfit = 0

    // Calculate cost and profit for each item
    items.forEach((item: any) => {
      const product = item.retail_products
      if (product) {
        const costPrice = Number(product.cost_price || 0)
        const quantity = Number(item.quantity || 0)
        saleCost += costPrice * quantity
      }
    })

    saleProfit = saleRevenue - saleCost
    const saleTax = Number(sale.tax_amount || 0)
    const saleDiscount = Number(sale.discount_amount || 0)
    
    // For B2C sales, payment_status should be accurate (usually cash sales)
    // If partial, we don't track separate payments, so show full amount as due
    const balanceDue = sale.payment_status === "paid" ? 0 : saleRevenue

    totalRevenue += saleRevenue
    totalCost += saleCost
    totalProfit += saleProfit
    totalTax += saleTax
    totalDiscount += saleDiscount
    totalOutstanding += balanceDue

    return {
      "Invoice Number": sale.invoice_number,
      "Date": new Date(sale.sale_date).toLocaleDateString("en-IN"),
      "Customer": sale.customers?.name || "-",
      "Phone": sale.customers?.phone || "-",
      "Items Count": items.length,
      "Subtotal": `₹${Number(sale.subtotal || 0).toFixed(2)}`,
      "Tax": `₹${saleTax.toFixed(2)}`,
      "Discount": `₹${saleDiscount.toFixed(2)}`,
      "Total Revenue": `₹${saleRevenue.toFixed(2)}`,
      "Total Cost": `₹${saleCost.toFixed(2)}`,
      "Gross Profit": `₹${saleProfit.toFixed(2)}`,
      "Profit Margin %": saleRevenue > 0 ? `${((saleProfit / saleRevenue) * 100).toFixed(2)}%` : "0%",
      "Payment Status": sale.payment_status,
      "Balance Due": `₹${balanceDue.toFixed(2)}`,
    }
  }) || []

  // Add summary row
  const summaryData = [
    ...reportData,
    {
      "Invoice Number": "TOTAL",
      "Date": "",
      "Customer": "",
      "Phone": "",
      "Items Count": "",
      "Subtotal": "",
      "Tax": `₹${totalTax.toFixed(2)}`,
      "Discount": `₹${totalDiscount.toFixed(2)}`,
      "Total Revenue": `₹${totalRevenue.toFixed(2)}`,
      "Total Cost": `₹${totalCost.toFixed(2)}`,
      "Gross Profit": `₹${totalProfit.toFixed(2)}`,
      "Profit Margin %": totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(2)}%` : "0%",
      "Payment Status": "",
      "Balance Due": `₹${totalOutstanding.toFixed(2)}`,
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">B2C Sales Report</h1>
        <p className="text-muted-foreground mt-2">Comprehensive B2C sales analysis with profit/loss calculations</p>
      </div>

      {/* Date Filter */}
      <ReportDateFilter />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{sales?.length || 0} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Cost of goods sold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <span className="text-2xl">📈</span>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
              ₹{totalProfit.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(2)}%` : "0%"} margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{totalOutstanding.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Amount pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="mb-6">
        <B2CSalesExportClient data={summaryData} />
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Sales Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Margin %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.map((sale) => {
                  const items = sale.sales_items || []
                  let saleRevenue = Number(sale.total_amount || 0)
                  let saleCost = 0

                  items.forEach((item: any) => {
                    const product = item.retail_products
                    if (product) {
                      const costPrice = Number(product.cost_price || 0)
                      const quantity = Number(item.quantity || 0)
                      saleCost += costPrice * quantity
                    }
                  })

                  const saleProfit = saleRevenue - saleCost
                  const profitMargin = saleRevenue > 0 ? (saleProfit / saleRevenue) * 100 : 0
                  
                  // For B2C sales, payment_status should be accurate (usually cash sales)
                  const balanceDue = sale.payment_status === "paid" ? 0 : saleRevenue

                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                      <TableCell>{new Date(sale.sale_date).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell>{sale.customers?.name || "-"}</TableCell>
                      <TableCell>₹{saleRevenue.toFixed(2)}</TableCell>
                      <TableCell>₹{saleCost.toFixed(2)}</TableCell>
                      <TableCell className={saleProfit >= 0 ? "text-green-600" : "text-red-600"}>
                        ₹{saleProfit.toFixed(2)}
                      </TableCell>
                      <TableCell>{profitMargin.toFixed(2)}%</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            sale.payment_status === "paid"
                              ? "bg-green-100 text-green-800"
                              : sale.payment_status === "partial"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {sale.payment_status}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold">₹{balanceDue.toFixed(2)}</TableCell>
                    </TableRow>
                  )
                })}
                {sales && sales.length > 0 && (
                  <TableRow className="bg-gray-100 font-bold">
                    <TableCell colSpan={3}>TOTAL</TableCell>
                    <TableCell>₹{totalRevenue.toFixed(2)}</TableCell>
                    <TableCell>₹{totalCost.toFixed(2)}</TableCell>
                    <TableCell className={totalProfit >= 0 ? "text-green-600" : "text-red-600"}>
                      ₹{totalProfit.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(2)}%` : "0%"}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="font-semibold text-orange-600">₹{totalOutstanding.toFixed(2)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


