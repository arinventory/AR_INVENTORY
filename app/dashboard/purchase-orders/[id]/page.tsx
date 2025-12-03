import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PurchaseOrderForm } from "@/components/purchase-order-form"
import { DeletePurchaseOrderButton } from "@/components/delete-purchase-order-button"

export default async function PurchaseOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Validate that id is not empty
  if (!id || id.trim() === "") {
    notFound()
  }

  const supabase = await createClient()

  const [
    { data: order },
    { data: suppliers },
    { data: products }
  ] = await Promise.all([
    supabase
      .from("purchase_orders")
      .select(`*, purchase_order_items(quantity, unit_price, product_id)`)
      .eq("id", id.trim())
      .single(),
    supabase.from("suppliers").select("id, name, phone, address, city, state, postal_code, country").order("name"),
    supabase.from("wholesale_products").select("id, name, sku, wholesale_price, supplier_id").order("name")
  ])

  if (!order) notFound()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Purchase Order</h1>
          <p className="text-muted-foreground mt-1">{order.order_number}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/purchase-orders">
            <Button variant="outline">← Back</Button>
          </Link>
          <DeletePurchaseOrderButton orderId={id} />
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <PurchaseOrderForm 
          suppliers={suppliers || []} 
          products={products || []} 
          initialData={order as any}
        />
      </div>
    </div>
  )
}


