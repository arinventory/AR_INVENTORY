"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Order {
  id: string
  order_number: string
  order_date: string
  total_amount: number
  status: string
  suppliers: { name: string }
  purchase_order_items?: { quantity: number; wholesale_products: { name: string } }[]
}

export function PurchaseOrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "received":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const byText = !term
      ? orders
      : orders.filter((o) =>
          [o.order_number, o.suppliers?.name, o.status]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(term)),
        )

    const from = dateFrom ? new Date(dateFrom) : null
    const to = dateTo ? new Date(dateTo) : null
    return byText.filter((o) => {
      const d = new Date(o.order_date)
      if (from && d < from) return false
      if (to) {
        const end = new Date(to)
        end.setHours(23, 59, 59, 999)
        if (d > end) return false
      }
      return true
    })
  }, [search, dateFrom, dateTo, orders])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const rows = filtered.slice(start, start + pageSize)

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Search orders..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="md:max-w-sm"
        />
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">From</span>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="w-[150px]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">To</span>
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="w-[150px]" />
          </div>
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
            <SelectTrigger className="w-[100px] h-9"><SelectValue /></SelectTrigger>
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
            <TableHead>Order Number</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.order_number}</TableCell>
              <TableCell>{order.suppliers?.name || "-"}</TableCell>
              <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
              <TableCell>₹{order.total_amount.toFixed(2)}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </TableCell>
              <TableCell className="px-2 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/dashboard/purchase-orders/${order.id}`}>
                    <Button variant="outline" size="sm">View</Button>
                  </Link>
                  <Select
                    value={order.status}
                    onValueChange={async (value) => {
                      const supabase = createClient()
                      const { error } = await supabase
                        .from("purchase_orders")
                        .update({ status: value })
                        .eq("id", order.id)
                      if (!error) router.refresh()
                      else alert(error.message)
                    }}
                  >
                    <SelectTrigger className="w-[140px] h-9" aria-label="Change status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (!confirm("Delete this purchase order?")) return
                      const supabase = createClient()
                      const { error } = await supabase.from("purchase_orders").delete().eq("id", order.id)
                      if (!error) router.refresh()
                      else alert(error.message)
                    }}
                  >
                    Delete
                  </Button>
                </div>
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
