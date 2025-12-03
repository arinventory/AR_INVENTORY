"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function DeleteRetailProductButton({ productId }: { productId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? It will be marked as deleted but sales records will be preserved.")) {
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // Soft delete the product by setting deleted flag to true
      const { error } = await supabase
        .from("retail_products")
        .update({ deleted: true })
        .eq("id", productId)

      if (error) {
        throw error
      }
      
      router.refresh()
    } catch (error) {
      console.error("Delete error:", error)
      alert(error instanceof Error ? error.message : "Failed to delete product")
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