"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

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

interface DailySale {
  date: string
  sale_id?: string
  total_revenue: number
  total_cost: number
  total_profit: number
  items_count: number
}

interface SalesPageClientProps {
  products: Product[]
  dailySales: DailySale[]
}

export function SalesPageClient({ products, dailySales }: SalesPageClientProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const handleEnterSales = (date: string) => {
    router.push(`/dashboard/sales/daily/${date}`)
  }

  const today = new Date().toISOString().split("T")[0]

  // Create a map of dates with sales for quick lookup
  const salesByDate = new Map<string, DailySale>()
  dailySales.forEach(sale => {
    salesByDate.set(sale.date, sale)
  })

  // Get all dates in the selected month
  const getDatesInMonth = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const dates: string[] = []
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month - 1, day)
      dates.push(date.toISOString().split("T")[0])
    }
    
    return dates
  }

  const datesInMonth = getDatesInMonth(selectedMonth)
  const [year, month] = selectedMonth.split('-').map(Number)
  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Date Picker Section */}
      <Card>
        <CardHeader>
          <CardTitle>Select Date to Enter Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="date"
              value={selectedDate || today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
            <Button 
              onClick={() => handleEnterSales(selectedDate || today)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Enter Sales for This Date
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Month Calendar View */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Calendar View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Month Selector */}
            <div className="flex items-center gap-4">
              <label htmlFor="month-select" className="text-sm font-medium">
                Select Month:
              </label>
              <Input
                id="month-select"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="max-w-xs"
              />
            </div>

            {/* Calendar Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4">{monthName}</h3>
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for days before month starts */}
                {(() => {
                  const firstDate = new Date(year, month - 1, 1)
                  const startDay = firstDate.getDay()
                  return Array.from({ length: startDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2"></div>
                  ))
                })()}

                {/* Date cells */}
                {datesInMonth.map((dateStr) => {
                  const date = new Date(dateStr)
                  const day = date.getDate()
                  const hasSale = salesByDate.has(dateStr)
                  const sale = salesByDate.get(dateStr)
                  const isToday = dateStr === today
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => handleEnterSales(dateStr)}
                      className={`
                        p-2 rounded-lg border-2 transition-all hover:scale-105
                        ${hasSale 
                          ? 'bg-green-50 border-green-300 hover:bg-green-100' 
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }
                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                      `}
                    >
                      <div className="text-center">
                        <div className={`font-semibold ${hasSale ? 'text-green-700' : 'text-gray-700'}`}>
                          {day}
                        </div>
                        {hasSale && sale && (
                          <div className="text-xs mt-1">
                            <div className="text-green-600 font-medium">₹{sale.total_revenue.toFixed(0)}</div>
                            <div className="text-gray-500">{sale.items_count} items</div>
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
              
              {/* Legend */}
              <div className="mt-4 flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded"></div>
                  <span>Date with sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded"></div>
                  <span>No sales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-50 border-2 border-blue-500 rounded ring-2 ring-blue-500"></div>
                  <span>Today</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Sales Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {dailySales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Products Sold</TableHead>
                  <TableHead className="text-right">Total Revenue</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Total Profit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailySales.map((sale) => (
                  <TableRow key={sale.date}>
                    <TableCell className="font-medium">
                      {new Date(sale.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sale.items_count} items</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{sale.total_revenue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{sale.total_cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold text-green-600">
                      ₹{sale.total_profit.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEnterSales(sale.date)}
                      >
                        View/Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No daily sales recorded yet. Select a date above to enter sales.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

