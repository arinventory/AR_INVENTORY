import { SupplierForm } from "@/components/supplier-form"

export default function NewSupplierPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Add New Supplier</h1>
        <p className="text-muted-foreground mt-2">Create a new supplier account</p>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <SupplierForm />
      </div>
    </div>
  )
}
