
import React from 'react';

interface LayawayTransaction {
  id: string;
  date: string;
  amount: number;
  mode: string;
  reference?: string;
  notes?: string;
}

interface LayawayStatementPrintProps {
  billNo: string;
  billDate: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  transactions: LayawayTransaction[];
  isScreenPreview?: boolean;
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);

export const LayawayStatementPrint: React.FC<LayawayStatementPrintProps> = ({
  billNo,
  billDate,
  customerName,
  customerPhone,
  totalAmount,
  paidAmount,
  balance,
  transactions,
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
        .tx-table { border-collapse: collapse; width: 100%; border: 2px solid #000; }
        .tx-table th {
          border: 1px solid #000;
          padding: 6px 8px;
          font-weight: 900;
          font-size: 10px;
          text-transform: uppercase;
          background: #f3f4f6;
        }
        .tx-table td {
          border: 1px solid #000;
          padding: 6px 8px;
          font-weight: 700;
          font-size: 10px;
          text-transform: uppercase;
        }
        .dotted-border { border-bottom: 1px dotted #000; }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col items-center border-b-2 border-black pb-4 mb-6 text-center">
        <img src="/logo.png" alt="AR FASHION Logo" className="w-20 h-20 mb-2 object-contain" />
        <h1 className="text-xl font-black tracking-[0.2em] mb-2 uppercase opacity-40">Payment Statement</h1>
        <div className="text-[10px] font-bold mt-2 leading-tight uppercase tracking-wider">
          <p>Modern Handlooms & Boutique Studio</p>
          <p>BSA Circle, 466, Tannery Rd, AR Colony, DJ Halli, Bengaluru - 560045</p>
          <p className="border-t border-black/10 mt-1 pt-1 font-bold">Ph: +91 99007 24060</p>
        </div>
      </div>

      {/* INFO BAR */}
      <div className="flex justify-between items-center bg-black text-white px-4 py-2 mb-6 text-[10px] font-black uppercase tracking-widest rounded-sm">
         <span>Layaway Summary</span>
         <div className="flex gap-4">
            <span>Bill No: {billNo}</span>
            <span>Date: {formatDate(new Date().toISOString())}</span>
         </div>
      </div>

      {/* CUSTOMER & SUMMARY */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-2 uppercase text-[11px] font-black">
          <p className="text-[8px] opacity-40 mb-1">Customer Profile:</p>
          <div className="border-l-4 border-black pl-3 py-1">
             <p className="text-lg leading-none mb-1">{customerName}</p>
             <p className="font-mono text-gray-500">{customerPhone}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-right uppercase text-[9px] font-black">
           <div className="flex flex-col justify-center">
              <span className="opacity-40">Original Date:</span>
              <span>{formatDate(billDate)}</span>
           </div>
           <div className="bg-gray-50 p-2 border border-black/10 rounded flex flex-col items-end">
              <span className="opacity-40">Status:</span>
              <span className={balance <= 0 ? 'text-green-600' : 'text-red-600'}>
                  {balance <= 0 ? 'FULLY PAID' : 'PENDING'}
              </span>
           </div>
        </div>
      </div>

      {/* FINANCIAL TILES */}
      <div className="grid grid-cols-3 gap-0 border-2 border-black mb-8 rounded-sm overflow-hidden font-black">
        <div className="p-4 border-r-2 border-black">
           <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Total Bill Value</p>
           <p className="text-xl font-mono">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="p-4 border-r-2 border-black bg-gray-50">
           <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Amount Paid</p>
           <p className="text-xl font-mono text-green-700">{formatCurrency(paidAmount)}</p>
        </div>
        <div className="p-4 bg-black text-white">
           <p className="text-[8px] uppercase tracking-widest opacity-60 mb-1">Balance Remaining</p>
           <p className="text-xl font-mono text-gold-500">{formatCurrency(balance)}</p>
        </div>
      </div>

      {/* TRANSACTION LIST */}
      <div className="flex-1">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 border-b border-black pb-1">Ledger Entry / Payment History</h4>
        <table className="tx-table">
          <thead>
            <tr>
              <th className="w-10 text-center">#</th>
              <th className="text-left w-24">Date</th>
              <th className="text-left">Reference / Description</th>
              <th className="w-28 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
                <tr>
                    <td colSpan={4} className="py-20 text-center text-gray-400 italic font-medium px-4">No installments recorded yet for this bill.</td>
                </tr>
            ) : (
                transactions.map((tx, idx) => (
                    <tr key={tx.id}>
                      <td className="text-center italic opacity-40">{idx + 1}</td>
                      <td>{formatDate(tx.date)}</td>
                      <td>
                        <span className="font-black mr-2">{tx.mode}</span>
                        <span className="text-[9px] font-bold opacity-60">{tx.reference || '-'}</span>
                      </td>
                      <td className="text-right font-mono text-green-700">{formatCurrency(tx.amount)}</td>
                    </tr>
                ))
            )}
            {/* Pad rows */}
            {transactions.length < 5 && Array.from({ length: 5 - transactions.length }).map((_, i) => (
              <tr key={`pad-${i}`} className="h-8">
                <td></td><td></td><td></td><td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="mt-8 pt-6 border-t border-black flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-10 items-end">
             <div className="text-[8px] font-bold leading-tight opacity-70 uppercase">
                <p className="font-black mb-1 underline">Note to Customer:</p>
                <p>This is a ledger statement of your payments.</p>
                <p>Please keep this for delivery of goods.</p>
                <p>Interest may apply for delayed payments.</p>
             </div>
             
             <div className="flex justify-between items-end gap-10">
                <div className="text-center flex-1 border-t border-black/40 pt-1">
                   <p className="text-[8px] font-black uppercase">Customer Signature</p>
                </div>
                <div className="text-center flex-1 border-t border-black pt-1">
                   <p className="text-[8px] font-black uppercase">For AR FASHION</p>
                </div>
             </div>
          </div>
          
          <div className="flex justify-between items-center opacity-30">
            <span className="text-[8px] font-black tracking-[0.5em] uppercase">Boutique & Studio</span>
            <span className="text-[8px] font-mono italic text-right">Statement ID: {billNo}-STMT</span>
          </div>
      </div>
    </div>
  );
};
