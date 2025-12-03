"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface LowStockItem {
  id: string
  name: string
  sku: string
  quantity_in_stock: number
  reorder_level: number
}

export function LowStockAlert({ items }: { items: LowStockItem[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Current Stock</TableHead>
            <TableHead>Reorder Level</TableHead>
            <TableHead>Shortage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="bg-red-100">
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.sku}</TableCell>
              <TableCell className="text-red-600 font-semibold">{item.quantity_in_stock}</TableCell>
              <TableCell>{item.reorder_level}</TableCell>
              <TableCell className="text-red-600 font-bold">
                {item.reorder_level - item.quantity_in_stock} units
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
