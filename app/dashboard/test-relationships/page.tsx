import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function TestRelationshipsPage() {
  const supabase = await createClient()
  
  // Test 1: Check suppliers table
  const { data: suppliers, error: suppliersError } = await supabase
    .from("suppliers")
    .select("id, name")
    .limit(5)
  
  // Test 2: Check purchase_orders table
  const { data: purchaseOrders, error: poError } = await supabase
    .from("purchase_orders")
    .select("id, order_number, supplier_id")
    .limit(5)
  
  // Test 3: Check payments table with relationships
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select(`
      id,
      supplier_id,
      purchase_order_id,
      amount,
      payment_date,
      suppliers(name),
      purchase_orders(order_number)
    `)
    .limit(5)
  
  // Test 4: Check individual relationships
  let individualTests = []
  if (payments && payments.length > 0) {
    for (let i = 0; i < Math.min(3, payments.length); i++) {
      const payment = payments[i]
      
      // Test supplier lookup
      const { data: supplierData, error: supplierError } = await supabase
        .from("suppliers")
        .select("name")
        .eq("id", payment.supplier_id)
        .single()
      
      // Test purchase order lookup
      let poData = null
      let poError = null
      if (payment.purchase_order_id) {
        const result = await supabase
          .from("purchase_orders")
          .select("order_number")
          .eq("id", payment.purchase_order_id)
          .single()
        poData = result.data
        poError = result.error
      }
      
      individualTests.push({
        paymentId: payment.id,
        supplierId: payment.supplier_id,
        poId: payment.purchase_order_id,
        supplierLookup: supplierData?.name || supplierError?.message,
        poLookup: poData?.order_number || poError?.message || "No PO linked"
      })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Relationships Test</h1>
        <p className="text-muted-foreground mt-2">Debugging foreign key relationships</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Suppliers Test */}
        <Card>
          <CardHeader>
            <CardTitle>Suppliers Table</CardTitle>
          </CardHeader>
          <CardContent>
            {suppliersError ? (
              <div className="text-red-500 p-3 rounded bg-red-50">
                <p><strong>Error:</strong> {suppliersError.message}</p>
              </div>
            ) : suppliers && suppliers.length > 0 ? (
              <div>
                <p className="mb-3">Found {suppliers.length} supplier(s):</p>
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
                <p>No suppliers found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Purchase Orders Test */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders Table</CardTitle>
          </CardHeader>
          <CardContent>
            {poError ? (
              <div className="text-red-500 p-3 rounded bg-red-50">
                <p><strong>Error:</strong> {poError.message}</p>
              </div>
            ) : purchaseOrders && purchaseOrders.length > 0 ? (
              <div>
                <p className="mb-3">Found {purchaseOrders.length} purchase order(s):</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier ID</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchaseOrders.map((po) => (
                        <tr key={po.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.order_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.supplier_id?.substring(0, 8) || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No purchase orders found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payments with Relationships Test */}
        <Card>
          <CardHeader>
            <CardTitle>Payments with Relationships</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsError ? (
              <div className="text-red-500 p-3 rounded bg-red-50">
                <p><strong>Error:</strong> {paymentsError.message}</p>
              </div>
            ) : payments && payments.length > 0 ? (
              <div>
                <p className="mb-3">Found {payments.length} payment(s) with relationships:</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Name (Rel)</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number (Rel)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.id.substring(0, 8)}...</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.supplier_id?.substring(0, 8) || "-"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.purchase_order_id?.substring(0, 8) || "-"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.suppliers && payment.suppliers.length > 0 
                              ? payment.suppliers[0].name 
                              : "Not found"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {payment.purchase_orders && payment.purchase_orders.length > 0 
                              ? payment.purchase_orders[0].order_number 
                              : "Not found"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No payments found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Individual Lookup Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Individual Relationship Lookups</CardTitle>
          </CardHeader>
          <CardContent>
            {individualTests.length > 0 ? (
              <div>
                <p className="mb-3">Manual lookups for first {individualTests.length} payments:</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Lookup</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Lookup</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {individualTests.map((test) => (
                        <tr key={test.paymentId}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.paymentId.substring(0, 8)}...</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.supplierLookup}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{test.poLookup}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>No payments to test.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center">
        <Link href="/dashboard/payments">
          <Button variant="outline" className="mr-4">← Back to Payments</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">← Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}