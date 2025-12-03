import { createClient } from "@/lib/supabase/server"
import { SalesForm } from "@/components/sales-form"

export default async function NewSalePage() {
  const supabase = await createClient()
  const [{ data: customers }, { data: products }] = await Promise.all([
    supabase.from("customers").select("id, name, email, phone, address, city, state, postal_code, country").order("name"),
    supabase.from("retail_products").select("id, name, size, retail_price, cost_price, expenses").eq("deleted", false),
  ])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Create Sale</h1>
        <p className="text-muted-foreground mt-2">Create a new customer sale</p>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <SalesForm customers={customers || []} products={products || []} />
      </div>
    </div>
  )
}
