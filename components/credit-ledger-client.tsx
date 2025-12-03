"use client"

import React, { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ChevronRight, Search, X } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Supplier {
  id: string
  name: string
  email?: string
  balance: number
}

interface CreditEntry {
  id: string
  supplier_id: string
  transaction_type: string
  amount: number
  balance_after: number
  created_at: string
  description?: string
  reference_id?: string
  reference_type?: string
  suppliers?: { name: string; email?: string }
}

interface PurchaseOrder {
  id: string
  order_number: string
  order_date: string
  total_amount: number
  supplier_id: string
  suppliers?: { name: string }
}

interface Payment {
  id: string
  amount: number
  payment_date: string
  purchase_order_id?: string
  supplier_id: string
  method: string
  reference_no?: string
  purchase_orders?: { order_number: string }
}

export function CreditLedgerClient({
  suppliers,
  creditLedger,
  purchaseOrders,
  payments,
  totalBalance,
}: {
  suppliers: Supplier[]
  creditLedger: CreditEntry[]
  purchaseOrders: PurchaseOrder[]
  payments: Payment[]
  totalBalance: number
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [balanceFilter, setBalanceFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("balance-desc")

  const handleSupplierClick = (supplierId: string) => {
    router.push(`/dashboard/credit-ledger/${supplierId}`)
  }

  // Group purchase orders by supplier for filtering
  const ordersBySupplier = useMemo(() => {
    const map = new Map<string, PurchaseOrder[]>()
    purchaseOrders.forEach((order) => {
      if (!map.has(order.supplier_id)) {
        map.set(order.supplier_id, [])
      }
      map.get(order.supplier_id)!.push(order)
    })
    return map
  }, [purchaseOrders])

  // Filter and sort suppliers
  const filteredSuppliers = useMemo(() => {
    let filtered = [...suppliers]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.id.toLowerCase().includes(query)
      )
    }

    // Balance filter
    if (balanceFilter === "with-balance") {
      filtered = filtered.filter((s) => s.balance > 0)
    } else if (balanceFilter === "no-balance") {
      filtered = filtered.filter((s) => s.balance === 0)
    } else if (balanceFilter === "high-balance") {
      filtered = filtered.filter((s) => s.balance > 50000)
    } else if (balanceFilter === "low-balance") {
      filtered = filtered.filter((s) => s.balance > 0 && s.balance <= 50000)
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "balance-desc") {
        return b.balance - a.balance
      } else if (sortBy === "balance-asc") {
        return a.balance - b.balance
      } else if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name)
      }
      return 0
    })

    return filtered
  }, [suppliers, searchQuery, balanceFilter, sortBy])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Supplier Credit Details</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Bar */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search suppliers by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Select value={balanceFilter} onValueChange={setBalanceFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by balance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              <SelectItem value="with-balance">With Balance</SelectItem>
              <SelectItem value="no-balance">No Balance</SelectItem>
              <SelectItem value="high-balance">High Balance (&gt;₹50k)</SelectItem>
              <SelectItem value="low-balance">Low Balance (≤₹50k)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="balance-desc">Balance: High to Low</SelectItem>
              <SelectItem value="balance-asc">Balance: Low to High</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <div className="mb-3 text-sm text-muted-foreground">
          Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Outstanding Balance</TableHead>
                <TableHead className="text-center">Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers
                .filter((s) => s.balance > 0 || ordersBySupplier.has(s.id))
                .map((supplier) => {
                  const supplierOrders = ordersBySupplier.get(supplier.id) || []

                  return (
                    <React.Fragment key={supplier.id}>
                      {/* Supplier Row */}
                      <TableRow
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSupplierClick(supplier.id)}
                      >
                        <TableCell>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </TableCell>
                        <TableCell className="font-semibold">{supplier.name}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-red-600">₹{supplier.balance.toFixed(2)}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{supplierOrders.length}</Badge>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )
                })}

              {filteredSuppliers.filter((s) => s.balance > 0 || ordersBySupplier.has(s.id)).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchQuery || balanceFilter !== "all"
                      ? "No suppliers match your search criteria."
                      : "No suppliers with outstanding balances."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

