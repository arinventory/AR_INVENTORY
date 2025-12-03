"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function DeleteSaleButton({ saleId }: { saleId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this sale? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // First, get sale items to restore stock before deleting
      const { data: saleItems, error: itemsFetchError } = await supabase
        .from("wholesale_sales_items")
        .select("product_id, quantity")
        .eq("sale_id", saleId)
      
      if (itemsFetchError) throw itemsFetchError
      
      // Restore stock for each product in the sale
      if (saleItems && saleItems.length > 0) {
        console.log("Restoring stock for deleted sale items...")
        for (const item of saleItems) {
          const productId = item.product_id
          const quantityToRestore = Number(item.quantity) || 0
          
          if (quantityToRestore > 0) {
            // Get current stock
            const { data: currentProduct, error: productError } = await supabase
              .from("wholesale_products")
              .select("quantity_in_stock")
              .eq("id", productId)
              .single()
            
            if (productError) {
              console.error(`Error fetching product ${productId}:`, productError)
              // Continue with other products even if one fails
              continue
            }
            
            if (currentProduct) {
              const currentStock = Number(currentProduct.quantity_in_stock) || 0
              const newStock = currentStock + quantityToRestore
              
              console.log(`Restoring stock for product ${productId}: ${currentStock} + ${quantityToRestore} = ${newStock}`)
              
              const { error: updateError } = await supabase
                .from("wholesale_products")
                .update({ quantity_in_stock: newStock })
                .eq("id", productId)
              
              if (updateError) {
                console.error(`Error restoring stock for product ${productId}:`, updateError)
                // Continue with other products
              } else {
                console.log(`✅ Successfully restored stock for product ${productId} to ${newStock}`)
              }
            }
          }
        }
      }
      
      // Delete related records in buyer_credit_ledger
      const { error: ledgerError } = await supabase
        .from("buyer_credit_ledger")
        .delete()
        .eq("reference_id", saleId)
        .eq("reference_type", "wholesale_sale")
      
      if (ledgerError) throw ledgerError
      
      // Then, delete related records in buyer_payments
      const { error: paymentError } = await supabase
        .from("buyer_payments")
        .delete()
        .eq("wholesale_sale_id", saleId)
      
      if (paymentError) throw paymentError
      
      // Finally, delete the sale itself (this will cascade delete sale items)
      const { error: saleError } = await supabase
        .from("wholesale_sales")
        .delete()
        .eq("id", saleId)

      if (saleError) throw saleError
      router.push("/dashboard/b2b-sales")
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete sale")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isLoading}>
      {isLoading ? "Deleting..." : "Delete"}
    </Button>
  )
}