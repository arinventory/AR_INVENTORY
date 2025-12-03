"use client"

import { Button } from "@/components/ui/button"
import { exportToExcel } from "@/lib/export-utils"

interface B2CSalesExportClientProps {
  data: any[]
}

export function B2CSalesExportClient({ data }: B2CSalesExportClientProps) {
  const handleExportExcel = async () => {
    await exportToExcel(data, "b2c-sales-report", "B2C Sales Report")
  }

  return (
    <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
      📊 Export to Excel
    </Button>
  )
}

