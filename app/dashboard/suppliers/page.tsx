import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { SuppliersTable } from "@/components/suppliers-table"

export default async function SuppliersPage() {
  const supabase = await createClient()
  const { data: suppliers, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("deleted", false)
    .order("created_at", { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Suppliers</h1>
          <p className="text-muted-foreground mt-2">Manage your B2B suppliers</p>
        </div>
        <Link href="/dashboard/suppliers/new">
          <Button className="bg-blue-600 hover:bg-blue-700">+ Add Supplier</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Suppliers</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">Error loading suppliers: {error.message}</div>
          ) : suppliers && suppliers.length > 0 ? (
            <SuppliersTable suppliers={suppliers} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No suppliers found.{" "}
              <Link href="/dashboard/suppliers/new" className="text-blue-600 hover:underline">
                Create one
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}