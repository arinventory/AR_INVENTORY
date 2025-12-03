"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function DeletePurchaseOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this purchase order? This action cannot be undone.")) {
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("purchase_orders").delete().eq("id", orderId)

      if (error) throw error
      router.push("/dashboard/purchase-orders")
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete purchase order")
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








