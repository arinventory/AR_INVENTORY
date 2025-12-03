"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteRetailProductButton } from "@/components/delete-retail-product-button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useMemo, useState } from "react"

interface Product {
  id: string
  name: string
  size: string
  product_type: string
  cost_price: number
  retail_price: number
  quantity_in_stock: number
  expenses?: number
}

export function RetailProductsTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return products
    return products.filter((p) =>
      [p.name, p.size, p.product_type]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    )
  }, [search, products])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const rows = filtered.slice(start, start + pageSize)

  return (
    <div className="overflow-x-auto">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="Search products..."
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
            <TableHead>Product Type</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Cost Price</TableHead>
            <TableHead>Total Cost</TableHead>
            <TableHead>Retail Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Margin</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((product) => {
            const totalCost = (product.cost_price || 0) + (product.expenses || 0)
            const margin = (((product.retail_price - totalCost) / product.retail_price) * 100).toFixed(1)
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.product_type || "-"}</TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.size}</TableCell>
                <TableCell>₹{product.cost_price.toFixed(2)}</TableCell>
                <TableCell>₹{totalCost.toFixed(2)}</TableCell>
                <TableCell>₹{product.retail_price.toFixed(2)}</TableCell>
                <TableCell>{product.quantity_in_stock}</TableCell>
                <TableCell>{margin}%</TableCell>
                <TableCell className="space-x-2">
                  <Link href={`/dashboard/retail-products/${product.id}`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <DeleteRetailProductButton productId={product.id} />
                </TableCell>
              </TableRow>
            )
          })}
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
