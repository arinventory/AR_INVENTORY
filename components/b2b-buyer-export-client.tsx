"use client"

import { Button } from "@/components/ui/button"
import { exportToExcel } from "@/lib/export-utils"

interface B2BBuyerExportClientProps {
  data: any[]
}

export function B2BBuyerExportClient({ data }: B2BBuyerExportClientProps) {
  const handleExportExcel = async () => {
    await exportToExcel(data, "b2b-buyer-report", "B2B Buyer Report")
  }

  return (
    <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
      📊 Export to Excel
    </Button>
  )
}

