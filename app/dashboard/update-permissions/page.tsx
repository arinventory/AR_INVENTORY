"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function UpdatePermissionsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const updatePermissions = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/update-permissions", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Permission update failed")
      }

      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8">
          <h1 className="text-3xl font-bold mb-4">Update Database Permissions</h1>
          <p className="text-muted-foreground mb-6">
            Click the button below to add missing UPDATE and DELETE permissions for the payments table.
          </p>

          <Button onClick={updatePermissions} disabled={loading} size="lg" className="mb-6">
            {loading ? "Updating Permissions..." : "Update Permissions"}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800 font-semibold">Error:</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-semibold">✓ Success!</p>
              <p className="text-green-700 mt-2">{result.message}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}