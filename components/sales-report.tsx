"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Sale {
  total_amount: number
  sale_date: string
}

export function SalesReport({ sales }: { sales: Sale[] }) {
  const chartData = sales
    .reduce(
      (acc, sale) => {
        const date = new Date(sale.sale_date).toLocaleDateString()
        const existing = acc.find((item) => item.date === date)
        if (existing) {
          existing.amount += sale.total_amount
        } else {
          acc.push({ date, amount: sale.total_amount })
        }
        return acc
      },
      [] as { date: string; amount: number }[],
    )
    .reverse()

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
        <Legend />
        <Line type="monotone" dataKey="amount" stroke="#3b82f6" name="Sales Amount" />
      </LineChart>
    </ResponsiveContainer>
  )
}
