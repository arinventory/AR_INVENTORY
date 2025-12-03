import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { RetailProductForm } from "@/components/retail-product-form"

export default async function EditRetailProductPage({
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
  
  // Fetch product
  const { data: product, error } = await supabase
    .from("retail_products")
    .select("*")
    .eq("id", id.trim())
    .single()

  if (error || !product) {
    notFound()
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Edit Product</h1>
        <p className="text-muted-foreground mt-2">{product.name}</p>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <RetailProductForm initialData={product} />
      </div>
    </div>
  )
}
