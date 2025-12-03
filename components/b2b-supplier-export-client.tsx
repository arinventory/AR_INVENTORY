"use client"

import { Button } from "@/components/ui/button"
import { exportToExcel } from "@/lib/export-utils"

interface B2BSupplierExportClientProps {
  data: any[]
}

export function B2BSupplierExportClient({ data }: B2BSupplierExportClientProps) {
  const handleExportExcel = async () => {
    await exportToExcel(data, "b2b-supplier-report", "B2B Supplier Report")
  }

  return (
    <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
      📊 Export to Excel
    </Button>
  )
}

