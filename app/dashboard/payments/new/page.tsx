import { createClient } from "@/lib/supabase/server"
import { RecordPaymentForm } from "@/components/record-payment-form"

export default async function NewPaymentPage() {
  const supabase = await createClient()
  const { data: suppliers } = await supabase.from("suppliers").select("id, name").order("name")

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Record Payment</h1>
        <p className="text-muted-foreground mt-2">Add a supplier payment and update credit ledger</p>
      </div>
      <div className="w-full max-w-6xl mx-auto">
        <RecordPaymentForm suppliers={suppliers || []} />
      </div>
    </div>
  )
}







