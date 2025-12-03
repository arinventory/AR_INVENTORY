import { CustomerForm } from "@/components/customer-form"

export default function NewCustomerPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Add New Customer</h1>
        <p className="text-muted-foreground mt-2">Create a new customer account</p>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <CustomerForm />
      </div>
    </div>
  )
}
