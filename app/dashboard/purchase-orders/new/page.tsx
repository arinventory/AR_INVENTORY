import { createClient } from "@/lib/supabase/server"
import { PurchaseOrderForm } from "@/components/purchase-order-form"

export default async function NewPurchaseOrderPage() {
  const supabase = await createClient()
  const [{ data: suppliers }, { data: products }] = await Promise.all([
    supabase.from("suppliers").select("id, name, phone, address, city, state, postal_code, country").eq("deleted", false).order("name"),
    supabase.from("wholesale_products").select("id, name, sku, wholesale_price, supplier_id"),
  ])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Create Purchase Order</h1>
        <p className="text-muted-foreground mt-2">Create a new purchase order</p>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <PurchaseOrderForm suppliers={suppliers || []} products={products || []} />
      </div>
    </div>
  )
}