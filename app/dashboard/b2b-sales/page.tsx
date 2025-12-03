import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteSaleButton } from "@/components/delete-sale-button"

export default async function B2BSalesPage() {
  const supabase = await createClient()
  const { data: sales } = await supabase
    .from("wholesale_sales")
    .select("*")
    .order("sale_date", { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">B2B Sales</h1>
          <p className="text-muted-foreground mt-2">Manage wholesale sales invoices</p>
        </div>
        <Link href="/dashboard/b2b-sales/new">
          <Button className="bg-blue-600 hover:bg-blue-700">+ New Sale</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.invoice_number}</TableCell>
                    <TableCell>{new Date(s.sale_date).toLocaleDateString()}</TableCell>
                    <TableCell>{s.customer_name || "-"}</TableCell>
                    <TableCell className="text-right">₹{Number(Number(s.total_amount || 0).toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{s.payment_status}</TableCell>
                    <TableCell className="space-x-2">
                      <Link href={`/dashboard/b2b-sales/${s.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                      <DeleteSaleButton saleId={s.id} />
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