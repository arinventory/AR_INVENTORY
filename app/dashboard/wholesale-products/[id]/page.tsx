import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { WholesaleProductForm } from "@/components/wholesale-product-form"

export default async function EditProductPage({
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
  const [{ data: product }, { data: suppliers }] = await Promise.all([
    supabase.from("wholesale_products").select("*").eq("id", id.trim()).single(),
    supabase.from("suppliers").select("id, name").order("name"),
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Edit Product</h1>
        <p className="text-muted-foreground mt-2">{product.name}</p>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <WholesaleProductForm initialData={product} suppliers={suppliers || []} />
      </div>
    </div>
  )
}
