"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

export function AutoPrintOnQuery({ param = "auto" }: { param?: string }) {
  const params = useSearchParams()

  useEffect(() => {
    const shouldPrint = params.get(param)
    // Auto-print if query param is present, or if it's a print page (always auto-print)
    if (typeof window !== "undefined") {
      if (shouldPrint === "1" || shouldPrint === "true" || window.location.pathname.includes("/print")) {
        // Delay slightly to ensure page is fully rendered
        const timer = setTimeout(() => {
          window.print()
        }, 500)
        
        return () => clearTimeout(timer)
      }
    }
  }, [params, param])

  return null
}


