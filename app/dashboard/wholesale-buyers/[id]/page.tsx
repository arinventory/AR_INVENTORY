import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { WholesaleBuyerForm } from "@/components/wholesale-buyer-form"

export default async function EditWholesaleBuyerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  if (!id || id.trim() === "") {
    notFound()
  }

  const supabase = await createClient()
  const { data: buyer, error } = await supabase
    .from("wholesale_buyers")
    .select("*")
    .eq("id", id.trim())
    .single()

  if (error || !buyer) {
    notFound()
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Edit Buyer</h1>
        <p className="text-muted-foreground mt-2">{buyer.name}</p>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <WholesaleBuyerForm initialData={buyer} />
      </div>
    </div>
  )
}

