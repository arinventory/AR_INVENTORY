import { createClient } from "@/lib/supabase/server"
import { WholesaleSaleForm } from "@/components/wholesale-sale-form"

export default async function NewB2BSalePage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    .from("wholesale_products")
    .select("id, name, sku, wholesale_price, gst_percentage, gst_amount")
    .eq("deleted", false)
    .order("name")

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">New B2B Sale</h1>
        <p className="text-muted-foreground mt-2">Create a wholesale sales invoice</p>
      </div>
      <div className="w-full max-w-6xl mx-auto">
        <WholesaleSaleForm products={products || []} />
      </div>
    </div>
  )
}