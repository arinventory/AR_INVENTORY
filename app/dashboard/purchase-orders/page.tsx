import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { PurchaseOrdersTable } from "@/components/purchase-orders-table"

export default async function PurchaseOrdersPage() {
  const supabase = await createClient()
  const { data: orders, error } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      suppliers(name),
      purchase_order_items(quantity, wholesale_products(name))
    `)
    .order("order_date", { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-muted-foreground mt-2">Manage supplier purchase orders</p>
        </div>
        <Link href="/dashboard/purchase-orders/new">
          <Button className="bg-blue-600 hover:bg-blue-700">+ New Order</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">Error loading orders: {error.message}</div>
          ) : orders && orders.length > 0 ? (
            <PurchaseOrdersTable orders={orders} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No purchase orders found.{" "}
              <Link href="/dashboard/purchase-orders/new" className="text-blue-600 hover:underline">
                Create one
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
