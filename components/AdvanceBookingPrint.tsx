
import React from 'react';

interface BookingItem {
  id: string;
  item_name: string;
  quantity: number;
  rate: number;
  line_total: number;
}

interface AdvanceBookingPrintProps {
  bookingNo: string;
  bookingDate: string;
  deliveryDate: string;
  customerName: string;
  customerPhone: string;
  items: BookingItem[];
  saleType?: 'GST' | 'NON GST';
  itemDescription?: string;
  totalAmount: number;
  advanceAmount: number;
  balanceDue: number;
  notes?: string;
  isScreenPreview?: boolean;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

export const AdvanceBookingPrint: React.FC<AdvanceBookingPrintProps> = ({
  bookingNo,
  bookingDate,
  deliveryDate,
  customerName,
  customerPhone,
  items,
  saleType = 'NON GST',
  itemDescription,
  totalAmount,
  advanceAmount,
  balanceDue,
  notes,
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
        .order-table { border-collapse: collapse; width: 100%; border: 2px solid #000; }
        .order-table th {
          border: 1px solid #000;
          padding: 6px 8px;
          font-weight: 900;
          font-size: 10px;
          text-transform: uppercase;
          background: #f3f4f6;
        }
        .order-table td {
          border: 1px solid #000;
          padding: 6px 8px;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
        }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col items-center border-b-2 border-black pb-4 mb-6 text-center">
        <img src="/logo.png" alt="AR FASHION Logo" className="w-20 h-20 mb-2 object-contain" />
        <h1 className="text-xl font-black tracking-[0.2em] mb-2 uppercase opacity-40">Purchase Booking</h1>
        <div className="text-[10px] font-bold mt-2 leading-tight uppercase tracking-wider">
          <p>Modern Handlooms & Boutique Studio</p>
          <p>BSA Circle, 466, Tannery Rd, AR Colony, DJ Halli, Bengaluru - 560045</p>
          <p className="border-t border-black/10 mt-1 pt-1 font-bold">Ph: +91 99007 24060</p>
          {saleType === 'GST' && <p className="mt-1 font-black underline italic">GSTIN: 29bcGpa9842k1z7</p>}
        </div>
      </div>

      {/* INFO BAR */}
      <div className="flex justify-between items-center bg-black text-white px-4 py-2 mb-6 text-[10px] font-black uppercase tracking-widest rounded-sm">
         <span>Booking Receipt</span>
         <div className="flex gap-4">
            <span>Order No: {bookingNo}</span>
            <span>Date: {formatDate(bookingDate || new Date().toISOString())}</span>
         </div>
      </div>

      {/* CUSTOMER & DELIVERY */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-2 uppercase text-[11px] font-black">
          <p className="text-[8px] opacity-40 mb-1">Customer Details:</p>
          <div className="border-l-4 border-black pl-3 py-1">
             <p className="text-lg leading-none mb-1">{customerName}</p>
             <p className="font-mono text-gray-500">{customerPhone}</p>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 border border-black/10 rounded flex flex-col items-end justify-center uppercase font-black">
            <span className="text-[8px] opacity-40 mb-1">Expected Delivery:</span>
            <span className="text-sm font-mono">{formatDate(deliveryDate)}</span>
        </div>
      </div>

      {/* ITEMS LIST */}
      <div className="flex-1 mb-8">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 border-b border-black pb-1">Particulars Description</h4>
        {items && items.length > 0 ? (
          <table className="order-table">
            <thead>
              <tr className="bg-gray-100">
                <th className="w-10 text-center">#</th>
                <th className="text-left">Item Description</th>
                <th className="w-14 text-center">Qty</th>
                <th className="w-24 text-right">Rate</th>
                <th className="w-28 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td className="text-center italic opacity-40">{idx + 1}</td>
                  <td className="font-black">{item.item_name}</td>
                  <td className="text-center font-mono">{item.quantity}</td>
                  <td className="text-right font-mono">{item.rate.toLocaleString()}</td>
                  <td className="text-right font-mono">{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
              {/* Pad rows */}
              {items.length < 5 && Array.from({ length: 5 - items.length }).map((_, i) => (
                <tr key={`pad-${i}`} className="h-8">
                  <td></td><td></td><td></td><td></td><td></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 border-2 border-dashed border-gray-200 text-xs italic text-center font-bold opacity-60">
             {itemDescription || 'Standard Order Booking Particulars'}
          </div>
        )}
      </div>

      {/* TOTALS SECTIONS */}
      <div className="grid grid-cols-12 border-2 border-black mb-6 font-black uppercase">
        <div className="col-span-8 p-4 bg-white border-r-2 border-black flex flex-col justify-center">
           <span className="text-[8px] opacity-40 mb-1">Status: {saleType} Booking</span>
           <p className="text-sm">Balance to be paid at delivery</p>
        </div>
        <div className="col-span-4 p-4 bg-black text-white text-right">
           <span className="text-[8px] opacity-60 mb-1 tracking-widest">Grand Total</span>
           <p className="text-xl font-mono">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8 font-black uppercase">
         <div className="bg-green-50 border-2 border-green-200 p-4 rounded flex flex-col items-center">
            <span className="text-[8px] text-green-600 mb-1">Advance Received</span>
            <span className="text-2xl font-mono text-green-700">{formatCurrency(advanceAmount)}</span>
         </div>
         <div className="bg-red-50 border-2 border-red-200 p-4 rounded flex flex-col items-center">
            <span className="text-[8px] text-red-600 mb-1">Remaining Balance</span>
            <span className="text-2xl font-mono text-red-700">{formatCurrency(balanceDue)}</span>
         </div>
      </div>

      {/* FOOTER */}
      <div className="mt-8 pt-6 border-t border-black">
          <div className="flex justify-between items-start gap-10 mb-12">
             <div className="text-[8px] font-bold leading-tight uppercase opacity-70">
                <p className="font-black mb-1 underline">Booking Terms:</p>
                <p>1. Receipt required for pickup.</p>
                <p>2. Advance is non-refundable.</p>
                <p>3. Colors may vary slightly.</p>
             </div>
             
             <div className="flex gap-10">
                <div className="text-center w-32 border-t border-black/40 pt-1">
                   <p className="text-[8px] font-black uppercase">Customer</p>
                </div>
                <div className="text-center w-40 border-t border-black pt-1">
                   <p className="text-[8px] font-black uppercase">For AR FASHION</p>
                </div>
             </div>
          </div>
          
          <div className="flex justify-between items-center opacity-30 mt-4">
            <span className="text-[8px] font-black tracking-[0.5em] uppercase">Premium Boutique Studio</span>
            <span className="text-[8px] font-mono italic">Order ID: {bookingNo}-BK</span>
          </div>
      </div>
    </div>
  );
};
