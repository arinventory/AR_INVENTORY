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

interface Buyer {
  id: string
  name: string
  phone?: string
  balance: number
}

interface CreditEntry {
  id: string
  customer_id: string
  transaction_type: string
  amount: number
  balance_after: number
  created_at: string
  description?: string
  reference_id?: string
  reference_type?: string
      wholesale_buyers?: { name: string; phone?: string }
}

interface WholesaleSale {
  id: string
  invoice_number: string
  sale_date: string
  total_amount: number
  customer_id: string
  customers?: { name: string }
}

interface BuyerPayment {
  id: string
  amount: number
  payment_date: string
  wholesale_sale_id?: string
  customer_id: string
  method: string
  reference_no?: string
  wholesale_sales?: { invoice_number: string }
}

export function BuyerCreditLedgerClient({
  buyers,
  creditLedger,
  wholesaleSales,
  buyerPayments,
  totalBalance,
}: {
  buyers: Buyer[]
  creditLedger: CreditEntry[]
  wholesaleSales: WholesaleSale[]
  buyerPayments: BuyerPayment[]
  totalBalance: number
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [balanceFilter, setBalanceFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("balance-desc")

  const handleBuyerClick = (buyerId: string) => {
    router.push(`/dashboard/buyer-credit-ledger/${buyerId}`)
  }

  // Group wholesale sales by buyer for filtering
  const salesByBuyer = useMemo(() => {
    const map = new Map<string, WholesaleSale[]>()
    wholesaleSales.forEach((sale) => {
      if (!map.has(sale.customer_id)) {
        map.set(sale.customer_id, [])
      }
      map.get(sale.customer_id)!.push(sale)
    })
    return map
  }, [wholesaleSales])

  // Filter and sort buyers
  const filteredBuyers = useMemo(() => {
    let filtered = [...buyers]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(query) ||
          b.phone?.toLowerCase().includes(query) ||
          b.id.toLowerCase().includes(query)
      )
    }

    // Balance filter
    if (balanceFilter === "with-balance") {
      filtered = filtered.filter((b) => b.balance > 0)
    } else if (balanceFilter === "no-balance") {
      filtered = filtered.filter((b) => b.balance === 0)
    } else if (balanceFilter === "high-balance") {
      filtered = filtered.filter((b) => b.balance > 50000)
    } else if (balanceFilter === "low-balance") {
      filtered = filtered.filter((b) => b.balance > 0 && b.balance <= 50000)
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
  }, [buyers, searchQuery, balanceFilter, sortBy])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Buyer Credit Details (Accounts Receivable)</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Bar */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search buyers by name, phone..."
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
              <SelectItem value="all">All Buyers</SelectItem>
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
          Showing {filteredBuyers.length} of {buyers.length} buyers
          {searchQuery && ` matching "${searchQuery}"`}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead className="text-right">Outstanding Balance</TableHead>
                <TableHead className="text-center">Invoices</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBuyers
                .filter((b) => b.balance > 0 || salesByBuyer.has(b.id))
                .map((buyer) => {
                  const buyerSales = salesByBuyer.get(buyer.id) || []

                  return (
                    <React.Fragment key={buyer.id}>
                      {/* Buyer Row */}
                      <TableRow
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleBuyerClick(buyer.id)}
                      >
                        <TableCell>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </TableCell>
                        <TableCell className="font-semibold">
                          <div>{buyer.name}</div>
                          {buyer.phone && (
                            <div className="text-sm text-muted-foreground">{buyer.phone}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-green-600">₹{buyer.balance.toFixed(2)}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{buyerSales.length}</Badge>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  )
                })}

              {filteredBuyers.filter((b) => b.balance > 0 || salesByBuyer.has(b.id)).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {searchQuery || balanceFilter !== "all"
                      ? "No buyers match your search criteria."
                      : "No buyers with outstanding balances."}
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

