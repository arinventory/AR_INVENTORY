"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function EditPaymentButton({ paymentId }: { paymentId: string }) {
  return (
    <Link href={`/dashboard/payments/edit/${paymentId}`}>
      <Button variant="outline" size="sm">
        Edit
      </Button>
    </Link>
  )
}