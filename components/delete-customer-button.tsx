"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function DeleteCustomerButton({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this customer?")) {
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("customers").delete().eq("id", customerId)

      if (error) throw error
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete customer")
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
