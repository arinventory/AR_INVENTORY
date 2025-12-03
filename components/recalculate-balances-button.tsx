"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function RecalculateBalancesButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleRecalculate = async () => {
    setIsLoading(true)
    setResult(null)
    
    try {
      const response = await fetch("/api/recalculate-balances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({ success: false, message: data.error || "Failed to recalculate balances" })
      }
    } catch (error) {
      setResult({ success: false, message: "Network error occurred" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleRecalculate} 
        disabled={isLoading}
        variant="outline"
      >
        {isLoading ? "Recalculating..." : "Recalculate All Balances"}
      </Button>
      
      {result && (
        <div className={`p-3 rounded text-sm ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.message}
        </div>
      )}
    </div>
  )
}