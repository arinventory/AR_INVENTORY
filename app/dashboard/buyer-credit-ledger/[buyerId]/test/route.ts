import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ buyerId: string }> }) {
  try {
    const resolvedParams = await params
    const rawBuyerId = resolvedParams.buyerId
    console.log("Raw buyerId received:", rawBuyerId)
    
    const buyerId = decodeURIComponent(rawBuyerId)
    console.log("Decoded buyerId:", buyerId)
    
    const supabase = await createClient()
    
    // Test database connection
    const { data: testConnection, error: connectionError } = await supabase
      .from("wholesale_buyers")
      .select("id")
      .limit(1)
    
    if (connectionError) {
      console.error("Database connection error:", connectionError)
      return NextResponse.json({ error: "Database connection failed", details: connectionError.message }, { status: 500 })
    }
    
    console.log("Database connection successful")
    
    // Check if buyer exists
    const { data: buyer, error: buyerError } = await supabase
      .from("wholesale_buyers")
      .select("id, name")
      .eq("id", buyerId)
      .single()
    
    if (buyerError) {
      console.error("Buyer fetch error:", buyerError)
      
      // List all buyers to see what's available
      const { data: allBuyers, error: allBuyersError } = await supabase
        .from("wholesale_buyers")
        .select("id, name")
      
      return NextResponse.json({ 
        error: "Buyer not found", 
        buyerId: buyerId,
        rawBuyerId: rawBuyerId,
        allBuyers: allBuyers,
        buyerError: buyerError.message 
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      message: "Buyer found successfully", 
      buyer: buyer,
      buyerId: buyerId,
      rawBuyerId: rawBuyerId
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Unexpected error", details: (error as Error).message }, { status: 500 })
  }
}