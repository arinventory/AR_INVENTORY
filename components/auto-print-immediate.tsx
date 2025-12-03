"use client"

import { useEffect } from "react"

export function AutoPrintImmediate() {
  useEffect(() => {
    // Auto-print immediately when component mounts (when print page loads)
    // Use requestAnimationFrame to ensure DOM is ready, then print
    const printAfterRender = () => {
      // Double check content is visible
      const printContent = document.querySelector('.print-content')
      if (printContent && printContent.offsetHeight > 0) {
        // Small delay to ensure browser has rendered everything
        setTimeout(() => {
          window.print()
        }, 300)
      } else {
        // If content not ready, try again
        requestAnimationFrame(printAfterRender)
      }
    }
    
    // Start checking after a brief initial delay
    setTimeout(() => {
      requestAnimationFrame(printAfterRender)
    }, 100)
  }, [])

  return null
}

