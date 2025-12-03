import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default async function BuyerPaymentsPage() {
  const supabase = await createClient()
  const { data: payments } = await supabase
    .from("buyer_payments")
    .select("*, wholesale_buyers(name), wholesale_sales(invoice_number, total_amount)")
    .order("payment_date", { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Buyer Payments</h1>
          <p className="text-muted-foreground mt-2">Record and view payments received from buyers</p>
        </div>
        <Link href="/dashboard/buyer-payments/new">
          <Button className="bg-blue-600 hover:bg-blue-700">+ Record Payment</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Buyer Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments && payments.length > 0 ? (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{p.wholesale_buyers?.name || "-"}</TableCell>
                      <TableCell>
                        {p.wholesale_sales?.invoice_number ? (
                          <span className="font-mono text-sm">{p.wholesale_sales.invoice_number}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not linked</span>
                        )}
                      </TableCell>
                      <TableCell>{p.method || "-"}</TableCell>
                      <TableCell>{p.reference_no || "-"}</TableCell>
                      <TableCell className="text-right font-semibold">₹{Number(Number(p.amount || 0).toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No buyer payments recorded yet.
                    </TableCell>
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

