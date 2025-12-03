"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Purchase {
  total_amount: number
  order_date: string
}

export function PurchaseReport({ purchases }: { purchases: Purchase[] }) {
  const chartData = purchases
    .reduce(
      (acc, purchase) => {
        const date = new Date(purchase.order_date).toLocaleDateString()
        const existing = acc.find((item) => item.date === date)
        if (existing) {
          existing.amount += purchase.total_amount
        } else {
          acc.push({ date, amount: purchase.total_amount })
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
        <Line type="monotone" dataKey="amount" stroke="#10b981" name="Purchase Amount" />
      </LineChart>
    </ResponsiveContainer>
  )
}
