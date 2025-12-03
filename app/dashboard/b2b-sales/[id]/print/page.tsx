import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { AutoPrintImmediate } from "@/components/auto-print-immediate"
import { LogoDisplay } from "@/components/logo-display"

export default async function B2BSalePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Validate that id is not empty
  if (!id || id.trim() === "") {
    notFound()
  }

  const supabase = await createClient()
  const { data: sale } = await supabase
    .from("wholesale_sales")
    .select(`*, customer:wholesale_buyers(*), wholesale_sales_items(quantity, unit_price, cgst_amount, sgst_amount, wholesale_products(name, sku, description, deleted))`)
    .eq("id", id.trim())
    .single()

  if (!sale) notFound()

  // Get customer details - use the customer data from the join if available
  let customerDetails = null
  if (sale.customer) {
    customerDetails = sale.customer
  }

  const items = sale.wholesale_sales_items || []
  const subtotal = items.reduce((s: number, it: any) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0)
  const taxAmount = Number(sale.tax_amount || 0)
  const discountAmount = Number(sale.discount_amount || 0)
  const totalAmount = Number(sale.total_amount || 0)
  
  // Calculate total CGST and SGST amounts from all items
  const cgstAmount = items.reduce((total: number, it: any) => total + (Number(it.cgst_amount) || 0), 0)
  const sgstAmount = items.reduce((total: number, it: any) => total + (Number(it.sgst_amount) || 0), 0)
  
  const discountRate = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0
  const amountPaid = sale.payment_status === "paid" ? totalAmount : 0
  const balanceDue = totalAmount - amountPaid

  // Format dates
  const saleDate = new Date(sale.sale_date)
  const formattedSaleDate = saleDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const formattedSaleDateShort = saleDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
  
  // Calculate due date (30 days from sale date)
  const dueDate = new Date(saleDate)
  dueDate.setDate(dueDate.getDate() + 30)
  const formattedDueDate = dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Company information
  const companyInfo = {
    name: "Tabrez Ahmed",
    phone: "99007 24060",
    address: "BSA Circle, 466, Tannery Rd, AR Colony, Devara Jeevanahalli, Bengaluru, Bengaluru, Karnataka 560005",
    email: "arfashionneww@gmail.com",
    gstNumber: "29BCGPA9842k1Z7",
  }

  return (
    <div className="print-content bg-white p-8 print:p-4 max-w-5xl mx-auto" style={{ visibility: 'visible', height: 'auto', minHeight: 'auto' }}>
      <AutoPrintImmediate />
      
      {/* Header Section - Logo and Invoice Title */}
      <div className="flex justify-between items-start mb-6 print-break-avoid" style={{ marginBottom: '0.8cm' }}>
        {/* Left: Logo and From Section */}
        <div className="flex-1">
          <div className="mb-3 print:mb-2">
            <LogoDisplay />
          </div>
          <p className="text-xs font-bold text-gray-700 mb-1 uppercase print:text-xs">From</p>
          <p className="text-xl font-bold text-gray-900 mb-2 print:text-lg">{companyInfo.name}</p>
          <div className="text-xs text-gray-600 space-y-0.5 print:text-xs">
            {companyInfo.phone && <p>{companyInfo.phone}</p>}
            {companyInfo.email && <p>{companyInfo.email}</p>}
          </div>
          {companyInfo.address && (
            <div className="text-xs text-gray-600 space-y-0.5 print:text-xs mt-2">
              <p>{companyInfo.address}</p>
            </div>
          )}
          {companyInfo.gstNumber && (
            <div className="text-xs text-gray-600 space-y-0.5 print:text-xs mt-2">
              <p><span className="font-semibold">GSTIN:</span> {companyInfo.gstNumber}</p>
            </div>
          )}
        </div>

        {/* Right: Invoice Title */}
        <div className="text-right">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 print:text-3xl">Invoice</h1>
          <div className="bg-gray-50 p-2 rounded-lg text-left inline-block print:p-1.5">
            <div className="space-y-1 text-xs print:text-xs">
              <div>
                <span className="text-gray-600">Date: </span>
                <span className="font-semibold text-gray-900">{formattedSaleDateShort}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="mb-6 print-break-avoid" style={{ marginBottom: '0.6cm' }}>
        <div className="max-w-md">
          <p className="text-xs font-bold text-gray-700 mb-1 uppercase print:text-xs">Bill to</p>
          <p className="text-lg font-bold text-gray-900 mb-2 print:text-base">{sale.customer_name || "Customer"}</p>
          <div className="text-xs text-gray-600 space-y-0.5 print:text-xs">
            {customerDetails ? (
              <>
                {customerDetails.phone && <p className="font-medium">{customerDetails.phone}</p>}
                <p className="mt-2">
                  {[
                    customerDetails.address,
                    customerDetails.city,
                    customerDetails.state,
                    customerDetails.postal_code,
                    customerDetails.country,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </>
            ) : (
              <>
                <p>Phone: Not available</p>
                <p className="mt-2">Address: Not available</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-4 overflow-x-auto" style={{ marginBottom: '0.4cm' }}>
        <table className="w-full border-collapse min-w-full" style={{ pageBreakInside: 'auto' }}>
          <thead>
            <tr className="bg-[#2563eb] text-white">
              <th className="px-2 py-2 text-left font-bold text-xs print:text-xs">S.NO</th>
              <th className="px-2 py-2 text-left font-bold text-xs print:text-xs">DESCRIPTION</th>
              <th className="px-2 py-2 text-right font-bold text-xs print:text-xs">RATE, ₹</th>
              <th className="px-2 py-2 text-right font-bold text-xs print:text-xs">QTY</th>
              <th className="px-2 py-2 text-right font-bold text-xs print:text-xs">CGST, ₹</th>
              <th className="px-2 py-2 text-right font-bold text-xs print:text-xs">SGST, ₹</th>
              <th className="px-2 py-2 text-right font-bold text-xs print:text-xs">AMOUNT, ₹</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any, idx: number) => {
              const lineTotal = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0)
              // Use per-item CGST and SGST amounts
              const lineCgst = Number(it.cgst_amount) || 0
              const lineSgst = Number(it.sgst_amount) || 0
              const bgColor = idx % 2 === 0 ? "bg-white" : "bg-gray-50"
              
              // Check if product is deleted
              const isProductDeleted = it.wholesale_products?.deleted === true;
              const productName = it.wholesale_products?.name || "-";
              const displayProductName = isProductDeleted ? `${productName} (DELETED)` : productName;
              
              return (
                <tr key={idx} className={bgColor} style={{ pageBreakInside: 'avoid', pageBreakAfter: 'auto' }}>
                  <td className="border-b border-gray-200 px-2 py-2 text-gray-900 text-xs">
                    {idx + 1}
                  </td>
                  <td className="border-b border-gray-200 px-2 py-2 text-gray-900 text-xs">
                    <div className="font-medium">
                      {productName}
                    </div>
                    {it.wholesale_products?.description && (
                      <div className="text-xs text-gray-600 mt-0.5 pl-2">
                        {it.wholesale_products.description}
                      </div>
                    )}
                  </td>
                  <td className="border-b border-gray-200 px-2 py-2 text-right text-gray-900 text-xs">
                    {Number(it.unit_price || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="border-b border-gray-200 px-2 py-2 text-right text-gray-900 text-xs">{it.quantity}</td>
                  <td className="border-b border-gray-200 px-2 py-2 text-right text-gray-900 text-xs">
                    {taxAmount >= 0 ? `₹${Number(lineCgst.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                  </td>
                  <td className="border-b border-gray-200 px-2 py-2 text-right text-gray-900 text-xs">
                    {taxAmount >= 0 ? `₹${Number(lineSgst.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "-"}
                  </td>
                  <td className="border-b border-gray-200 px-2 py-2 text-right font-semibold text-gray-900 text-xs">
                    {Number(lineTotal.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Section - Notes and Summary */}
      <div className="grid grid-cols-2 gap-6 mb-4 print-break-avoid" style={{ gap: '1.2cm', marginBottom: '0.4cm' }}>
        {/* Left: Notes */}
        <div className="space-y-3 print:space-y-2">
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">Notes</p>
            <p className="text-sm text-gray-600">{sale.notes || "No additional notes."}</p>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="space-y-2">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">₹{Number(subtotal.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">CGST:</span>
                <span className="font-semibold">₹{Number(cgstAmount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">SGST:</span>
                <span className="font-semibold">₹{Number(sgstAmount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <span className="font-semibold text-red-600">-₹{Number(discountAmount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="border-t pt-1.5 flex justify-between font-bold">
                <span className="text-gray-900">Total:</span>
                <span className="text-lg">₹{Number(totalAmount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {amountPaid > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-semibold text-green-600">-₹{Number(amountPaid.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              {balanceDue > 0 && (
                <div className="border-t pt-1.5 flex justify-between font-bold">
                  <span className="text-gray-900">Balance Due:</span>
                  <span className="text-lg text-orange-600">₹{Number(balanceDue.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 mt-8 print:mt-4">
        <p>Thank you for your business!</p>
      </div>
    </div>
  )
}
