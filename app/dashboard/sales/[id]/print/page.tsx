import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { AutoPrintImmediate } from "@/components/auto-print-immediate"
import { LogoDisplay } from "@/components/logo-display"

export default async function B2CSalePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Validate that id is not empty
  if (!id || id.trim() === "") {
    notFound()
  }

  const supabase = await createClient()
  const { data: sale } = await supabase
    .from("sales")
    .select(`*, sales_items(quantity, unit_price, retail_products(name, size, description, deleted))`)
    .eq("id", id.trim())
    .single()

  if (!sale) notFound()

  // Get customer details
  let customerDetails = null
  if (sale.customer_id) {
    const { data: customer } = await supabase
      .from("customers")
      .select("*")
      .eq("id", sale.customer_id)
      .single()
    
    customerDetails = customer
  }

  const items = sale.sales_items || []
  const subtotal = items.reduce((s: number, it: any) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0)
  const taxAmount = Number(sale.tax_amount || 0)
  const discountAmount = Number(sale.discount_amount || 0)
  const totalAmount = Number(sale.total_amount || 0)
  const taxRate = subtotal > 0 ? (taxAmount / subtotal) * 100 : 0
  const discountRate = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0
  const amountPaid = sale.payment_status === "paid" ? totalAmount : 0
  const balanceDue = totalAmount - amountPaid

  // Format dates
  const saleDate = new Date(sale.sale_date)
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
    contactName: "Tabrez Ahmed",
    email: "arfashionneww@gmail.com",
    phone: "99007 24060",
    address: "BSA Circle, 466, Tannery Rd, AR Colony, Devara Jeevanahalli, Bengaluru, Bengaluru, Karnataka 560005",
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
            <p>{companyInfo.phone}</p>
            <p>{companyInfo.email}</p>
            <p className="mt-2">{companyInfo.address}</p>
            {companyInfo.gstNumber && (
              <p className="mt-2"><span className="font-semibold">GSTIN:</span> {companyInfo.gstNumber}</p>
            )}
          </div>
        </div>

        {/* Right: Invoice Title and Details */}
        <div className="text-right">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 print:text-3xl">Invoice</h1>
          <div className="bg-gray-50 p-2 rounded-lg text-left inline-block print:p-1.5">
            <div className="space-y-1 text-xs print:text-xs">
              <div>
                <span className="text-gray-600">Invoice no.: </span>
                <span className="font-semibold text-gray-900">{sale.invoice_number}</span>
              </div>
              <div>
                <span className="text-gray-600">Invoice date: </span>
                <span className="font-semibold text-gray-900">{formattedSaleDateShort}</span>
              </div>
              <div>
                <span className="text-gray-600">Due: </span>
                <span className="font-semibold text-gray-900">{formattedDueDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To Section */}
      <div className="mb-6 print-break-avoid" style={{ marginBottom: '0.6cm' }}>
        <div className="max-w-md">
          <p className="text-xs font-bold text-gray-700 mb-1 uppercase print:text-xs">Bill to</p>
          <p className="text-lg font-bold text-gray-900 mb-2 print:text-base">{customerDetails?.name || "Customer"}</p>
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
      <div className="mb-4" style={{ marginBottom: '0.4cm' }}>
        <table className="w-full border-collapse" style={{ pageBreakInside: 'auto' }}>
          <thead>
            <tr className="bg-[#2563eb] text-white">
              <th className="px-2 py-2 text-left font-bold text-xs print:text-xs">DESCRIPTION</th>
              <th className="px-2 py-2 text-right font-bold text-xs print:text-xs">RATE, ₹</th>
              <th className="px-2 py-2 text-right font-bold text-xs print:text-xs">QTY</th>
              <th className="px-2 py-2 text-right font-bold text-xs print:text-xs">TAX</th>
              <th className="px-2 py-2 text-right font-bold text-xs print:text-xs">AMOUNT, ₹</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it: any, idx: number) => {
              const lineTotal = (Number(it.quantity) || 0) * (Number(it.unit_price) || 0)
              const lineTax = (lineTotal * taxRate) / 100
              const bgColor = idx % 2 === 0 ? "bg-white" : "bg-gray-50"
              
              // Check if product is deleted
              const isProductDeleted = it.retail_products?.deleted === true;
              const productName = it.retail_products?.name || "-";
              const displayProductName = isProductDeleted ? `${productName} (DELETED)` : productName;
              
              return (
                <tr key={idx} className={bgColor} style={{ pageBreakInside: 'avoid' }}>
                  <td className="border-b border-gray-200 px-2 py-2 text-gray-900 text-xs">
                    <div className="font-medium">
                      {productName}
                    </div>
                    {it.retail_products?.description && (
                      <div className="text-xs text-gray-600 mt-0.5 pl-2">
                        {it.retail_products.description}
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
                    {taxRate > 0 ? `${taxRate.toFixed(2)}%` : "-"}
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

      {/* Bottom Section - Payment Instructions and Summary */}
      <div className="grid grid-cols-2 gap-6 mb-4 print-break-avoid" style={{ gap: '1.2cm', marginBottom: '0.4cm' }}>
        {/* Left: Payment Instructions and Notes */}
        <div className="space-y-3 print:space-y-2">
          <div>
            <p className="text-xs font-bold text-gray-900 mb-1 print:text-xs">Payment instruction</p>
            <div className="text-xs text-gray-700 space-y-1 print:text-xs">
              <div>
                <span className="text-gray-600">Email: </span>
                <span className="font-semibold">{companyInfo.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Phone: </span>
                <span className="font-semibold">{companyInfo.phone}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 mb-2">Notes</p>
            <p className="text-sm text-gray-600">{sale.notes || "No additional notes."}</p>
          </div>
        </div>

        {/* Right: Summary */}
        <div>
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="px-2 py-2 text-right text-sm text-gray-700">Subtotal:</td>
                <td className="px-2 py-2 text-right text-sm font-semibold text-gray-900 w-32">
                  ₹ {Number(subtotal.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              {discountRate > 0 && (
                <tr>
                  <td className="px-2 py-2 text-right text-sm text-gray-700">
                    Discount ({discountRate.toFixed(0)}%):
                  </td>
                  <td className="px-2 py-2 text-right text-sm text-gray-900 w-32">
                    ₹ {Number(discountAmount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
              <tr>
                <td className="px-2 py-2 text-right text-sm text-gray-700">Shipping Cost:</td>
                <td className="px-2 py-2 text-right text-sm text-gray-900 w-32">
                  ₹ 0.00
                </td>
              </tr>
              {taxRate > 0 && (
                <tr>
                  <td className="px-2 py-2 text-right text-sm text-gray-700">Sales Tax:</td>
                  <td className="px-2 py-2 text-right text-sm text-gray-900 w-32">
                    ₹ {Number(taxAmount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              )}
              <tr>
                <td className="px-2 py-2 text-right text-sm font-bold text-gray-900">Total:</td>
                <td className="px-2 py-2 text-right text-sm font-bold text-gray-900 w-32">
                  ₹ {Number(totalAmount.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr>
                <td className="px-2 py-2 text-right text-sm text-gray-700">Amount paid:</td>
                <td className="px-2 py-2 text-right text-sm text-gray-900 w-32">
                  ₹ {Number(amountPaid.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr className="bg-[#e0f2fe]">
                <td className="px-2 py-3 text-right text-sm font-bold text-gray-900">Balance Due:</td>
                <td className="px-2 py-3 text-right text-sm font-bold text-gray-900 w-32">
                  ₹ {Number(balanceDue.toFixed(2)).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Signature */}
      <div className="mt-4 pt-4 border-t-2 border-gray-300 print-break-avoid" style={{ marginTop: '0.4cm', paddingTop: '0.3cm' }}>
        <div className="flex justify-end">
          <div className="text-right">
            <div className="text-blue-600 text-2xl font-bold mb-1 print:text-xl" style={{ fontFamily: "cursive" }}>
              {companyInfo.contactName}
            </div>
            <p className="text-xs text-gray-600">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  )
}





