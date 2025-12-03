import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PurchaseExportClient } from "@/components/purchase-export-client"

export default async function PurchaseDetailReportPage() {
  const supabase = await createClient()
  const { data: orders } = await supabase
    .from("purchase_orders")
    .select("*, suppliers(name)")
    .order("order_date", { ascending: false })

  const totalPurchases = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
  const pendingOrders = orders?.filter((o) => o.status === "pending").length || 0
  const receivedOrders = orders?.filter((o) => o.status === "received").length || 0

  const exportData = orders?.map((order) => ({
    "Order Number": order.order_number,
    Supplier: order.suppliers?.name || "-",
    "Order Date": new Date(order.order_date).toLocaleDateString(),
    "Expected Delivery": order.expected_delivery_date
      ? new Date(order.expected_delivery_date).toLocaleDateString()
      : "-",
    "Total Amount": `₹${order.total_amount.toFixed(2)}`,
    Status: order.status,
  }))

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Detailed Purchase Report</h1>
          <p className="text-muted-foreground mt-2">Complete purchase order history</p>
        </div>
        <PurchaseExportClient data={exportData || []} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <span className="text-2xl">💵</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPurchases.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <span className="text-2xl">⏳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received Orders</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{receivedOrders}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell>{order.suppliers?.name || "-"}</TableCell>
                    <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="font-bold">₹{order.total_amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "received"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status}
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
