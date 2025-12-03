import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { WholesaleBuyersTable } from "@/components/wholesale-buyers-table"

export default async function WholesaleBuyersPage() {
  const supabase = await createClient()
  const { data: buyers, error } = await supabase
    .from("wholesale_buyers")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Wholesale Buyers</h1>
          <p className="text-muted-foreground mt-2">Manage your B2B buyers</p>
        </div>
        <Link href="/dashboard/wholesale-buyers/new">
          <Button className="bg-blue-600 hover:bg-blue-700">+ Add Buyer</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Buyers</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">Error loading buyers: {error.message}</div>
          ) : buyers && buyers.length > 0 ? (
            <WholesaleBuyersTable buyers={buyers} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No buyers found.{" "}
              <Link href="/dashboard/wholesale-buyers/new" className="text-blue-600 hover:underline">
                Create one
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

