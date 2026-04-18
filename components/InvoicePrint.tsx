
import React from 'react';
import { BillItem, Customer, PaymentRecord } from '../types';

interface InvoicePrintProps {
  billNo: string;
  billDate: string;
  saleType: 'GST' | 'NON GST';
  customer: Customer | null;
  items: BillItem[];
  totals: {
    itemsSubtotal: number;
    baseTaxable: number;
    gstAmount: number;
    grandTotal: number;
  };
  paymentMethods: PaymentRecord[];
  isScreenPreview?: boolean;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return new Date().toLocaleDateString('en-GB');
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);

const numberToWords = (num: number): string => {
  return `Rupees ${num.toFixed(0)} Only`;
};

export const InvoicePrint: React.FC<InvoicePrintProps> = ({
  billNo,
  billDate,
  saleType,
  customer,
  items,
  totals,
  paymentMethods,
  isScreenPreview = false
}) => {
  return (
    <div className={`${isScreenPreview ? 'block w-[148mm] mx-auto shadow-2xl p-8 my-8' : 'hidden print:block w-[148mm] h-[210mm] mx-auto p-8'} bg-white text-black font-sans flex flex-col border border-gray-200`}>
      <style>{`
        @media print {
          @page { margin: 0; size: A5 portrait; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        .memo-table { border-collapse: collapse; width: 100%; border: 2px solid #000; }
        .memo-table th {
          border: 1px solid #000;
          padding: 8px 10px;
          font-weight: 900;
          font-size: 11px;
          text-transform: uppercase;
          background: #f3f4f6;
        }
        .memo-table td {
          border-left: 1px solid #000;
          border-right: 1px solid #000;
          padding: 6px 10px;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
        }
        .dotted-border { border-bottom: 1px dotted #000; }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col items-center border-b-2 border-black pb-4 mb-6">
        <img src="/logo.png" alt="AR FASHION Logo" className="w-20 h-20 mb-2 object-contain" />
        <h1 className="text-xl font-black tracking-[0.2em] mb-2 uppercase opacity-40">CASH MEMO / ESTIMATE</h1>
        <div className="text-[10px] font-bold mt-2 text-center leading-tight uppercase tracking-wider">
          <p>Modern Handlooms & Boutique Studio</p>
          <p>BSA Circle, 466, Tannery Rd, AR Colony, DJ Halli, Bengaluru - 560045</p>
          <p className="border-t border-black/10 mt-1 pt-1">Ph: +91 99007 24060</p>
          {saleType === 'GST' && <p className="mt-1 font-black">GSTIN: 29bcGpa9842k1z7</p>}
        </div>
      </div>

      {/* INFO SECTION */}
      <div className="flex justify-between mb-8 text-[11px] font-black uppercase">
        <div className="space-y-2 flex-1">
          <div className="flex items-end">
            <span className="shrink-0 mr-2">M/s:</span>
            <span className="flex-1 dotted-border pb-0.5">{customer?.name || '...................................................'}</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-end flex-1">
               <span className="shrink-0 mr-2">PH:</span>
               <span className="flex-1 dotted-border pb-0.5">{customer?.phone || '......................'}</span>
            </div>
            <div className="flex items-end flex-1">
               <span className="shrink-0 mr-2">GSTIN:</span>
               <span className="flex-1 dotted-border pb-0.5">{customer?.address || '......................'}</span>
            </div>
          </div>
        </div>
        <div className="ml-10 text-right space-y-2 w-40">
          <div className="flex justify-between"><span>DATE:</span> <span>{formatDate(billDate)}</span></div>
          <div className="flex justify-between"><span>BILL NO:</span> <span className="text-black font-black">{billNo}</span></div>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-hidden">
        <table className="memo-table">
          <thead>
            <tr>
              <th className="w-10 text-center">SL</th>
              <th className="text-left">PARTICULARS / DESCRIPTION</th>
              <th className="w-16 text-center">QTY</th>
              <th className="w-24 text-right">RATE</th>
              <th className="w-28 text-right">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id} className="h-8">
                <td className="text-center italic opacity-40">{idx + 1}</td>
                <td className="font-black">{item.item_name}</td>
                <td className="text-center font-mono">{item.quantity}</td>
                <td className="text-right font-mono">{item.rate.toLocaleString()}</td>
                <td className="text-right font-mono">{item.line_total.toLocaleString()}</td>
              </tr>
            ))}
            {/* Pad empty rows to fill A5 space */}
            {items.length < 10 && Array.from({ length: 12 - items.length }).map((_, i) => (
              <tr key={`pad-${i}`} className="h-7">
                <td className="text-center"></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-black">
            <tr className="bg-gray-50 font-black">
              <td colSpan={4} className="text-right py-3 px-4 text-xs">GRAND TOTAL (INR)</td>
              <td className="text-right font-mono text-lg py-3 px-4 bg-black text-white">{totals.grandTotal.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* TOTAL IN WORDS & TERMS */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-start gap-2">
           <span className="text-[10px] font-black uppercase shrink-0 italic">Amount in Words:</span>
           <span className="text-[11px] font-black uppercase border-b border-black flex-1 pb-0.5">{numberToWords(totals.grandTotal)}</span>
        </div>

        <div className="grid grid-cols-2 gap-8 items-end">
           <div>
              <p className="text-[8px] font-bold leading-tight opacity-70">
                TERMS & CONDITIONS:<br />
                1. Goods once sold will not be exchanged or returned.<br />
                2. Bills not paid within due date will attract 18% p.a interest.<br />
                3. Subject to Local Jurisdiction only.
              </p>
           </div>
           
           <div className="text-center border-t border-black pt-2">
              <p className="text-[10px] font-black uppercase">For AR FASHION</p>
              <div className="h-6"></div> {/* Space for signature */}
              <p className="text-[8px] opacity-40 uppercase tracking-widest font-black">Authorized Signatory</p>
           </div>
        </div>
      </div>

      {/* FOOTER ACCENT */}
      <div className="mt-8 pt-2 border-t border-dashed border-gray-300 flex justify-between items-center opacity-30">
        <span className="text-[8px] font-black tracking-[0.5em] uppercase">Premium Boutique Studio</span>
        <span className="text-[8px] font-mono italic">Powered by AR-ERP System</span>
      </div>
    </div>
  );
};
