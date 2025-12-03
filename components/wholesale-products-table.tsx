"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DeleteProductButton } from "@/components/delete-product-button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useMemo, useState } from "react"

interface Product {
  id: string
  name: string
  sku: string
  cost_price: number
  expenses: number
  gst_amount: number
  wholesale_price: number
  quantity_in_stock: number
  suppliers: { name: string }
}

export function WholesaleProductsTable({ products }: { products: Product[] }) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [supplierFilter, setSupplierFilter] = useState("__all__")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [stockFilter, setStockFilter] = useState("__all__")

  // Get unique suppliers for the filter dropdown
  const suppliers = useMemo(() => {
    const uniqueSuppliers = new Set<string>()
    products.forEach(product => {
      if (product.suppliers?.name) {
        uniqueSuppliers.add(product.suppliers.name)
      }
    })
    return Array.from(uniqueSuppliers).sort()
  }, [products])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return products.filter((p) => {
      // Text search filter
      if (term && ![p.name, p.sku, p.suppliers?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))) {
        return false
      }

      // Supplier filter
      if (supplierFilter && supplierFilter !== "__all__" && p.suppliers?.name !== supplierFilter) {
        return false
      }

      // Price range filters
      const totalPrice = p.cost_price + (p.expenses || 0) + (p.gst_amount || 0)
      if (minPrice && minPrice.trim() !== "") {
        const min = parseFloat(minPrice)
        if (!isNaN(min) && totalPrice < min) {
          return false
        }
      }
      if (maxPrice && maxPrice.trim() !== "") {
        const max = parseFloat(maxPrice)
        if (!isNaN(max) && totalPrice > max) {
          return false
        }
      }

      // Stock filter
      if (stockFilter && stockFilter !== "__all__") {
        const stock = p.quantity_in_stock || 0
        switch (stockFilter) {
          case "out":
            if (stock > 0) return false
            break
          case "low":
            if (stock === 0 || stock > 10) return false
            break
          case "normal":
            if (stock <= 10) return false
            break
        }
      }

      return true
    })
  }, [search, products, supplierFilter, minPrice, maxPrice, stockFilter])

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

      {/* Advanced Filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        {/* Supplier Filter */}
        <div>
          <Label htmlFor="supplier-filter" className="text-sm font-medium">Supplier</Label>
          <Select value={supplierFilter} onValueChange={(value) => { setSupplierFilter(value); setPage(1) }}>
            <SelectTrigger id="supplier-filter">
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Suppliers</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Min Price Filter */}
        <div>
          <Label htmlFor="min-price" className="text-sm font-medium">Min Price (₹)</Label>
          <Input
            id="min-price"
            type="number"
            placeholder="0"
            value={minPrice}
            onChange={(e) => { setMinPrice(e.target.value); setPage(1) }}
          />
        </div>

        {/* Max Price Filter */}
        <div>
          <Label htmlFor="max-price" className="text-sm font-medium">Max Price (₹)</Label>
          <Input
            id="max-price"
            type="number"
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1) }}
          />
        </div>

        {/* Stock Filter */}
        <div>
          <Label htmlFor="stock-filter" className="text-sm font-medium">Stock Status</Label>
          <Select value={stockFilter} onValueChange={(value) => { setStockFilter(value); setPage(1) }}>
            <SelectTrigger id="stock-filter">
              <SelectValue placeholder="All Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Stock</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
              <SelectItem value="low">Low Stock (&lt;=10)</SelectItem>
              <SelectItem value="normal">Normal Stock (&gt;10)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Cost Price</TableHead>
            <TableHead>Expenses</TableHead>
            <TableHead>Total Cost (with GST)</TableHead>
            <TableHead>Wholesale Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((product) => {
            const expenses = product.expenses || 0
            const gstAmountValue = product.gst_amount || 0
            const totalCostBeforeGST = product.cost_price + expenses
            const totalCostWithGST = totalCostBeforeGST + gstAmountValue
            
            return (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.sku}</TableCell>
                <TableCell>{product.suppliers?.name || "-"}</TableCell>
                <TableCell>₹{product.cost_price.toFixed(2)}</TableCell>
                <TableCell>₹{expenses.toFixed(2)}</TableCell>
                <TableCell>
                  <div className="font-medium">₹{totalCostWithGST.toFixed(2)}</div>
                  {gstAmountValue > 0 && (
                    <div className="text-xs text-muted-foreground">
                      +₹{gstAmountValue.toFixed(2)} GST
                    </div>
                  )}
                </TableCell>
                <TableCell>₹{product.wholesale_price.toFixed(2)}</TableCell>
                <TableCell>{product.quantity_in_stock}</TableCell>
                <TableCell className="space-x-2">
                  <Link href={`/dashboard/wholesale-products/${product.id}`}>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </Link>
                  <DeleteProductButton productId={product.id} />
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
