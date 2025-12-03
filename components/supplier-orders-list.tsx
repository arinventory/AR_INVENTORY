"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface PurchaseOrder {
  id: string
  order_number: string
  order_date: string
  total_amount: number
  status: string
}

interface Payment {
  id: string
  amount: number
  payment_date: string
  purchase_order_id?: string
  method: string
  reference_no?: string
}

interface CreditEntry {
  id: string
  transaction_type: string
  amount: number
  balance_after: number
  created_at: string
  description?: string
  reference_id?: string
  reference_type?: string
}

// Helper function to format dates consistently
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB'); // Use en-GB for DD/MM/YYYY format
};

// Helper function to format date and time consistently
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString('en-GB')} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })}`;
};

export function SupplierOrdersList({
  orders,
  payments,
  creditLedger,
}: {
  orders: PurchaseOrder[]
  payments: Payment[]
  creditLedger: CreditEntry[]
}) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Get all transactions for a specific order
  const getOrderTransactions = (orderId: string) => {
    // Get credit transaction from purchase order
    const poCredit = creditLedger.filter(
      (entry) => entry.reference_type === 'purchase_order' && entry.reference_id === orderId && entry.transaction_type === 'credit'
    )
    
    // Get debit transactions from payments linked to this order
    const orderPayments = payments.filter(p => p.purchase_order_id === orderId)
    const paymentIds = orderPayments.map(p => p.id)
    const paymentDebits = creditLedger.filter(
      (entry) => entry.reference_type === 'payment' && entry.reference_id && paymentIds.includes(entry.reference_id) && entry.transaction_type === 'debit'
    )
    
    // Combine and sort chronologically
    return [...poCredit, ...paymentDebits].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  // Get payments for a specific order
  const getOrderPayments = (orderId: string) => {
    return payments.filter(p => p.purchase_order_id === orderId)
  }

  const selectedOrder = orders.find(o => o.id === selectedOrderId)
  const selectedOrderTransactions = selectedOrderId ? getOrderTransactions(selectedOrderId) : []
  const selectedOrderPayments = selectedOrderId ? getOrderPayments(selectedOrderId) : []
  const totalPaid = selectedOrderPayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const outstanding = selectedOrder ? Number(selectedOrder.total_amount) - totalPaid : 0

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Order Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const orderPayments = getOrderPayments(order.id)
                    const paid = orderPayments.reduce((sum, p) => sum + Number(p.amount), 0)
                    const orderOutstanding = Number(order.total_amount) - paid

                    return (
                      <TableRow key={order.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{formatDate(order.order_date)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{Number(order.total_amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          ₹{paid.toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${orderOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{orderOutstanding.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={order.status === 'received' ? 'default' : 'outline'}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrderId(order.id)}
                          >
                            View Transactions
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No purchase orders found for this supplier.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      <Dialog open={selectedOrderId !== null} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Transactions for {selectedOrder?.order_number}
            </DialogTitle>
            <DialogDescription>
              All credit and debit transactions for this purchase order
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Order Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Order Amount</div>
                  <div className="text-lg font-semibold">₹{Number(selectedOrder.total_amount).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Paid</div>
                  <div className="text-lg font-semibold text-green-600">₹{totalPaid.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Outstanding</div>
                  <div className={`text-lg font-semibold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{outstanding.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              {selectedOrderTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Balance After</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrderTransactions.map((transaction) => {
                        const isCredit = transaction.transaction_type === 'credit'
                        const associatedPayment = !isCredit
                          ? payments.find(p => p.id === transaction.reference_id)
                          : null

                        return (
                          <TableRow
                            key={transaction.id}
                            className={isCredit ? 'bg-green-50/50' : 'bg-red-50/50'}
                          >
                            <TableCell className="text-sm">
                              {formatDateTime(transaction.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={isCredit ? 'default' : 'destructive'}
                                className={
                                  isCredit
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {isCredit ? 'Credit' : 'Debit'}
                              </Badge>
                              {associatedPayment && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {associatedPayment.method}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                              {isCredit ? '+' : '-'}₹{Number(transaction.amount).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ₹{Number(transaction.balance_after).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {associatedPayment?.reference_no || transaction.description || '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found for this order.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}