import React from 'react';
import { BillItem, Customer, PaymentRecord } from '../types';

interface ExchangePrintProps {
  billNo: string;
  billDate: string;
  customer: Customer | null;
  items: BillItem[];
  totals: {
    itemsSubtotal: number;
    grandTotal: number;
  };
  saleType?: 'GST' | 'NON GST';
  isScreenPreview?: boolean;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return new Date().toLocaleDateString('en-GB');
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

const numberToWords = (num: number): string => {
  return `Rupees ${num.toFixed(0)} Only`;
};

export const ExchangePrint: React.FC<ExchangePrintProps> = ({
  billNo,
  billDate,
  customer,
  items,
  totals,
  saleType = 'NON GST',
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
      <div className="flex flex-col items-center border-b-2 border-black pb-4 mb-6 text-center">
        <img src="/logo.png" alt="AR FASHION Logo" className="w-20 h-20 mb-2 object-contain" />
        <h1 className="text-xl font-black tracking-[0.2em] mb-2 uppercase opacity-40">Exchange Memo</h1>
        <div className="text-[10px] font-bold mt-2 leading-tight uppercase tracking-wider">
          <p>Modern Handlooms & Boutique Studio</p>
          <p>BSA Circle, 466, Tannery Rd, AR Colony, DJ Halli, Bengaluru - 560045</p>
          <p className="border-t border-black/10 mt-1 pt-1 font-bold">Ph: +91 99007 24060</p>
          {saleType === 'GST' && <p className="mt-1 font-black underline">GSTIN: 29bcGpa9842k1z7</p>}
        </div>
      </div>

      {/* INFO SECTION */}
      <div className="flex justify-between mb-8 text-[11px] font-black uppercase">
        <div className="space-y-2 flex-1">
          <div className="flex items-end">
            <span className="shrink-0 mr-2">M/s:</span>
            <span className="flex-1 dotted-border pb-0.5">{customer?.name || '...................................................'}</span>
          </div>
          <div className="flex items-end flex-1">
             <span className="shrink-0 mr-2">PH:</span>
             <span className="flex-1 dotted-border pb-0.5">{customer?.phone || '......................'}</span>
          </div>
        </div>
        <div className="ml-10 text-right space-y-2 w-40">
          <div className="flex justify-between"><span>DATE:</span> <span>{formatDate(billDate)}</span></div>
          <div className="flex justify-between"><span>REF NO:</span> <span className="text-black font-black">{billNo}</span></div>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-hidden">
        <table className="memo-table">
          <thead>
            <tr>
              <th className="w-10 text-center">SL</th>
              <th className="text-left">GARMENT DESCRIPTION</th>
              <th className="w-16 text-center">QTY</th>
              <th className="w-24 text-right">R_RATE</th>
              <th className="w-28 text-right">CREDIT</th>
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
            {/* Pad rows */}
            {items.length < 8 && Array.from({ length: 10 - items.length }).map((_, i) => (
              <tr key={`pad-${i}`} className="h-7">
                <td></td><td></td><td></td><td></td><td></td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-black">
            <tr className="bg-gray-50 font-black">
              <td colSpan={4} className="text-right py-3 px-4 text-xs tracking-widest">TOTAL CREDIT ADJUSTED</td>
              <td className="text-right font-mono text-lg py-3 px-4 bg-black text-white">{formatCurrency(totals.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* FOOTER */}
      <div className="mt-8 pt-6 border-t border-black">
          <div className="flex justify-between items-start gap-10 mb-12">
             <div className="text-[8px] font-bold leading-tight uppercase opacity-70">
                <p className="font-black mb-1 underline">Exchange Policy:</p>
                <p>1. Exchange only within 7 days with original tag.</p>
                <p>2. Credit note valid for 30 days only.</p>
                <p>3. Discounted items cannot be exchanged.</p>
             </div>
             
             <div className="flex gap-10">
                <div className="text-center w-32 border-t border-black/40 pt-1">
                   <p className="text-[8px] font-black uppercase">Customer Signature</p>
                </div>
                <div className="text-center w-40 border-t border-black pt-1">
                   <p className="text-[8px] font-black uppercase">Auth Signatory</p>
                </div>
             </div>
          </div>
          
          <div className="flex justify-between items-center opacity-30 mt-4">
            <span className="text-[8px] font-black tracking-[0.5em] uppercase">Boutique & Studio</span>
            <span className="text-[8px] font-mono italic">EX-{billNo}</span>
          </div>
      </div>
    </div>
  );
};
