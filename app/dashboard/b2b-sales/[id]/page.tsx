import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WholesaleSaleForm } from "@/components/wholesale-sale-form"
import { DeleteSaleButton } from "@/components/delete-sale-button"
import { PrintButton } from "@/components/print-button"

export default async function B2BSaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Validate that id is not empty
  if (!id || id.trim() === "") {
    notFound()
  }

  const supabase = await createClient()
  const [
    { data: sale },
    { data: products }
  ] = await Promise.all([
    supabase
      .from("wholesale_sales")
      .select(`*, customer:wholesale_buyers(*), wholesale_sales_items(quantity, unit_price, cgst_amount, sgst_amount, product_id, wholesale_products(id, name, sku, deleted))`)
      .eq("id", id.trim())
      .single(),
    supabase
      .from("wholesale_products")
      .select("id, name, sku, wholesale_price, gst_percentage, gst_amount")
      .eq("deleted", false)
      .order("name")
  ])

  if (!sale) notFound()

  // Prepare sale data for the form
  const saleData = {
    ...sale,
    customer_id: sale.customer?.id || sale.customer_id || null,
    customer_name: sale.customer?.name || sale.customer_name || "",
    customer_phone: sale.customer?.phone || sale.customer_phone || "",
    customer_address: sale.customer?.address || sale.customer_address || "",
    customer_city: sale.customer?.city || sale.customer_city || "",
    customer_state: sale.customer?.state || sale.customer_state || "",
    customer_postal_code: sale.customer?.postal_code || sale.customer_postal_code || "",
    customer_country: sale.customer?.country || sale.customer_country || "",
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit B2B Sale</h1>
          <p className="text-muted-foreground mt-1">{sale.invoice_number}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/b2b-sales">
            <Button variant="outline">← Back</Button>
          </Link>
          <Link href={`/dashboard/b2b-sales/${id}/print`}>
            <Button variant="outline">🖨️ Print</Button>
          </Link>
          <DeleteSaleButton saleId={id} />
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <WholesaleSaleForm products={products || []} initialData={saleData as any} />
      </div>
    </div>
  )
}