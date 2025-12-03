import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { B2BSupplierExportClient } from "@/components/b2b-supplier-export-client"
import { ReportDateFilter } from "@/components/report-date-filter"

export default async function B2BSupplierReportPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; month?: string; year?: string; quarter?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  
  // Fetch all suppliers
  const { data: suppliers } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true })

  // Build date filter queries for purchase orders and payments
  let poQuery = supabase.from("purchase_orders").select("*")
  let paymentQuery = supabase.from("payments").select("*")

  // Apply date filters
  const filterType = params.filter || "all"
  if (filterType === "month" && params.month && params.year) {
    const month = parseInt(params.month)
    const year = parseInt(params.year)
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`
    const endDate = new Date(year, month, 0).toISOString().split("T")[0]
    poQuery = poQuery.gte("order_date", startDate).lte("order_date", endDate)
    paymentQuery = paymentQuery.gte("payment_date", startDate).lte("payment_date", endDate)
  } else if (filterType === "year" && params.year) {
    const year = parseInt(params.year)
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    poQuery = poQuery.gte("order_date", startDate).lte("order_date", endDate)
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
    poQuery = poQuery.gte("order_date", startDate).lte("order_date", endDate)
    paymentQuery = paymentQuery.gte("payment_date", startDate).lte("payment_date", endDate)
  }

  // Fetch purchase orders and payments with filters
  const { data: purchaseOrders } = await poQuery.order("order_date", { ascending: false })
  const { data: payments } = await paymentQuery.order("payment_date", { ascending: false })

  // Fetch credit ledger entries
  const { data: creditLedgerEntries } = await supabase
    .from("credit_ledger")
    .select("*")
    .order("created_at", { ascending: false })

  // Calculate metrics for each supplier
  let totalPurchases = 0
  let totalPayments = 0
  let totalOutstanding = 0

  const supplierReports = suppliers?.map((supplier) => {
    // Get purchase orders for this supplier
    const supplierPOs = purchaseOrders?.filter((po) => po.supplier_id === supplier.id) || []
    const supplierPurchaseTotal = supplierPOs.reduce((sum, po) => sum + Number(po.total_amount || 0), 0)

    // Get payments for this supplier
    const supplierPayments = payments?.filter((p) => p.supplier_id === supplier.id) || []
    const supplierPaymentTotal = supplierPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)

    // Get current balance from credit ledger (entries are sorted by created_at descending)
    const supplierLedger = creditLedgerEntries?.filter((entry) => entry.supplier_id === supplier.id) || []
    // Sort by created_at ascending to get chronological order, then take the last one
    const sortedLedger = [...supplierLedger].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    const latestBalance = sortedLedger.length > 0 
      ? Number(sortedLedger[sortedLedger.length - 1].balance_after || 0)
      : supplierPurchaseTotal - supplierPaymentTotal

    const outstanding = latestBalance
    const pendingPOs = supplierPOs.filter((po) => po.status === "pending").length
    const receivedPOs = supplierPOs.filter((po) => po.status === "received").length

    totalPurchases += supplierPurchaseTotal
    totalPayments += supplierPaymentTotal
    totalOutstanding += outstanding

    return {
      "Supplier Name": supplier.name,
      "Contact Person": supplier.contact_person || "-",
      "Phone": supplier.phone || "-",
      "Email": supplier.email || "-",
      "Total Purchases": `₹${supplierPurchaseTotal.toFixed(2)}`,
      "Total Payments": `₹${supplierPaymentTotal.toFixed(2)}`,
      "Outstanding Balance": `₹${outstanding.toFixed(2)}`,
      "Purchase Orders": supplierPOs.length,
      "Pending Orders": pendingPOs,
      "Received Orders": receivedPOs,
      "Last Purchase Date": supplierPOs.length > 0 
        ? new Date(supplierPOs[0].order_date).toLocaleDateString("en-IN")
        : "-",
      "Last Payment Date": supplierPayments.length > 0
        ? new Date(supplierPayments[0].payment_date).toLocaleDateString("en-IN")
        : "-",
    }
  }) || []

  // Add summary row
  const summaryData = [
    ...supplierReports,
    {
      "Supplier Name": "TOTAL",
      "Contact Person": "",
      "Phone": "",
      "Email": "",
      "Total Purchases": `₹${totalPurchases.toFixed(2)}`,
      "Total Payments": `₹${totalPayments.toFixed(2)}`,
      "Outstanding Balance": `₹${totalOutstanding.toFixed(2)}`,
      "Purchase Orders": purchaseOrders?.length || 0,
      "Pending Orders": purchaseOrders?.filter((po) => po.status === "pending").length || 0,
      "Received Orders": purchaseOrders?.filter((po) => po.status === "received").length || 0,
      "Last Purchase Date": "",
      "Last Payment Date": "",
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">B2B Supplier Report</h1>
        <p className="text-muted-foreground mt-2">Supplier payables, balances, and purchase analysis</p>
      </div>

      {/* Date Filter */}
      <ReportDateFilter />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPurchases.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{purchaseOrders?.length || 0} orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <span className="text-2xl">💳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalPayments.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{payments?.length || 0} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Payables</CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{totalOutstanding.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Amount owed to suppliers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Total suppliers</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="mb-6">
        <B2BSupplierExportClient data={summaryData} />
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total Purchases</TableHead>
                  <TableHead>Total Payments</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Last Purchase</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers?.map((supplier) => {
                  const supplierPOs = purchaseOrders?.filter((po) => po.supplier_id === supplier.id) || []
                  const supplierPurchaseTotal = supplierPOs.reduce((sum, po) => sum + Number(po.total_amount || 0), 0)
                  const supplierPayments = payments?.filter((p) => p.supplier_id === supplier.id) || []
                  const supplierPaymentTotal = supplierPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
                  const supplierLedger = creditLedgerEntries?.filter((entry) => entry.supplier_id === supplier.id) || []
                  const latestBalance = supplierLedger.length > 0 
                    ? Number(supplierLedger[supplierLedger.length - 1].balance_after || 0)
                    : supplierPurchaseTotal - supplierPaymentTotal

                  return (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.contact_person || "-"}</TableCell>
                      <TableCell>{supplier.phone || "-"}</TableCell>
                      <TableCell>₹{supplierPurchaseTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-green-600">₹{supplierPaymentTotal.toFixed(2)}</TableCell>
                      <TableCell className={`font-semibold ${latestBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                        ₹{latestBalance.toFixed(2)}
                      </TableCell>
                      <TableCell>{supplierPOs.length}</TableCell>
                      <TableCell>
                        {supplierPOs.length > 0 
                          ? new Date(supplierPOs[0].order_date).toLocaleDateString("en-IN")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {suppliers && suppliers.length > 0 && (
                  <TableRow className="bg-gray-100 font-bold">
                    <TableCell colSpan={3}>TOTAL</TableCell>
                    <TableCell>₹{totalPurchases.toFixed(2)}</TableCell>
                    <TableCell className="text-green-600">₹{totalPayments.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold text-red-600">₹{totalOutstanding.toFixed(2)}</TableCell>
                    <TableCell>{purchaseOrders?.length || 0}</TableCell>
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


