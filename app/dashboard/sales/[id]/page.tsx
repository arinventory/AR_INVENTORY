import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SalesForm } from "@/components/sales-form"
import { DeleteSaleButton } from "@/components/delete-retail-sale-button"

export default async function SalesDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Validate that id is not empty
  if (!id || id.trim() === "") {
    notFound()
  }

  const supabase = await createClient()
  const [
    { data: sale },
    { data: customers },
    { data: products }
  ] = await Promise.all([
    supabase
      .from("sales")
      .select(`*, sales_items(quantity, unit_price, product_id)`)
      .eq("id", id.trim())
      .single(),
    supabase.from("customers").select("id, name, email, phone, address, city, state, postal_code, country").order("name"),
    supabase.from("retail_products").select("id, name, size, retail_price, cost_price, expenses").eq("deleted", false).order("name")
  ])

  if (!sale) notFound()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Sale</h1>
          <p className="text-muted-foreground mt-1">{sale.invoice_number}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/sales">
            <Button variant="outline">← Back</Button>
          </Link>
          <DeleteSaleButton saleId={id} />
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <SalesForm 
          customers={customers || []} 
          products={products || []} 
          initialData={sale as any}
        />
      </div>
    </div>
  )
}

