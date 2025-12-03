import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { AutoPrintImmediate } from "@/components/auto-print-immediate"
import { LogoDisplay } from "@/components/logo-display"

export default async function SupplierCreditStatementPrintPage({
  params,
}: {
  params: Promise<{ supplierId: string }>
}) {
  const { supplierId } = await params
  const supabase = await createClient()

  if (!supplierId || supplierId.trim() === "") {
    notFound()
  }

  // Fetch supplier details
  const { data: supplier, error: supplierError } = await supabase
    .from("suppliers")
    .select("id, name, phone, email, address, city, state, postal_code, contact_person")
    .eq("id", supplierId.trim())
    .single()

  if (supplierError || !supplier) {
    notFound()
  }

  // Fetch credit ledger to calculate current balance
  const { data: creditLedger } = await supabase
    .from("credit_ledger")
    .select("balance_after, created_at")
    .eq("supplier_id", supplierId.trim())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const currentBalance = Number(creditLedger?.balance_after || 0)

  // Fetch all credit ledger entries for this supplier
  const { data: creditLedgerEntries } = await supabase
    .from("credit_ledger")
    .select(`
      id,
      transaction_type,
      amount,
      balance_after,
      created_at,
      description,
      reference_id,
      reference_type
    `)
    .eq("supplier_id", supplierId.trim())
    .order("created_at", { ascending: true })

  // Fetch purchase orders for this supplier
  const { data: purchaseOrders } = await supabase
    .from("purchase_orders")
    .select(`
      id,
      order_number,
      order_date,
      total_amount,
      status
    `)
    .eq("supplier_id", supplierId.trim())
    .order("order_date", { ascending: true })

  // Fetch all payments for this supplier
  const { data: payments } = await supabase
    .from("payments")
    .select(`
      id,
      amount,
      payment_date,
      purchase_order_id,
      method,
      reference_no
    `)
    .eq("supplier_id", supplierId.trim())
    .order("payment_date", { ascending: true })

  const printDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  // Company information
  const companyInfo = {
    name: "Tabrez Ahmed",
    phone: "99007 24060",
    email: "arfashionneww@gmail.com",
    address: "BSA Circle, 466, Tannery Rd, AR Colony, Devara Jeevanahalli, Bengaluru, Bengaluru, Karnataka 560005",
    gstNumber: "29BCGPA9842k1Z7",
  }

  return (
    <>
      <AutoPrintImmediate />
      <div className="print-content p-8 max-w-5xl mx-auto bg-white">
        {/* Header */}
        <div className="mb-8">
          <LogoDisplay />
          <div className="mt-4 mb-4">
            <div className="text-sm text-gray-700 mb-2">
              <p className="font-bold">{companyInfo.name}</p>
              <p>{companyInfo.phone}</p>
              <p>{companyInfo.email}</p>
              <p className="mt-1">{companyInfo.address}</p>
              <p className="mt-1"><span className="font-semibold">GSTIN:</span> {companyInfo.gstNumber}</p>
            </div>
          </div>
          <div className="text-center mt-4">
            <h1 className="text-2xl font-bold">SUPPLIER CREDIT STATEMENT</h1>
            <p className="text-sm text-gray-600 mt-1">Statement Date: {printDate}</p>
          </div>
        </div>

        {/* Supplier Details */}
        <div className="mb-6 border-2 border-gray-300 rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Supplier Information</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Name:</span> {supplier.name}
            </div>
            <div>
              <span className="font-medium">Phone:</span> {supplier.phone || "N/A"}
            </div>
            {supplier.email && (
              <div>
                <span className="font-medium">Email:</span> {supplier.email}
              </div>
            )}
            {supplier.contact_person && (
              <div>
                <span className="font-medium">Contact Person:</span> {supplier.contact_person}
              </div>
            )}
            {supplier.address && (
              <div className="col-span-2">
                <span className="font-medium">Address:</span> {supplier.address}
                {supplier.city && `, ${supplier.city}`}
                {supplier.state && `, ${supplier.state}`}
                {supplier.postal_code && ` - ${supplier.postal_code}`}
              </div>
            )}
          </div>
        </div>

        {/* Outstanding Balance Summary */}
        <div className="mb-6 border-2 border-red-600 rounded p-4 bg-red-50">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Outstanding Balance (Amount Owed)</h2>
            <div className="text-3xl font-bold text-red-600">₹{currentBalance.toFixed(2)}</div>
          </div>
        </div>

        {/* Purchase Orders */}
        {purchaseOrders && purchaseOrders.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b-2 border-gray-300 pb-2">
              Purchase Orders
            </h2>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">Order Number</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Amount</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="border border-gray-300 px-3 py-2">{order.order_number}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {new Date(order.order_date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      ₹{order.total_amount.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center capitalize">
                      {order.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payments Made */}
        {payments && payments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b-2 border-gray-300 pb-2">
              Payments Made
            </h2>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Amount</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Method</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="border border-gray-300 px-3 py-2">
                      {new Date(payment.payment_date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      ₹{payment.amount.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 capitalize">
                      {payment.method || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {payment.reference_no || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Transaction History */}
        {creditLedgerEntries && creditLedgerEntries.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b-2 border-gray-300 pb-2">
              Transaction History
            </h2>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Type</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Description</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Debit</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Credit</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {creditLedgerEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="border border-gray-300 px-3 py-2">
                      {new Date(entry.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 capitalize">
                      {entry.transaction_type}
                    </td>
                    <td className="border border-gray-300 px-3 py-2">
                      {entry.description || "-"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {entry.transaction_type === "debit" ? `₹${entry.amount.toFixed(2)}` : "-"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {entry.transaction_type === "credit" ? `₹${entry.amount.toFixed(2)}` : "-"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                      ₹{entry.balance_after.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center text-sm text-gray-600">
          <p>This is a computer-generated statement and does not require a signature.</p>
          <p className="mt-1">For any queries, please contact us.</p>
        </div>
      </div>
    </>
  )
}
