"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMemo, useState } from "react"

interface Sale {
  id: string
  invoice_number: string
  sale_date: string
  total_amount: number
  payment_status: string
  customers: { name: string }
}

export function SalesTable({ sales }: { sales: Sale[] }) {
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "partial":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return sales
    return sales.filter((s) =>
      [s.invoice_number, s.customers?.name, s.payment_status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    )
  }, [search, sales])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const rows = filtered.slice(start, start + pageSize)

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Search sales..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="md:max-w-sm"
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice Number</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Sale Date</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Payment Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium">{sale.invoice_number}</TableCell>
              <TableCell>{sale.customers?.name || "-"}</TableCell>
              <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
              <TableCell>₹{sale.total_amount.toFixed(2)}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(sale.payment_status)}`}>
                  {sale.payment_status}
                </span>
              </TableCell>
              <TableCell>
                <Link href={`/dashboard/sales/${sale.id}`}>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between py-3 text-sm text-muted-foreground">
        <div>
          Showing {filtered.length === 0 ? 0 : start + 1}-{Math.min(start + pageSize, filtered.length)} of {filtered.length}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}>
            Previous
          </Button>
          <div className="px-2">Page {currentPage} of {totalPages}</div>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
