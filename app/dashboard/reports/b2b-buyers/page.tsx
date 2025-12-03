import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { B2BBuyerExportClient } from "@/components/b2b-buyer-export-client"
import { ReportDateFilter } from "@/components/report-date-filter"

export default async function B2BBuyerReportPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; month?: string; year?: string; quarter?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  // Fetch all wholesale buyers
  const { data: buyers } = await supabase
    .from("wholesale_buyers")
    .select("*")
    .order("name", { ascending: true })

  // Build date filter queries
  let salesQuery = supabase.from("wholesale_sales").select("*")
  let paymentQuery = supabase.from("buyer_payments").select("*")

  // Apply date filters
  const filterType = params.filter || "all"
  if (filterType === "month" && params.month && params.year) {
    const month = parseInt(params.month)
    const year = parseInt(params.year)
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`
    const endDate = new Date(year, month, 0).toISOString().split("T")[0]
    salesQuery = salesQuery.gte("sale_date", startDate).lte("sale_date", endDate)
    paymentQuery = paymentQuery.gte("payment_date", startDate).lte("payment_date", endDate)
  } else if (filterType === "year" && params.year) {
    const year = parseInt(params.year)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    salesQuery = salesQuery.gte("sale_date", startDate).lte("sale_date", endDate)
    paymentQuery = paymentQuery.gte("payment_date", startDate).lte("payment_date", endDate)
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
    salesQuery = salesQuery.gte("sale_date", startDate).lte("sale_date", endDate)
    paymentQuery = paymentQuery.gte("payment_date", startDate).lte("payment_date", endDate)
  }

  // Fetch wholesale sales and payments with filters
  const { data: wholesaleSales } = await salesQuery.order("sale_date", { ascending: false })
  const { data: buyerPayments } = await paymentQuery.order("payment_date", { ascending: false })

  // Fetch buyer credit ledger entries
  const { data: creditLedgerEntries } = await supabase
    .from("buyer_credit_ledger")
    .select("*")
    .order("created_at", { ascending: false })

  // Calculate metrics for each buyer
  let totalSales = 0
  let totalPayments = 0
  let totalOutstanding = 0

  const buyerReports = buyers?.map((buyer) => {
    // Get sales for this buyer
    const buyerSales = wholesaleSales?.filter((sale) => sale.customer_id === buyer.id) || []
    const buyerSalesTotal = buyerSales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)

    // Get payments from this buyer
    const buyerPaymentsList = buyerPayments?.filter((p) => p.customer_id === buyer.id) || []
    const buyerPaymentTotal = buyerPaymentsList.reduce((sum, p) => sum + Number(p.amount || 0), 0)

    // Get current balance from credit ledger (entries are sorted by created_at descending)
    const buyerLedger = creditLedgerEntries?.filter((entry) => entry.customer_id === buyer.id) || []
    // Sort by created_at ascending to get chronological order, then take the last one
    const sortedLedger = [...buyerLedger].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const latestBalance = sortedLedger.length > 0 
      ? Number(sortedLedger[sortedLedger.length - 1].balance_after || 0)
      : buyerSalesTotal - buyerPaymentTotal

    const outstanding = latestBalance
    const paidSales = buyerSales.filter((sale) => sale.payment_status === "paid").length
    const pendingSales = buyerSales.filter((sale) => sale.payment_status === "pending").length
    const partialSales = buyerSales.filter((sale) => sale.payment_status === "partial").length

    totalSales += buyerSalesTotal
    totalPayments += buyerPaymentTotal
    totalOutstanding += outstanding

    return {
      "Buyer Name": buyer.name,
      "Phone": buyer.phone || "-",
      "Address": buyer.address || "-",
      "City": buyer.city || "-",
      "State": buyer.state || "-",
      "Total Sales": `₹${buyerSalesTotal.toFixed(2)}`,
      "Total Payments": `₹${buyerPaymentTotal.toFixed(2)}`,
      "Outstanding Balance": `₹${outstanding.toFixed(2)}`,
      "Total Invoices": buyerSales.length,
      "Paid Invoices": paidSales,
      "Pending Invoices": pendingSales,
      "Partial Invoices": partialSales,
      "Last Sale Date": buyerSales.length > 0 
        ? new Date(buyerSales[0].sale_date).toLocaleDateString("en-IN")
        : "-",
      "Last Payment Date": buyerPaymentsList.length > 0
        ? new Date(buyerPaymentsList[0].payment_date).toLocaleDateString("en-IN")
        : "-",
    }
  }) || []

  // Add summary row
  const summaryData = [
    ...buyerReports,
    {
      "Buyer Name": "TOTAL",
      "Phone": "",
      "Address": "",
      "City": "",
      "State": "",
      "Total Sales": `₹${totalSales.toFixed(2)}`,
      "Total Payments": `₹${totalPayments.toFixed(2)}`,
      "Outstanding Balance": `₹${totalOutstanding.toFixed(2)}`,
      "Total Invoices": wholesaleSales?.length || 0,
      "Paid Invoices": wholesaleSales?.filter((s) => s.payment_status === "paid").length || 0,
      "Pending Invoices": wholesaleSales?.filter((s) => s.payment_status === "pending").length || 0,
      "Partial Invoices": wholesaleSales?.filter((s) => s.payment_status === "partial").length || 0,
      "Last Sale Date": "",
      "Last Payment Date": "",
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">B2B Buyer Report</h1>
        <p className="text-muted-foreground mt-2">Buyer receivables, balances, and sales analysis</p>
      </div>

      {/* Date Filter */}
      <ReportDateFilter />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{wholesaleSales?.length || 0} invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <span className="text-2xl">💳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalPayments.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{buyerPayments?.length || 0} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Receivables</CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{totalOutstanding.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Amount owed by buyers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Buyers</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buyers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total buyers</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="mb-6">
        <B2BBuyerExportClient data={summaryData} />
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Buyer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total Sales</TableHead>
                  <TableHead>Total Payments</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Invoices</TableHead>
                  <TableHead>Last Sale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyers?.map((buyer) => {
                  const buyerSales = wholesaleSales?.filter((sale) => sale.customer_id === buyer.id) || []
                  const buyerSalesTotal = buyerSales.reduce((sum, sale) => sum + Number(sale.total_amount || 0), 0)
                  const buyerPaymentsList = buyerPayments?.filter((p) => p.customer_id === buyer.id) || []
                  const buyerPaymentTotal = buyerPaymentsList.reduce((sum, p) => sum + Number(p.amount || 0), 0)
                  const buyerLedger = creditLedgerEntries?.filter((entry) => entry.customer_id === buyer.id) || []
                  const latestBalance = buyerLedger.length > 0 
                    ? Number(buyerLedger[buyerLedger.length - 1].balance_after || 0)
                    : buyerSalesTotal - buyerPaymentTotal

                  return (
                    <TableRow key={buyer.id}>
                      <TableCell className="font-medium">{buyer.name}</TableCell>
                      <TableCell>{buyer.phone || "-"}</TableCell>
                      <TableCell>₹{buyerSalesTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-green-600">₹{buyerPaymentTotal.toFixed(2)}</TableCell>
                      <TableCell className={`font-semibold ${latestBalance > 0 ? "text-orange-600" : "text-green-600"}`}>
                        ₹{latestBalance.toFixed(2)}
                      </TableCell>
                      <TableCell>{buyerSales.length}</TableCell>
                      <TableCell>
                        {buyerSales.length > 0 
                          ? new Date(buyerSales[0].sale_date).toLocaleDateString("en-IN")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {buyers && buyers.length > 0 && (
                  <TableRow className="bg-gray-100 font-bold">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell>₹{totalSales.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600">₹{totalPayments.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-orange-600">₹{totalOutstanding.toFixed(2)}</TableCell>
                    <TableCell>{wholesaleSales?.length || 0}</TableCell>
                    <TableCell></TableCell>
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


