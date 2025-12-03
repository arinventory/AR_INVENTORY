import { WholesaleProductForm } from "@/components/wholesale-product-form"

export default function NewProductPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Add New Wholesale Product</h1>
        <p className="text-muted-foreground mt-2">Create a new wholesale product</p>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <WholesaleProductForm />
      </div>
    </div>
  )
}
