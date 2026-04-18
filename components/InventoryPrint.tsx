import React from 'react';
import { InventoryItem } from '../types';

interface InventoryPrintProps {
  item: InventoryItem;
  isScreenPreview?: boolean;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return new Date().toLocaleDateString('en-GB');
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

export const InventoryPrint: React.FC<InventoryPrintProps> = ({
  item,
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
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .info-row { border-bottom: 1px solid #eee; padding: 8px 0; display: flex; justify-between: space-between; }
        .label { font-size: 10px; font-weight: 900; color: #666; text-transform: uppercase; letter-spacing: 0.1em; }
        .value { font-size: 12px; font-weight: 900; color: #000; text-transform: uppercase; }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col items-center border-b-2 border-black pb-4 mb-8 text-center">
        <img src="/logo.png" alt="AR FASHION Logo" className="w-20 h-20 mb-2 object-contain" />
        <h1 className="text-xl font-black tracking-[0.2em] mb-2 uppercase opacity-40">Stock Record</h1>
        <div className="text-[10px] font-bold mt-2 leading-tight uppercase tracking-wider">
          <p>Modern Handlooms & Boutique Studio</p>
          <p>BSA Circle, 466, Tannery Rd, AR Colony, DJ Halli - 560045</p>
          <p className="mt-1 opacity-50 font-bold">Ph: +91 99007 24060</p>
        </div>
      </div>

      {/* BARCODE SECTION */}
      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 border-2 border-dashed border-black rounded-sm mb-8">
         <div className="text-4xl font-mono tracking-[0.2em] mb-2 font-black italic">{item.barcode}</div>
         <div className="text-[10px] font-black tracking-widest opacity-40 uppercase">System Barcode Reference</div>
      </div>

      {/* MAIN DETAILS */}
      <div className="flex-1">
         <div className="space-y-4">
            <div className="border-b-2 border-black pb-2 mb-4">
               <span className="text-[10px] font-black opacity-40 uppercase block mb-1">Particulars Name</span>
               <span className="text-2xl font-black uppercase tracking-tight">{item.item_name}</span>
            </div>

            <div className="info-grid mt-6">
               <div className="space-y-4">
                  <div className="info-row">
                     <span className="label">Category</span>
                     <span className="value">{item.category || 'General'}</span>
                  </div>
                  <div className="info-row">
                     <span className="label">HSN Code</span>
                     <span className="value">{item.hsn_code || '6204'}</span>
                  </div>
                  <div className="info-row">
                     <span className="label">Size / Fit</span>
                     <span className="value">{item.size || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                     <span className="label">Color / Shade</span>
                     <span className="value">{item.color || 'N/A'}</span>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div className="info-row">
                     <span className="label">Current Stock</span>
                     <span className="value text-red-600 font-mono">{item.quantity} units</span>
                  </div>
                  <div className="info-row">
                     <span className="label">Unit Rate</span>
                     <span className="value font-mono">{formatCurrency(item.rate)}</span>
                  </div>
                  <div className="info-row">
                     <span className="label">Location</span>
                     <span className="value">{item.location || 'Warehouse'}</span>
                  </div>
                  <div className="info-row">
                     <span className="label">Added On</span>
                     <span className="value font-mono">{formatDate(item.created_at)}</span>
                  </div>
               </div>
            </div>
         </div>

         {/* REMARKS */}
         {item.remarks && (
            <div className="mt-8 p-4 bg-gray-50 rounded border border-gray-100 italic font-bold text-xs">
               <span className="block text-[8px] opacity-40 uppercase not-italic mb-1 font-black underline">Internal Remarks:</span>
               {item.remarks}
            </div>
         )}
      </div>

      {/* FOOTER */}
      <div className="mt-auto pt-6 border-t border-black flex justify-between items-end opacity-40">
         <div className="text-[8px] font-black uppercase tracking-widest italic group">
            EST 2026 • AR FASHION STUDIO
         </div>
         <div className="text-right flex flex-col items-end">
            <span className="text-[8px] font-black uppercase tracking-widest mb-1 italic">Verified Stock</span>
            <div className="w-24 h-6 border border-black/20 italic text-[10px] flex items-center justify-center font-black">
               {item.stock_status?.replace('_', ' ')}
            </div>
         </div>
      </div>
    </div>
  );
};
