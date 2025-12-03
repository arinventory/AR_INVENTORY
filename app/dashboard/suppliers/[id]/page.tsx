import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { SupplierForm } from "@/components/supplier-form"

export default async function EditSupplierPage({
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
  const { data: supplier, error } = await supabase.from("suppliers").select("*").eq("id", id.trim()).single()

  if (error || !supplier) {
    notFound()
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Edit Supplier</h1>
        <p className="text-muted-foreground mt-2">{supplier.name}</p>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <SupplierForm initialData={supplier} />
      </div>
    </div>
  )
}
