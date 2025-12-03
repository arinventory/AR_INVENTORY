"use client"

import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"

export function PrintButton({ printUrl }: { printUrl?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  
  const handlePrint = () => {
    // If printUrl is provided, use it; otherwise use current path + /print
    const href = printUrl || `${pathname}/print`
    console.log("Print button clicked, href:", href);
    
    // Open print page in new window - it will auto-print when loaded
    const printWindow = window.open(href, '_blank', 'width=800,height=600')
    
    // If popup is blocked or fails, try navigating in current window
    if (!printWindow) {
      console.log("Popup blocked, trying same window navigation");
      // Try to open in same window
      window.location.href = href
    }
  }
  
  return (
    <Button variant="outline" onClick={handlePrint}>
      Print
    </Button>
  )
}


