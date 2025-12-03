"use client"

import { ExportButtons } from "@/components/export-buttons"

interface PurchaseExportClientProps {
  data: any[]
}

export function PurchaseExportClient({ data }: PurchaseExportClientProps) {
  const columns = ["Order Number", "Supplier", "Order Date", "Expected Delivery", "Total Amount", "Status"]

  return <ExportButtons data={data} filename="purchase-report" columns={columns} title="Purchase Report" />
}
