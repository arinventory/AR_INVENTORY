import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { WholesaleProductsTable } from "@/components/wholesale-products-table"

export default async function WholesaleProductsPage() {
  const supabase = await createClient()
  const { data: products, error } = await supabase
    .from("wholesale_products")
    .select("*, suppliers(name)")
    .eq("deleted", false)
    .order("created_at", { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Wholesale Products</h1>
          <p className="text-muted-foreground mt-2">Manage products from suppliers</p>
        </div>
        <Link href="/dashboard/wholesale-products/new">
          <Button className="bg-blue-600 hover:bg-blue-700">+ Add Product</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Wholesale Products</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">Error loading products: {error.message}</div>
          ) : products && products.length > 0 ? (
            <WholesaleProductsTable products={products} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No products found.{" "}
              <Link href="/dashboard/wholesale-products/new" className="text-blue-600 hover:underline">
                Create one
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
