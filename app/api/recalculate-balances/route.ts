import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    )
    
    // Get all suppliers
    const { data: suppliers } = await supabase
      .from("suppliers")
      .select("id")
    
    if (!suppliers) {
      return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 })
    }
    
    let results = []
    
    for (const supplier of suppliers) {
      // Get all credit ledger entries for this supplier ordered by creation date
      const { data: entries, error } = await supabase
        .from("credit_ledger")
        .select("id, transaction_type, amount")
        .eq("supplier_id", supplier.id)
        .order("created_at", { ascending: true })
      
      if (error) {
        results.push({
          supplierId: supplier.id,
          status: "error",
          message: error.message
        })
        continue
      }
      
      // Recalculate balances
      let runningBalance = 0
      let updatedCount = 0
      
      for (const entry of entries || []) {
        if (entry.transaction_type === "credit") {
          runningBalance += Number(entry.amount || 0)
        } else if (entry.transaction_type === "debit") {
          runningBalance -= Number(entry.amount || 0)
        }
        
        // Update the balance_after field
        const { error: updateError } = await supabase
          .from("credit_ledger")
          .update({ balance_after: runningBalance })
          .eq("id", entry.id)
        
        if (!updateError) {
          updatedCount++
        }
      }
      
      results.push({
        supplierId: supplier.id,
        status: "success",
        message: `Updated ${updatedCount} entries`,
        finalBalance: runningBalance
      })
    }
    
    return NextResponse.json({ 
      message: "Balances recalculated successfully", 
      results 
    })
  } catch (error: any) {
    console.error("Error recalculating balances:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}