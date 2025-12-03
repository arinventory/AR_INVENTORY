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
      const { error } = await supabase.from("sales").delete().eq("id", saleId)

      if (error) throw error
      router.push("/dashboard/sales")
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














