import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function DiagnosticsPage() {
  const supabase = await createClient()
  
  // Test database connections
  const { data: suppliers, error: suppliersError } = await supabase
    .from("suppliers")
    .select("id, name")
    .limit(5)
  
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("id, amount, payment_date", { count: "exact" })
    .limit(5)
  
  const { data: purchaseOrders, error: poError } = await supabase
    .from("purchase_orders")
    .select("id, order_number, total_amount", { count: "exact" })
    .limit(5)
  
  const { count: totalPayments } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
  
  const { count: totalSuppliers } = await supabase
    .from("suppliers")
    .select("*", { count: "exact", head: true })
  
  const { count: totalPOs } = await supabase
    .from("purchase_orders")
    .select("*", { count: "exact", head: true })

  // Test basic Supabase connectivity
  let supabaseStatus = "Unknown"
  let supabaseError: any = null
  
  try {
    const { data, error } = await supabase.rpc('now')
    if (error) {
      supabaseStatus = "Error"
      supabaseError = error
    } else {
      supabaseStatus = "Connected"
    }
  } catch (err) {
    supabaseStatus = "Exception"
    supabaseError = err
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">System Diagnostics</h1>
        <p className="text-muted-foreground mt-2">Database connection and data status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Database Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-3 rounded ${supabaseStatus === "Connected" ? "bg-green-50" : "bg-red-50"}`}>
                <span>Supabase Connection</span>
                <span className={`font-bold ${supabaseStatus === "Connected" ? "text-green-600" : "text-red-600"}`}>
                  {supabaseStatus}
                </span>
              </div>
              
              {supabaseError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  <p><strong>Error:</strong> {supabaseError.message}</p>
                  {supabaseError.code && <p><strong>Code:</strong> {supabaseError.code}</p>}
                </div>
              )}
              
              <div className="text-sm text-muted-foreground">
                <p>Environment Variables:</p>
                <p>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Missing"}</p>
                <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Set" : "✗ Missing"}</p>
                <p>SUPABASE_SERVICE_ROLE_KEY: {process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Set" : "⚠️ Optional for diagnostics"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Suppliers:</span>
                <span className="font-bold">{totalSuppliers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Purchase Orders:</span>
                <span className="font-bold">{totalPOs || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Payments:</span>
                <span className="font-bold">{totalPayments || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Payments Table</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsError ? (
              <div className="text-red-500 p-3 rounded bg-red-50">
                <p><strong>Error:</strong> {paymentsError.message}</p>
                {paymentsError.code && <p><strong>Code:</strong> {paymentsError.code}</p>}
                {paymentsError.hint && <p><strong>Hint:</strong> {paymentsError.hint}</p>}
                {paymentsError.details && <p><strong>Details:</strong> {paymentsError.details}</p>}
              </div>
            ) : payments && payments.length > 0 ? (
              <div>
                <p className="mb-3">Found {totalPayments} payment(s) in database:</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(payment.payment_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(payment.amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No payments found in database.</p>
                <p className="mt-2">
                  <Link href="/dashboard/payments/new" className="text-blue-600 hover:underline">
                    Record your first payment
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suppliers Table</CardTitle>
          </CardHeader>
          <CardContent>
            {suppliersError ? (
              <div className="text-red-500 p-3 rounded bg-red-50">
                <p><strong>Error:</strong> {suppliersError.message}</p>
                {suppliersError.code && <p><strong>Code:</strong> {suppliersError.code}</p>}
                {suppliersError.hint && <p><strong>Hint:</strong> {suppliersError.hint}</p>}
                {suppliersError.details && <p><strong>Details:</strong> {suppliersError.details}</p>}
              </div>
            ) : suppliers && suppliers.length > 0 ? (
              <div>
                <p className="mb-3">Found {totalSuppliers} supplier(s) in database:</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {suppliers.map((supplier) => (
                        <tr key={supplier.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No suppliers found in database.</p>
                <p className="mt-2">
                  <Link href="/dashboard/suppliers/new" className="text-blue-600 hover:underline">
                    Add your first supplier
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders Table</CardTitle>
          </CardHeader>
          <CardContent>
            {poError ? (
              <div className="text-red-500 p-3 rounded bg-red-50">
                <p><strong>Error:</strong> {poError.message}</p>
                {poError.code && <p><strong>Code:</strong> {poError.code}</p>}
                {poError.hint && <p><strong>Hint:</strong> {poError.hint}</p>}
                {poError.details && <p><strong>Details:</strong> {poError.details}</p>}
              </div>
            ) : purchaseOrders && purchaseOrders.length > 0 ? (
              <div>
                <p className="mb-3">Found {totalPOs} purchase order(s) in database:</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchaseOrders.map((po) => (
                        <tr key={po.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.order_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(po.total_amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No purchase orders found in database.</p>
                <p className="mt-2">
                  <Link href="/dashboard/purchase-orders/new" className="text-blue-600 hover:underline">
                    Create your first purchase order
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">Need to fix permissions?</h3>
        <p className="text-yellow-700 mb-4">
          If you're having issues with editing or deleting payments, you may need to update database permissions.
        </p>
        <Link href="/dashboard/update-permissions">
          <Button variant="outline" className="border-yellow-600 text-yellow-700 hover:bg-yellow-100">
            Update Database Permissions
          </Button>
        </Link>
      </div>

      <div className="mt-8 text-center">
        <Link href="/dashboard">
          <Button variant="outline">← Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}