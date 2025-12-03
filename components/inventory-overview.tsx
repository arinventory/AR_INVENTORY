"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export function InventoryOverview() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()

        const [wholesaleRes, retailRes] = await Promise.all([
          supabase.from("wholesale_products").select("name, quantity_in_stock").limit(10),
          supabase.from("retail_products").select("name, quantity_in_stock").limit(10),
        ])

        const chartData = [
          ...(wholesaleRes.data || []).map((p) => ({
            name: p.name.substring(0, 15),
            wholesale: p.quantity_in_stock,
            retail: 0,
          })),
          ...(retailRes.data || []).map((p) => ({
            name: p.name.substring(0, 15),
            wholesale: 0,
            retail: p.quantity_in_stock,
          })),
        ]

        setData(chartData)
      } catch (error) {
        console.error("Error fetching inventory data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return <div className="text-center py-8">Loading inventory data...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="wholesale" fill="#3b82f6" name="Wholesale Stock" />
        <Bar dataKey="retail" fill="#10b981" name="Retail Stock" />
      </BarChart>
    </ResponsiveContainer>
  )
}
