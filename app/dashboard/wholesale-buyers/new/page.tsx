import { WholesaleBuyerForm } from "@/components/wholesale-buyer-form"

export default function NewWholesaleBuyerPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Add New Buyer</h1>
        <p className="text-muted-foreground mt-2">Create a new wholesale buyer account</p>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <WholesaleBuyerForm />
      </div>
    </div>
  )
}

