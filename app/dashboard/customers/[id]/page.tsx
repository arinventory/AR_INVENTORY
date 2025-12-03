import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { CustomerForm } from "@/components/customer-form"

export default async function EditCustomerPage({
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
  const { data: customer, error } = await supabase.from("customers").select("*").eq("id", id.trim()).single()

  if (error || !customer) {
    notFound()
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Edit Customer</h1>
        <p className="text-muted-foreground mt-2">{customer.name}</p>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <CustomerForm initialData={customer} />
      </div>
    </div>
  )
}
