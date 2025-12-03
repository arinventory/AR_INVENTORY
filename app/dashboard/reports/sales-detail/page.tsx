import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SalesExportClient } from "@/components/sales-export-client"

export default async function SalesDetailReportPage() {
  const supabase = await createClient()
  const { data: sales } = await supabase
    .from("sales")
    .select("*, customers(name)")
    .order("sale_date", { ascending: false })

  const totalRevenue = sales?.reduce((sum, s) => sum + (s.total_amount || 0), 0) || 0
  const totalTax = sales?.reduce((sum, s) => sum + (s.tax_amount || 0), 0) || 0
  const totalDiscount = sales?.reduce((sum, s) => sum + (s.discount_amount || 0), 0) || 0

  const exportData = sales?.map((sale) => ({
    "Invoice Number": sale.invoice_number,
    Customer: sale.customers?.name || "-",
    "Sale Date": new Date(sale.sale_date).toLocaleDateString(),
    Subtotal: `₹${sale.subtotal.toFixed(2)}`,
    Tax: `₹${sale.tax_amount.toFixed(2)}`,
    Discount: `₹${sale.discount_amount.toFixed(2)}`,
    Total: `₹${sale.total_amount.toFixed(2)}`,
    Status: sale.payment_status,
  }))

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Detailed Sales Report</h1>
          <p className="text-muted-foreground mt-2">Complete sales transaction history</p>
        </div>
        <SalesExportClient data={exportData || []} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <span className="text-2xl">💰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tax Collected</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalTax.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Discounts Given</CardTitle>
            <span className="text-2xl">🎁</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalDiscount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sales Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                    <TableCell>{sale.customers?.name || "-"}</TableCell>
                    <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                    <TableCell>₹{sale.subtotal.toFixed(2)}</TableCell>
                    <TableCell>₹{sale.tax_amount.toFixed(2)}</TableCell>
                    <TableCell>₹{sale.discount_amount.toFixed(2)}</TableCell>
                    <TableCell className="font-bold">₹{sale.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        {sale.payment_status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
