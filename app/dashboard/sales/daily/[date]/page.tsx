import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DailySalesForm } from "@/components/daily-sales-form"

export default async function DailySalesEntryPage({ 
  params 
}: { 
  params: Promise<{ date: string }> 
}) {
  const { date } = await params
  
  // Validate date format
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    notFound()
  }

  const supabase = await createClient()
  
  // Fetch products
  const { data: products } = await supabase
    .from("retail_products")
    .select("id, name, size, product_type, cost_price, expenses, retail_price, quantity_in_stock")
    .order("product_type, name")

  // Check if there's an existing sale for this date
  // First, find the "Daily Sales" customer
  const { data: dailySalesCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("name", "Daily Sales")
    .eq("customer_type", "retail")
    .maybeSingle()

  // Then find existing sale for this date with Daily Sales customer
  // If Daily Sales customer doesn't exist yet, look for sales with invoice_number starting with "DAILY-"
  let existingSale = null
  if (dailySalesCustomer?.id) {
    const { data: sale } = await supabase
      .from("sales")
      .select("id")
      .eq("sale_date", date)
      .eq("customer_id", dailySalesCustomer.id)
      .maybeSingle()
    existingSale = sale
  } else {
    // Fallback: look for daily sales by invoice number pattern
    const { data: sales } = await supabase
      .from("sales")
      .select("id")
      .eq("sale_date", date)
      .like("invoice_number", "DAILY-%")
      .limit(1)
    existingSale = sales?.[0] || null
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Daily Sales Entry</h1>
          <p className="text-muted-foreground mt-2">
            {new Date(date).toLocaleDateString("en-US", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
        </div>
        <Link href="/dashboard/sales">
          <Button variant="outline">← Back to Sales</Button>
        </Link>
      </div>

      <div className="w-full max-w-6xl mx-auto">
        <DailySalesForm
          selectedDate={date}
          products={products || []}
          existingSaleId={existingSale?.id}
        />
      </div>
    </div>
  )
}

