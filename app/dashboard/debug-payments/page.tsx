import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useMemo } from "react"

export default async function DebugPaymentsPage() {
  const supabase = await createClient()
  
  // Fetch payments with all data
  const { data: payments, error } = await supabase
    .from("payments")
    .select(`
      *,
      suppliers(name),
      purchase_orders(order_number)
    `)
    .limit(5)

  // Analyze the data structure
  const analysis = useMemo(() => {
    if (!payments || payments.length === 0) return null
    
    const firstPayment = payments[0]
    return {
      hasSuppliers: !!firstPayment.suppliers,
      suppliersType: firstPayment.suppliers ? typeof firstPayment.suppliers : 'undefined',
      suppliersIsArray: Array.isArray(firstPayment.suppliers),
      suppliersLength: Array.isArray(firstPayment.suppliers) ? firstPayment.suppliers.length : 'N/A',
      hasPurchaseOrders: !!firstPayment.purchase_orders,
      purchaseOrdersType: firstPayment.purchase_orders ? typeof firstPayment.purchase_orders : 'undefined',
      purchaseOrdersIsArray: Array.isArray(firstPayment.purchase_orders),
      purchaseOrdersLength: Array.isArray(firstPayment.purchase_orders) ? firstPayment.purchase_orders.length : 'N/A',
      sampleSupplier: firstPayment.suppliers ? firstPayment.suppliers : null,
      samplePurchaseOrder: firstPayment.purchase_orders ? firstPayment.purchase_orders : null
    }
  }, [payments])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Payments Debug</h1>
        <p className="text-muted-foreground mt-2">Analyzing data structure</p>
      </div>

      {error && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error.message}</p>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Data Structure Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-bold mb-2">Suppliers Relationship</h3>
                <ul className="space-y-1">
                  <li>Exists: {analysis.hasSuppliers ? 'Yes' : 'No'}</li>
                  <li>Type: {analysis.suppliersType}</li>
                  <li>Is Array: {analysis.suppliersIsArray ? 'Yes' : 'No'}</li>
                  {analysis.suppliersIsArray && <li>Length: {analysis.suppliersLength}</li>}
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-2">Purchase Orders Relationship</h3>
                <ul className="space-y-1">
                  <li>Exists: {analysis.hasPurchaseOrders ? 'Yes' : 'No'}</li>
                  <li>Type: {analysis.purchaseOrdersType}</li>
                  <li>Is Array: {analysis.purchaseOrdersIsArray ? 'Yes' : 'No'}</li>
                  {analysis.purchaseOrdersIsArray && <li>Length: {analysis.purchaseOrdersLength}</li>}
                </ul>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="font-bold mb-2">Sample Data</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify({
                  suppliers: analysis.sampleSupplier,
                  purchase_orders: analysis.samplePurchaseOrder
                }, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Raw Payment Data</CardTitle>
        </CardHeader>
        <CardContent>
          {payments && payments.length > 0 ? (
            <div>
              <p className="mb-3">Showing first {payments.length} payment(s):</p>
              <div className="space-y-4">
                {payments.map((payment, index) => (
                  <div key={payment.id} className="border rounded p-4">
                    <h4 className="font-bold mb-2">Payment #{index + 1}</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(payment, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>No payments found.</p>
          )}
        </CardContent>
      </Card>

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