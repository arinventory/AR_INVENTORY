
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Download, 
  RefreshCw, 
  Eye, 
  Printer, 
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { Button, Card, toast } from '../components/UIComponents';
import { supabase } from '../supabaseClient';
import { deleteBill } from '../db';
import { InvoicePrint } from '../components/InvoicePrint';

// --- HELPERS ---

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// --- COMPONENT ---

interface AllSalesProps {
  onEdit?: (billId: string) => void;
}

export const AllSales: React.FC<AllSalesProps> = ({ onEdit }) => {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'GST' | 'NON GST'>('ALL');

  // Print State
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<any>(null);

  const fetchSales = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bills')
        .select('*, customers(name, phone)')
        .order('created_at', { ascending: false });

      if (fromDate) {
        query = query.gte('bill_date', fromDate);
      }
      if (toDate) {
        query = query.lte('bill_date', toDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSales(data || []);
    } catch (err: any) {
      console.error('Error fetching sales:', err);
      toast({ title: 'Error', description: 'Failed to load sales history.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [fromDate, toDate]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, fromDate, toDate]);

  // --- DERIVED STATE ---

  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const term = searchTerm.toLowerCase();
      const customerName = sale.customers?.name?.toLowerCase() || '';
      const customerPhone = sale.customers?.phone || '';
      const billNo = sale.bill_no?.toLowerCase() || '';
      
      const matchesSearch = customerName.includes(term) || customerPhone.includes(term) || billNo.includes(term);
      
      // Normalize database type for matching
      const rawType = (sale.sale_type || '').toUpperCase();
      const normalizedSaleType = (rawType === 'NOGST' || rawType === 'NONGST' || rawType === 'NON_GST') ? 'NON GST' : rawType;
      const matchesType = typeFilter === 'ALL' || normalizedSaleType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [sales, searchTerm, typeFilter]);

  const stats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.grand_total || 0), 0);
    const count = filteredSales.length;
    const avgValue = count > 0 ? totalRevenue / count : 0;

    return { totalRevenue, count, avgValue };
  }, [filteredSales]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this bill? This cannot be undone.')) return;
    try {
      await deleteBill(id);
      toast({ title: 'Bill Deleted', description: 'The record has been permanently removed.' });
      fetchSales();
    } catch (err) {
      console.error('Delete error:', err);
      toast({ title: 'Error', description: 'Failed to delete the bill.', variant: 'destructive' });
    }
  };

  const handlePrint = (sale: any) => {
    // Need to fetch items if they aren't loaded, but they aren't in the main sales list
    // For simplicity, let's fetch full bill data including items before printing
    const preparePrint = async () => {
       const { data: items, error } = await supabase
         .from('bill_items')
         .select('*')
         .eq('bill_id', sale.id);
       
       if (error) {
         toast({ title: 'Error', description: 'Failed to load bill items for printing.' });
         return;
       }

       const printObj = {
         ...sale,
         items: items.map(item => ({
           ...item,
           weight: item.weight || 0,
           line_total: item.line_total || 0
         })),
         totals: {
           itemsSubtotal: sale.subtotal,
           baseTaxable: sale.subtotal, // Simplified for now
           gstAmount: sale.gst_amount,
           grandTotal: sale.grand_total
         }
       };

       setSelectedBillForPrint(printObj);
       setTimeout(() => {
         window.print();
         setSelectedBillForPrint(null);
       }, 500);
    };
    preparePrint();
  };

  // --- RENDER ---

  return (
    <div className="h-full flex flex-col bg-app-bg overflow-hidden relative">
      
      {/* 1. DASHBOARD HEADER (KPIs) */}
      <div className="p-6 pb-2 grid grid-cols-3 gap-6 print:hidden">
        <Card className="border-l-4 border-l-gold-500 !p-4 flex items-center justify-between shadow-sm">
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-2xl font-bold text-charcoal-900 mt-1">{formatCurrency(stats.totalRevenue)}</h3>
           </div>
           <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center text-gold-600">
             <DollarSign size={20} />
           </div>
        </Card>

        <Card className="border-l-4 border-l-charcoal-700 !p-4 flex items-center justify-between shadow-sm">
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Bills Generated</p>
              <h3 className="text-2xl font-bold text-charcoal-900 mt-1">{stats.count}</h3>
           </div>
           <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-charcoal-700">
             <FileText size={20} />
           </div>
        </Card>

        <Card className="border-l-4 border-l-green-500 !p-4 flex items-center justify-between shadow-sm">
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg. Bill Value</p>
              <h3 className="text-2xl font-bold text-charcoal-900 mt-1">{formatCurrency(stats.avgValue)}</h3>
           </div>
           <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
             <TrendingUp size={20} />
           </div>
        </Card>
      </div>

      {/* 2. FILTERS & ACTIONS */}
      <div className="px-6 py-4 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Search Bill No, Customer..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Date Picker Range */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-md p-1 shadow-sm">
             <div className="flex items-center gap-1.5 px-2 border-r border-gray-200">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-[10px] font-bold text-gray-400 uppercase">From</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none text-xs text-charcoal-700 focus:ring-0 p-0"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-1.5 px-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase">To</span>
                <input 
                  type="date" 
                  className="bg-transparent border-none text-xs text-charcoal-700 focus:ring-0 p-0"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
             </div>
             {(fromDate || toDate) && (
               <button 
                 onClick={() => { setFromDate(''); setToDate(''); }} 
                 className="p-1 text-red-500 hover:bg-red-50 rounded"
                 title="Clear Dates"
               >
                 <X size={14} />
               </button>
             )}
          </div>

          {/* Type Filter */}
          <div className="flex bg-white rounded-md border border-gray-300 p-1 shadow-sm">
             {(['ALL', 'GST', 'NON GST'] as const).map(type => (
               <button
                 key={type}
                 onClick={() => setTypeFilter(type)}
                 className={`px-3 py-1 text-xs font-bold rounded transition-colors ${typeFilter === type ? 'bg-charcoal-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
               >
                 {type === 'NON GST' ? 'Non-GST' : type}
               </button>
             ))}
          </div>
        </div>
        
        <div className="flex gap-3">
           <Button variant="outline" size="sm" onClick={fetchSales} className="bg-white hover:bg-gray-50">
             <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
           </Button>
           <Button variant="secondary" size="sm" className="shadow-sm border-green-600 text-green-700 hover:bg-green-50">
             <FileText size={16} className="mr-2" /> Export Excel
           </Button>
        </div>
      </div>

      {/* 3. TABLE AREA */}
      <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col print:hidden">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex-col flex h-full">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-charcoal-700 font-bold uppercase text-[11px] tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-6">Bill No</th>
                  <th className="py-3 px-6">Date</th>
                  <th className="py-3 px-6">Customer Details</th>
                  <th className="py-3 px-6 text-right">Subtotal</th>
                  <th className="py-3 px-6 text-right">Tax</th>
                  <th className="py-3 px-6 text-right">Grand Total</th>
                  <th className="py-3 px-6 text-center">Type</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                   <tr>
                     <td colSpan={8} className="py-20 text-center text-gray-400">
                       <div className="flex flex-col items-center gap-2">
                         <RefreshCw className="animate-spin text-gold-500" size={24} />
                         <span className="text-xs uppercase font-bold tracking-wide">Retrieving Records...</span>
                       </div>
                     </td>
                   </tr>
                ) : filteredSales.length === 0 ? (
                   <tr>
                     <td colSpan={8} className="py-20 text-center text-gray-400">
                       No sales records found matching your filters.
                     </td>
                   </tr>
                ) : (
                  paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="py-4 px-6 font-bold text-charcoal-900 font-mono text-xs">{sale.bill_no}</td>
                      <td className="py-4 px-6 text-gray-600 text-xs">{formatDate(sale.bill_date)}</td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-charcoal-800 text-sm">{sale.customers?.name || 'Walk-in Customer'}</div>
                        <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wide">{sale.customers?.phone || '-'}</div>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-gray-500 text-xs">
                        {formatCurrency(sale.subtotal)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-gray-500 text-xs">
                        {formatCurrency(sale.gst_amount)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono font-bold text-charcoal-900 text-sm">
                        {formatCurrency(sale.grand_total)}
                      </td>
                      <td className="py-4 px-6 text-center">
                         <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                           sale.sale_type === 'gst' 
                             ? 'bg-purple-50 text-purple-700 border-purple-100' 
                             : 'bg-gray-100 text-gray-600 border-gray-200'
                         }`}>
                           {sale.sale_type}
                         </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            className="p-1.5 hover:bg-gold-50 rounded text-gold-600 transition-colors" 
                            title="Print Bill"
                            onClick={() => handlePrint(sale)}
                          >
                            <Printer size={16} />
                          </button>
                          <button 
                            className="p-1.5 hover:bg-blue-50 rounded text-blue-600 transition-colors" 
                            title="Edit Bill"
                            onClick={() => onEdit?.(sale.id)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors" 
                            title="Delete Bill"
                            onClick={() => handleDelete(sale.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* PAGINATION FOOTER */}
          <div className="bg-gray-50 border-t border-gray-200 p-3 px-6 flex justify-between items-center text-xs">
             <div className="text-gray-500">
               Showing <span className="font-bold">{paginatedSales.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredSales.length)}</span> of <span className="font-bold">{filteredSales.length}</span> records
             </div>
             
             <div className="flex items-center gap-2">
               <button 
                 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                 disabled={currentPage === 1}
                 className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               >
                 <ChevronLeft size={16} />
               </button>
               
               <span className="font-mono font-bold text-charcoal-700">
                 Page {currentPage} / {totalPages || 1}
               </span>

               <button 
                 onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                 disabled={currentPage === totalPages || totalPages === 0}
                 className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               >
                 <ChevronRight size={16} />
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* 4. PRINT PREVIEW (HIDDEN ON SCREEN) */}
      <div className="hidden print:block">
        {selectedBillForPrint && (
          <InvoicePrint 
            billNo={selectedBillForPrint.bill_no}
            billDate={selectedBillForPrint.bill_date}
            saleType={selectedBillForPrint.sale_type.toUpperCase() === 'GST' ? 'GST' : 'NON GST'}
            customer={selectedBillForPrint.customers}
            items={selectedBillForPrint.items}
            allMetalRates={{}} // Not strictly needed for printing historical bills if totals are pre-calculated
            totals={selectedBillForPrint.totals}
            oldGold={{ weight: 0, purity: 0, rate: 0, total: 0 }} // Simplified for now
            mcValueAdded={{ weight: 0, rate: 0, total: 0 }} // Simplified for now
            paymentMethods={[]} // Simplified for now
          />
        )}
      </div>

    </div>
  );
};
