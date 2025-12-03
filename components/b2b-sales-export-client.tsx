"use client"

import { Button } from "@/components/ui/button"
import { exportToExcel } from "@/lib/export-utils"

interface B2BSalesExportClientProps {
  data: any[]
}

export function B2BSalesExportClient({ data }: B2BSalesExportClientProps) {
  const handleExportExcel = async () => {
    await exportToExcel(data, "b2b-sales-report", "B2B Sales Report")
  }

  return (
    <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
      📊 Export to Excel
    </Button>
  )
}

