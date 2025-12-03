import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InventoryOverview } from "@/components/inventory-overview"
import { LowStockAlert } from "@/components/low-stock-alert"

export default async function InventoryPage() {
  const supabase = await createClient()

  const [wholesaleRes, retailRes, lowWholesaleRes, lowRetailRes] = await Promise.all([
    supabase.from("wholesale_products").select("quantity_in_stock"),
    supabase.from("retail_products").select("quantity_in_stock"),
    supabase
      .from("wholesale_products")
      .select("id, name, sku, quantity_in_stock, reorder_level")
      .lt("quantity_in_stock", "reorder_level"),
    supabase
      .from("retail_products")
      .select("id, name, sku, quantity_in_stock, reorder_level")
      .lt("quantity_in_stock", "reorder_level"),
  ])

  const wholesaleTotal = wholesaleRes.data?.reduce((sum, p) => sum + (p.quantity_in_stock || 0), 0) || 0
  const retailTotal = retailRes.data?.reduce((sum, p) => sum + (p.quantity_in_stock || 0), 0) || 0
  const lowStockItems = [...(lowWholesaleRes.data || []), ...(lowRetailRes.data || [])]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Inventory Management</h1>
        <p className="text-muted-foreground mt-2">Track stock levels and manage inventory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wholesale Stock</CardTitle>
            <span className="text-2xl">📦</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wholesaleTotal}</div>
            <p className="text-xs text-muted-foreground">Total units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retail Stock</CardTitle>
            <span className="text-2xl">🛍️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{retailTotal}</div>
            <p className="text-xs text-muted-foreground">Total units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <LowStockAlert items={lowStockItems} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Inventory Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <InventoryOverview />
        </CardContent>
      </Card>
    </div>
  )
}
