"use client"

import { ExportButtons } from "@/components/export-buttons"

interface SalesExportClientProps {
  data: any[]
}

export function SalesExportClient({ data }: SalesExportClientProps) {
  const columns = ["Invoice Number", "Customer", "Sale Date", "Subtotal", "Tax", "Discount", "Total", "Status"]

  return <ExportButtons data={data} filename="sales-report" columns={columns} title="Sales Report" />
}
