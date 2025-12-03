import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RecordPaymentForm } from "@/components/record-payment-form"

export default async function EditPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Validate that id is not empty
  if (!id || id.trim() === "") {
    notFound()
  }

  const supabase = await createClient()
  
  const [
    { data: payment },
    { data: suppliers }
  ] = await Promise.all([
    supabase
      .from("payments")
      .select(`*`)
      .eq("id", id.trim())
      .single(),
    supabase.from("suppliers").select("id, name").order("name")
  ])

  if (!payment) notFound()

  // Convert payment data to match PaymentData interface
  const paymentData = {
    id: payment.id,
    supplier_id: payment.supplier_id,
    amount: payment.amount,
    payment_date: payment.payment_date,
    method: payment.method,
    reference_no: payment.reference_no,
    notes: payment.notes,
    purchase_order_id: payment.purchase_order_id,
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Edit Payment</h1>
          <p className="text-muted-foreground mt-1">Modify supplier payment details</p>
        </div>
        <Link href="/dashboard/payments">
          <Button variant="outline">← Back to Payments</Button>
        </Link>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <RecordPaymentForm 
          suppliers={suppliers || []} 
          initialData={paymentData}
        />
      </div>
    </div>
  )
}