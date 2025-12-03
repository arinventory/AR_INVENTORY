import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
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

    // Fetch all suppliers
    const { data: suppliers } = await supabase
      .from("suppliers")
      .select("id, name")
      .order("name")

    // Fetch all credit ledger entries
    const { data: creditLedger } = await supabase
      .from("credit_ledger")
      .select("*")
      .order("created_at", { ascending: true })

    // Calculate balances for each supplier (same as main credit ledger page)
    const supplierBalancesMain = new Map<string, { name: string, balance: number }>()
    
    if (suppliers) {
      suppliers.forEach((supplier) => {
        supplierBalancesMain.set(supplier.id, { balance: 0, name: supplier.name })
      })
    }

    if (creditLedger) {
      // Process entries in chronological order (same as main credit ledger page)
      const sortedEntries = [...creditLedger].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      
      sortedEntries.forEach((entry) => {
        const current = supplierBalancesMain.get(entry.supplier_id)
        if (current) {
          let newBalance = current.balance
          if (entry.transaction_type === "credit") {
            newBalance += Number(entry.amount || 0)
          } else if (entry.transaction_type === "debit") {
            newBalance -= Number(entry.amount || 0)
          }
          
          supplierBalancesMain.set(entry.supplier_id, {
            ...current,
            balance: newBalance
          })
        }
      })
    }
    
    // Calculate total balance (same as main credit ledger page)
    const totalBalanceMain = Array.from(supplierBalancesMain.values()).reduce((sum, item) => sum + item.balance, 0)

    // Calculate individual supplier balances (same as supplier credit ledger page)
    const supplierDetails = []
    if (suppliers) {
      for (const supplier of suppliers) {
        // Fetch credit ledger entries for this supplier (same as supplier page)
        const { data: supplierEntries } = await supabase
          .from("credit_ledger")
          .select("*")
          .eq("supplier_id", supplier.id)
          .order("created_at", { ascending: true })

        // Calculate balance for this supplier (same as supplier page)
        let supplierBalance = 0
        if (supplierEntries && supplierEntries.length > 0) {
          supplierEntries.forEach(entry => {
            if (entry.transaction_type === "credit") {
              supplierBalance += Number(entry.amount || 0)
            } else if (entry.transaction_type === "debit") {
              supplierBalance -= Number(entry.amount || 0)
            }
          })
        }

        supplierDetails.push({
          id: supplier.id,
          name: supplier.name,
          mainBalance: supplierBalancesMain.get(supplier.id)?.balance || 0,
          individualBalance: supplierBalance,
          difference: Math.abs((supplierBalancesMain.get(supplier.id)?.balance || 0) - supplierBalance),
          entriesCount: supplierEntries?.length || 0
        })
      }
    }

    // Identify discrepancies
    const discrepancies = supplierDetails.filter(s => s.difference > 0.01)
    const totalDiscrepancy = discrepancies.reduce((sum, s) => sum + s.difference, 0)

    return NextResponse.json({
      summary: {
        totalSuppliers: suppliers?.length || 0,
        totalTransactions: creditLedger?.length || 0,
        mainLedgerTotal: totalBalanceMain,
        sumOfIndividual: supplierDetails.reduce((sum, s) => sum + s.individualBalance, 0),
        totalDiscrepancy,
        suppliersWithIssues: discrepancies.length
      },
      discrepancies,
      allSuppliers: supplierDetails
    })
  } catch (error: any) {
    console.error("Error diagnosing balances:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}