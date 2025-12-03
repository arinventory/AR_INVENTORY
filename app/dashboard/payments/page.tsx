import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EditPaymentButton } from "../../../components/edit-payment-button"
import { DeletePaymentButton } from "../../../components/delete-payment-button"

export default async function PaymentsPage() {
  const supabase = await createClient()
  
  // First, let's check if we can connect to Supabase at all
  try {
    const { data: healthCheck, error: healthError } = await supabase
      .from("suppliers")
      .select("id")
      .limit(1)

    if (healthError) {
      console.error("Health check failed:", healthError)
    }
  } catch (healthErr) {
    console.error("Health check exception:", healthErr)
  }

  // Fetch payments with proper foreign key handling
  const { data: payments, error } = await supabase
    .from("payments")
    .select(`
      id,
      supplier_id,
      amount,
      payment_date,
      method,
      reference_no,
      notes,
      purchase_order_id,
      created_at,
      suppliers(name),
      purchase_orders(order_number)
    `)
    .order("payment_date", { ascending: false })

  // Debug: Log detailed error information
  if (error) {
    console.error("Error fetching payments:")
    console.error("  Message:", error.message)
    console.error("  Code:", error.code)
    console.error("  Hint:", error.hint)
    console.error("  Details:", error.details)
  }

  // Debug: Log sample data structure
  if (payments && payments.length > 0) {
    console.log("Sample payment data:", JSON.stringify(payments[0], null, 2))
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Supplier Payments</h1>
          <p className="text-muted-foreground mt-2">Record and view payments made to suppliers</p>
        </div>
        <Link href="/dashboard/payments/new">
          <Button className="bg-blue-600 hover:bg-blue-700">+ Record Payment</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500 p-4 rounded bg-red-50">
              <h3 className="font-bold text-lg">Database Error</h3>
              <p><strong>Message:</strong> {error.message}</p>
              {error.code && <p><strong>Code:</strong> {error.code}</p>}
              {error.hint && <p><strong>Hint:</strong> {error.hint}</p>}
              {error.details && <p><strong>Details:</strong> {error.details}</p>}
              <p className="mt-2 text-sm">Please check your Supabase connection and database permissions.</p>
              <p className="mt-2 text-sm">
                <Link href="/dashboard/diagnostics" className="text-blue-600 hover:underline">
                  Run diagnostics
                </Link> | 
                <Link href="/dashboard/update-permissions" className="text-blue-600 hover:underline ml-2">
                  Update permissions
                </Link>
              </p>
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference No</TableHead>
                    <TableHead>Purchase Order</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.id.substring(0, 8)}</TableCell>
                      <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {/* Handle both array and object formats */}
                        {p.suppliers 
                          ? Array.isArray(p.suppliers) 
                            ? p.suppliers.length > 0 
                              ? (p.suppliers[0] as any).name 
                              : "-"
                            : (p.suppliers as any).name || "-"
                          : "-"}
                      </TableCell>
                      <TableCell>{p.method || "-"}</TableCell>
                      <TableCell>{p.reference_no || "-"}</TableCell>
                      <TableCell>
                        {/* Handle both array and object formats */}
                        {p.purchase_orders 
                          ? Array.isArray(p.purchase_orders) 
                            ? p.purchase_orders.length > 0 
                              ? (p.purchase_orders[0] as any).order_number 
                              : "-"
                            : (p.purchase_orders as any).order_number || "-"
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">₹{Number(p.amount || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <EditPaymentButton paymentId={p.id} />
                        <DeletePaymentButton 
                          paymentId={p.id} 
                          purchaseOrderId={p.purchase_order_id || undefined} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No payments recorded yet.</p>
              <p className="mt-2">
                <Link href="/dashboard/payments/new" className="text-blue-600 hover:underline">
                  Record your first payment
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}