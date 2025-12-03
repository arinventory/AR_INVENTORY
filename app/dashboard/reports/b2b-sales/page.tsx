import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { B2BSalesExportClient } from "@/components/b2b-sales-export-client"
import { ReportDateFilter } from "@/components/report-date-filter"

export default async function B2BSalesReportPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; month?: string; year?: string; quarter?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  // Build date filter query
  let dateQuery = supabase
    .from("wholesale_sales")
    .select(`
      *,
      wholesale_sales_items(
        quantity,
        unit_price,
        line_total,
        wholesale_products(
          name,
          sku,
          cost_price,
          expenses,
          gst_percentage
        )
      ),
      wholesale_buyers(name, phone)
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

  // Fetch all buyer payments to calculate outstanding balances
  const saleIds = sales?.map(s => s.id) || []
  const { data: buyerPayments } = saleIds.length > 0
    ? await supabase
        .from("buyer_payments")
        .select("wholesale_sale_id, amount")
        .in("wholesale_sale_id", saleIds)
    : { data: [] }

  // Create a map of sale_id -> total payments
  const paymentsBySale = new Map<string, number>()
  buyerPayments?.forEach((payment: any) => {
    if (payment.wholesale_sale_id) {
      const current = paymentsBySale.get(payment.wholesale_sale_id) || 0
      paymentsBySale.set(payment.wholesale_sale_id, current + Number(payment.amount || 0))
    }
  })

  // Calculate detailed metrics
  let totalRevenue = 0
  let totalCost = 0
  let totalProfit = 0
  let totalTax = 0
  let totalDiscount = 0
  let totalOutstanding = 0

  const reportData = sales?.map((sale) => {
    const items = sale.wholesale_sales_items || []
    let saleRevenue = Number(sale.total_amount || 0)
    let saleCost = 0
    let saleProfit = 0

    // Calculate cost and profit for each item
    items.forEach((item: any) => {
      const product = item.wholesale_products
      if (product) {
        const costPrice = Number(product.cost_price || 0)
        const expenses = Number(product.expenses || 0)
        const totalCostPerUnit = costPrice + expenses
        const quantity = Number(item.quantity || 0)
        saleCost += totalCostPerUnit * quantity
      }
    })

    saleProfit = saleRevenue - saleCost
    const saleTax = Number(sale.tax_amount || 0)
    const saleDiscount = Number(sale.discount_amount || 0)
    
    // Calculate actual outstanding by summing payments
    const totalPaid = paymentsBySale.get(sale.id) || 0
    const balanceDue = Math.max(0, saleRevenue - totalPaid)

    totalRevenue += saleRevenue
    totalCost += saleCost
    totalProfit += saleProfit
    totalTax += saleTax
    totalDiscount += saleDiscount
    totalOutstanding += balanceDue

    return {
      "Invoice Number": sale.invoice_number,
      "Date": new Date(sale.sale_date).toLocaleDateString("en-IN"),
      "Buyer": sale.wholesale_buyers?.name || sale.customer_name || "-",
      "Phone": sale.wholesale_buyers?.phone || "-",
      "Items Count": items.length,
      "Subtotal": `₹${Number(Number(sale.subtotal || 0).toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "Tax": `₹${Number(saleTax.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "Discount": `₹${Number(saleDiscount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "Total Revenue": `₹${Number(saleRevenue.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "Total Cost": `₹${Number(saleCost.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "Gross Profit": `₹${Number(saleProfit.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
      "Buyer": "",
      "Phone": "",
      "Items Count": "",
      "Subtotal": "",
      "Tax": `₹${Number(totalTax.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "Discount": `₹${Number(totalDiscount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "Total Revenue": `₹${Number(totalRevenue.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "Total Cost": `₹${Number(totalCost.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "Gross Profit": `₹${Number(totalProfit.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      "Profit Margin %": totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(2)}%` : "0%",
      "Payment Status": "",
      "Balance Due": `₹${totalOutstanding.toFixed(2)}`,
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">B2B Sales Report</h1>
        <p className="text-muted-foreground mt-2">Comprehensive B2B sales analysis with profit/loss calculations</p>
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
            <div className="text-2xl font-bold">₹{Number(totalRevenue.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">{sales?.length || 0} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{Number(totalCost.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
              ₹{Number(totalProfit.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
            <div className="text-2xl font-bold text-orange-600">₹{Number(totalOutstanding.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Amount pending</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="mb-6">
        <B2BSalesExportClient data={summaryData} />
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
                  <TableHead>Buyer</TableHead>
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
                  const items = sale.wholesale_sales_items || []
                  let saleRevenue = Number(sale.total_amount || 0)
                  let saleCost = 0

                  items.forEach((item: any) => {
                    const product = item.wholesale_products
                    if (product) {
                      const costPrice = Number(product.cost_price || 0)
                      const expenses = Number(product.expenses || 0)
                      const totalCostPerUnit = costPrice + expenses
                      const quantity = Number(item.quantity || 0)
                      saleCost += totalCostPerUnit * quantity
                    }
                  })

                  const saleProfit = saleRevenue - saleCost
                  const profitMargin = saleRevenue > 0 ? (saleProfit / saleRevenue) * 100 : 0
                  
                  // Calculate actual outstanding by summing payments
                  const totalPaid = paymentsBySale.get(sale.id) || 0
                  const balanceDue = Math.max(0, saleRevenue - totalPaid)

                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                      <TableCell>{new Date(sale.sale_date).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell>{sale.wholesale_buyers?.name || sale.customer_name || "-"}</TableCell>
                      <TableCell>₹{Number(saleRevenue.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>₹{Number(saleCost.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className={saleProfit >= 0 ? "text-green-600" : "text-red-600"}>
                        ₹{Number(saleProfit.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      <TableCell className="font-semibold">₹{Number(balanceDue.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  )
                })}
                {sales && sales.length > 0 && (
                  <TableRow className="bg-gray-100 font-bold">
                    <TableCell colSpan={3}>TOTAL</TableCell>
                    <TableCell>₹{Number(totalRevenue.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>₹{Number(totalCost.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell className={totalProfit >= 0 ? "text-green-600" : "text-red-600"}>
                      ₹{Number(totalProfit.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(2)}%` : "0%"}
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell className="font-semibold text-orange-600">₹{Number(totalOutstanding.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
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


