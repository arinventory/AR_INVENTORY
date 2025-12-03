import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { CustomersTable } from "@/components/customers-table"

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: customers, error } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-2">Manage your B2C customers</p>
        </div>
        <Link href="/dashboard/customers/new">
          <Button className="bg-blue-600 hover:bg-blue-700">+ Add Customer</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">Error loading customers: {error.message}</div>
          ) : customers && customers.length > 0 ? (
            <CustomersTable customers={customers} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No customers found.{" "}
              <Link href="/dashboard/customers/new" className="text-blue-600 hover:underline">
                Create one
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
