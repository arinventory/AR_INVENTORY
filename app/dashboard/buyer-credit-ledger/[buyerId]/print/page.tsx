import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { AutoPrintImmediate } from "@/components/auto-print-immediate"
import { LogoDisplay } from "@/components/logo-display"

export default async function BuyerCreditStatementPrintPage({
  params,
}: {
  params: Promise<{ buyerId: string }>
}) {
  console.log("Print page accessed, params:", params);
  const { buyerId } = await params
  console.log("Print page accessed with buyerId:", buyerId);
  
  // Simple validation
  if (!buyerId || buyerId.trim() === "") {
    console.log("Invalid buyerId, showing not found");
    return <div>Page Not Found - Invalid Buyer ID: {buyerId}</div>;
  }
  
  const supabase = await createClient()
  
  // First, let's check if we can connect to the database and see what buyers exist
  const { data: allBuyers, error: allBuyersError } = await supabase
    .from("wholesale_buyers")
    .select("id, name")
    .limit(10)
  
  console.log("All buyers in database (first 10):", allBuyers);
  console.log("All buyers error:", allBuyersError);
  
  if (allBuyersError) {
    console.log("Database connection error:", allBuyersError);
    return <div>Database Error: {allBuyersError.message}</div>;
  }

  // Fetch buyer details
  const { data: buyer, error: buyerError } = await supabase
    .from("wholesale_buyers")
    .select("id, name, phone, address, city, state, postal_code")
    .eq("id", buyerId.trim())
    .single()

  if (buyerError || !buyer) {
    console.log("Buyer not found, showing not found page");
    console.log("Buyer error:", buyerError);
    console.log("Buyer data:", buyer);
    return (
      <div>
        <h1>Page Not Found - Buyer Not Found</h1>
        <p>Buyer ID: {buyerId}</p>
        <p>Error: {buyerError?.message}</p>
        <h2>Available Buyers:</h2>
        <ul>
          {allBuyers?.map(b => (
            <li key={b.id}>{b.id} - {b.name}</li>
          ))}
        </ul>
      </div>
    );
  }
  
  console.log("Buyer found:", buyer);

  // Fetch credit ledger to calculate current balance
  const { data: creditLedger } = await supabase
    .from("buyer_credit_ledger")
    .select("balance_after, created_at")
    .eq("customer_id", buyerId.trim())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const currentBalance = Number(creditLedger?.balance_after || 0)

  // Fetch all credit ledger entries for this buyer
  const { data: creditLedgerEntries } = await supabase
    .from("buyer_credit_ledger")
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
    .eq("customer_id", buyerId.trim())
    .order("created_at", { ascending: true })

  // Fetch wholesale sales (invoices) for this buyer
  const { data: wholesaleSales } = await supabase
    .from("wholesale_sales")
    .select(`
      id,
      invoice_number,
      sale_date,
      total_amount,
      payment_status
    `)
    .eq("customer_id", buyerId.trim())
    .order("sale_date", { ascending: true })

  // Fetch all payments from this buyer
  const { data: payments } = await supabase
    .from("buyer_payments")
    .select(`
      id,
      amount,
      payment_date,
      wholesale_sale_id,
      method,
      reference_no
    `)
    .eq("customer_id", buyerId.trim())
    .order("payment_date", { ascending: true })

  const printDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })

  // Company information
  const companyInfo = {
    name: "AR FASHION",
    phone: "99007 24060",
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
              <p className="mt-1">{companyInfo.address}</p>
              <p className="mt-1"><span className="font-semibold">GSTIN:</span> {companyInfo.gstNumber}</p>
            </div>
          </div>
          <div className="text-center mt-4">
            <h1 className="text-2xl font-bold">BUYER CREDIT STATEMENT</h1>
            <p className="text-sm text-gray-600 mt-1">Statement Date: {printDate}</p>
          </div>
        </div>

        {/* Buyer Details */}
        <div className="mb-6 border-2 border-gray-300 rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Buyer Information</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">Name:</span> {buyer.name}
            </div>
            <div>
              <span className="font-medium">Phone:</span> {buyer.phone || "N/A"}
            </div>
            {buyer.address && (
              <div className="col-span-2">
                <span className="font-medium">Address:</span> {buyer.address}
                {buyer.city && `, ${buyer.city}`}
                {buyer.state && `, ${buyer.state}`}
                {buyer.postal_code && ` - ${buyer.postal_code}`}
              </div>
            )}
          </div>
        </div>

        {/* Outstanding Balance Summary */}
        <div className="mb-6 border-2 border-green-600 rounded p-4 bg-green-50">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Outstanding Balance</h2>
            <div className="text-3xl font-bold text-green-600">₹{currentBalance.toFixed(2)}</div>
          </div>
        </div>

        {/* Invoices / Sales */}
        {wholesaleSales && wholesaleSales.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b-2 border-gray-300 pb-2">
              Invoices / Sales
            </h2>
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-left">Invoice Number</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Date</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Amount</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {wholesaleSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className="border border-gray-300 px-3 py-2">{sale.invoice_number}</td>
                    <td className="border border-gray-300 px-3 py-2">
                      {new Date(sale.sale_date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      ₹{Number(sale.total_amount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center capitalize">
                      {sale.payment_status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payments Received */}
        {payments && payments.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 border-b-2 border-gray-300 pb-2">
              Payments Received
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
                      ₹{Number(payment.amount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                      {entry.transaction_type === "debit" ? `₹${Number(entry.amount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      {entry.transaction_type === "credit" ? `₹${Number(entry.amount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right font-medium">
                      ₹{Number(entry.balance_after.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
