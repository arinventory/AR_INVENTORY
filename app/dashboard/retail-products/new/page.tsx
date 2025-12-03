import { RetailProductForm } from "@/components/retail-product-form"

export default function NewRetailProductPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Add New Retail Product</h1>
        <p className="text-muted-foreground mt-2">Create a new retail product</p>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <RetailProductForm />
      </div>
    </div>
  )
}
