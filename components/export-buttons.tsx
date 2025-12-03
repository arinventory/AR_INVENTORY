"use client"

import { Button } from "@/components/ui/button"
import { exportToCSV, exportToJSON, generatePDFContent, downloadPDF } from "@/lib/export-utils"

interface ExportButtonsProps {
  data: any[]
  filename: string
  columns?: string[]
  title?: string
}

export function ExportButtons({ data, filename, columns, title }: ExportButtonsProps) {
  const handleExportCSV = () => {
    exportToCSV(data, filename)
  }

  const handleExportJSON = () => {
    exportToJSON(data, filename)
  }

  const handleExportPDF = () => {
    const cols = columns || Object.keys(data[0] || {})
    const pdfTitle = title || filename
    const htmlContent = generatePDFContent(pdfTitle, data, cols)
    downloadPDF(htmlContent, filename)
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleExportCSV}>
        📥 Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportJSON}>
        📥 Export JSON
      </Button>
      <Button variant="outline" size="sm" onClick={handleExportPDF}>
        📄 Export PDF
      </Button>
    </div>
  )
}
