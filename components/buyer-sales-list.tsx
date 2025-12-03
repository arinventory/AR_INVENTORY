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

interface WholesaleSale {
  id: string
  invoice_number: string
  sale_date: string
  total_amount: number
  payment_status: string
}

interface BuyerPayment {
  id: string
  amount: number
  payment_date: string
  wholesale_sale_id?: string
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

export function BuyerSalesList({
  sales,
  payments,
  creditLedger,
  buyerId,
}: {
  sales: WholesaleSale[]
  payments: BuyerPayment[]
  creditLedger: CreditEntry[]
  buyerId: string
}) {
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null)

  // Get all transactions for a specific sale (invoice)
  const getSaleTransactions = (saleId: string) => {
    // Get debit transaction from sale (buyer owes us)
    const saleDebit = creditLedger.filter(
      (entry) => entry.reference_type === 'wholesale_sale' && entry.reference_id === saleId && entry.transaction_type === 'debit'
    )
    
    // Get credit transactions from payments linked to this sale
    const salePayments = payments.filter(p => p.wholesale_sale_id === saleId)
    const paymentIds = salePayments.map(p => p.id)
    const paymentCredits = creditLedger.filter(
      (entry) => entry.reference_type === 'buyer_payment' && entry.reference_id && paymentIds.includes(entry.reference_id) && entry.transaction_type === 'credit'
    )
    
    // Combine and sort chronologically
    return [...saleDebit, ...paymentCredits].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  }

  // Get payments for a specific sale
  const getSalePayments = (saleId: string) => {
    return payments.filter(p => p.wholesale_sale_id === saleId)
  }

  const selectedSale = sales.find(s => s.id === selectedSaleId)
  const selectedSaleTransactions = selectedSaleId ? getSaleTransactions(selectedSaleId) : []
  const selectedSalePayments = selectedSaleId ? getSalePayments(selectedSaleId) : []
  const totalPaid = selectedSalePayments.reduce((sum, p) => sum + Number(p.amount), 0)
  const outstanding = selectedSale ? Number(selectedSale.total_amount) - totalPaid : 0

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Invoices / Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Invoice Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => {
                    const salePayments = getSalePayments(sale.id)
                    const paid = salePayments.reduce((sum, p) => sum + Number(p.amount), 0)
                    const saleOutstanding = Number(sale.total_amount) - paid

                    return (
                      <TableRow key={sale.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{sale.invoice_number}</TableCell>
                        <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{Number(sale.total_amount).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          ₹{paid.toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right font-semibold ${saleOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{saleOutstanding.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={sale.payment_status === 'paid' ? 'default' : 'outline'}>
                            {sale.payment_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSaleId(sale.id)}
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
              No invoices found for this buyer.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      <Dialog open={selectedSaleId !== null} onOpenChange={(open) => !open && setSelectedSaleId(null)}>
        <DialogContent className="!max-w-[98vw] !w-[98vw] !max-h-[98vh] !h-[98vh] !top-[1vh] !left-[1vw] !translate-x-0 !translate-y-0 overflow-y-auto p-8 m-0">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">
                  Transactions for {selectedSale?.invoice_number}
                </DialogTitle>
                <DialogDescription className="mt-2">
                  All debit and credit transactions for this invoice
                </DialogDescription>
              </div>
              {selectedSale && (
                <Button
                  onClick={() => {
                    // Validate buyerId before using it
                    if (!buyerId || typeof buyerId !== 'string' || buyerId.trim() === '') {
                      alert('Cannot generate transaction history: Invalid buyer ID');
                      console.error('Invalid buyerId:', buyerId);
                      return;
                    }
                    
                    // Debug the URL construction
                    const trimmedBuyerId = buyerId.trim();
                    console.log("Buyer ID (trimmed):", trimmedBuyerId);
                    const printUrl = `/dashboard/buyer-credit-ledger/${encodeURIComponent(trimmedBuyerId)}/print`;
                    console.log("Print URL:", printUrl);
                    
                    // Try to open in a new window with error handling
                    try {
                      const newWindow = window.open(printUrl, '_blank');
                      if (!newWindow) {
                        alert('Popup was blocked. Please allow popups for this site.');
                        console.error('Popup blocked for URL:', printUrl);
                      } else {
                        newWindow.focus();
                      }
                    } catch (error) {
                      console.error('Error opening print window:', error);
                      alert('Error opening print window. Please try again.');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  📄 Download Transaction History
                </Button>
              )}
            </div>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-3">
              {/* Sale Summary */}
              <div className="grid grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Invoice Amount</div>
                  <div className="text-2xl font-bold">₹{Number(selectedSale.total_amount).toFixed(2)}</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Total Paid</div>
                  <div className="text-2xl font-bold text-green-600">₹{totalPaid.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">Outstanding</div>
                  <div className={`text-2xl font-bold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ₹{outstanding.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Transaction History</h3>
                {selectedSaleTransactions.length > 0 ? (
                  <div className="overflow-x-auto border rounded-lg">
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
                      {selectedSaleTransactions.map((transaction) => {
                        const isDebit = transaction.transaction_type === 'debit'
                        const associatedPayment = !isDebit
                          ? payments.find(p => p.id === transaction.reference_id)
                          : null

                        return (
                          <TableRow
                            key={transaction.id}
                            className={isDebit ? 'bg-red-50/50' : 'bg-green-50/50'}
                          >
                            <TableCell className="text-sm py-3">
                              <div className="font-medium">
                                {new Date(transaction.created_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(transaction.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={isDebit ? 'destructive' : 'default'}
                                className={
                                  isDebit
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }
                              >
                                {isDebit ? 'Debit (Invoice)' : 'Credit (Payment)'}
                              </Badge>
                              {associatedPayment && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {associatedPayment.method}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className={`text-right font-semibold py-3 ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                              <span className="text-lg">{isDebit ? '+' : '-'}₹{Number(transaction.amount).toFixed(2)}</span>
                            </TableCell>
                            <TableCell className="text-right font-semibold py-3">
                              <span className="text-lg">₹{Number(transaction.balance_after).toFixed(2)}</span>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600 py-3">
                              {associatedPayment?.reference_no || transaction.description || '-'}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    No transactions found for this invoice.
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}








