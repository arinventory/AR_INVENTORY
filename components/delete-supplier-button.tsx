"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function DeleteSupplierButton({ supplierId }: { supplierId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this supplier? All associated products will be marked as deleted, but sales records will be preserved.")) {
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      
      // Soft delete the supplier and all associated products
      // First, soft delete all products associated with this supplier
      const { error: productsError } = await supabase
        .from("wholesale_products")
        .update({ deleted: true })
        .eq("supplier_id", supplierId)

      if (productsError) throw productsError

      // Then, soft delete the supplier itself
      const { error: supplierError } = await supabase
        .from("suppliers")
        .update({ deleted: true })
        .eq("id", supplierId)

      if (supplierError) throw supplierError
      
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete supplier")
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