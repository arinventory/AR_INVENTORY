import { RecordBuyerPaymentForm } from "@/components/record-buyer-payment-form"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function NewBuyerPaymentPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/dashboard/buyer-payments">
            <Button variant="outline" size="sm">
              ← Back to Buyer Payments
            </Button>
          </Link>
        </div>
        <h1 className="text-4xl font-bold text-foreground">Record Buyer Payment</h1>
        <p className="text-muted-foreground mt-2">Record a payment received from a buyer and update credit ledger</p>
      </div>
      <div className="w-full max-w-6xl mx-auto">
        <RecordBuyerPaymentForm />
      </div>
    </div>
  )
}

