
import React, { useState, useEffect, useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { Card, Button, Select, toast } from '../components/UIComponents';
import { supabase } from '../supabaseClient';

// Destructure for safety
const { 
  TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw, 
  ArrowUpRight, ArrowDownRight, Filter, BarChart3, PieChart, 
  ShoppingBag, Info, FileText, Download 
} = Lucide;

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

type ReportRange = 'today' | '7days' | '30days' | 'month' | 'year' | 'all';

export const Reports: React.FC = () => {

  // --- 1. CORE FUNCTIONS (HOISTED) ---

  async function fetchSalesAnalytics() {
    setLoading(true);
    try {
      const now = new Date();
      let query = supabase
        .from('bills')
        .select(`
          *,
          bill_items (
            quantity,
            rate,
            cost_price,
            expenses
          ),
          customer:customers(name)
        `);
      
      const queryDate = new Date();
      if (range === 'today') {
        const today = queryDate.toISOString().split('T')[0];
        query = query.eq('bill_date', today);
      } else if (range === '7days') {
        queryDate.setDate(queryDate.getDate() - 7);
        query = query.gte('bill_date', queryDate.toISOString().split('T')[0]);
      } else if (range === '30days') {
        queryDate.setDate(queryDate.getDate() - 30);
        query = query.gte('bill_date', queryDate.toISOString().split('T')[0]);
      } else if (range === 'month') {
        const startOfMonth = new Date(queryDate.getFullYear(), queryDate.getMonth(), 1).toISOString().split('T')[0];
        query = query.gte('bill_date', startOfMonth);
      } else if (range === 'year') {
        const startOfYear = new Date(queryDate.getFullYear(), 0, 1).toISOString().split('T')[0];
        query = query.gte('bill_date', startOfYear);
      }

      const { data, error } = await query.order('bill_date', { ascending: false });

      if (error) {
        console.error('Supabase Query Error:', error);
        if (error.code === 'PGRST100' || error.message.includes('cost_price')) {
           const basicQuery = await supabase.from('bills').select('*, customer:customers(name)').order('bill_date', { ascending: false });
           setSales(basicQuery.data || []);
           toast({ title: 'Schema Mismatch', description: 'Profit columns missing. Run SQL fix.', variant: 'destructive' });
           return;
        }
        throw error;
      }
      setSales(data || []);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      toast({ title: 'Error', description: 'Failed to load data. Check console.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  // --- 2. STATE ---
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<ReportRange>('30days');

  // --- 3. EFFECTS ---

  useEffect(() => {
    fetchSalesAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalTax = 0;
    
    sales.forEach(sale => {
      totalRevenue += (sale.grand_total || 0);
      totalTax += (sale.gst_amount || 0);
      
      const items = sale.bill_items || [];
      items.forEach((item: any) => {
        totalCost += ((item.cost_price || 0) + (item.expenses || 0)) * (item.quantity || 0);
      });
    });

    totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return { totalRevenue, totalCost, totalProfit, totalTax, count: sales.length, profitMargin };
  }, [sales]);

  // --- 4. VIEW ---

  return (
    <div className="h-full flex flex-col bg-app-bg overflow-hidden relative font-sans">
      
      {/* ----------------- SCREEN VIEW ----------------- */}
      <div className="print:hidden h-full flex flex-col">
        <div className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-charcoal-900 text-gold-500 flex items-center justify-center shadow-md">
                    <BarChart3 size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-charcoal-900 tracking-tight leading-none">Sales Analytics</h2>
                    <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-widest">
                      Performance Report • <span className="text-gold-600 font-bold">{range.toUpperCase()}</span>
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200">
                  {(['today', '7days', '30days', 'month', 'year'] as ReportRange[]).map(r => (
                      <button 
                          key={r}
                          onClick={() => setRange(r)}
                          className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${range === r ? 'bg-white text-charcoal-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                          {r.replace('days', ' Days')}
                      </button>
                  ))}
              </div>
              <div className="h-8 w-px bg-gray-300 mx-1"></div>
              <Button variant="outline" size="sm" onClick={fetchSalesAnalytics} className="bg-white hover:bg-gray-50">
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </Button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gray-50/50">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="!p-6 border-l-4 border-l-gold-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-gold-50 rounded-lg text-gold-600">
                            <DollarSign size={20} />
                        </div>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${stats.count > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                            {stats.count > 0 ? <TrendingUp size={12}/> : null} {stats.count} INVOICES
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Gross Revenue</p>
                        <h3 className="text-3xl font-bold text-charcoal-900 tracking-tight">{formatCurrency(stats.totalRevenue)}</h3>
                    </div>
                </Card>

                <Card className="!p-6 border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <TrendingUp size={20} />
                        </div>
                        <div className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            {stats.profitMargin.toFixed(1)}% MARGIN
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Net Profit</p>
                        <h3 className="text-3xl font-bold text-green-600 tracking-tight">{formatCurrency(stats.totalProfit)}</h3>
                    </div>
                </Card>

                <Card className="!p-6 border-l-4 border-l-charcoal-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-gray-100 rounded-lg text-charcoal-700">
                            <ShoppingBag size={20} />
                        </div>
                        <div className="text-[10px] font-bold text-gray-400">
                            INCL. EXPENSES
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Total Cost</p>
                        <h3 className="text-3xl font-bold text-charcoal-800 tracking-tight">{formatCurrency(stats.totalCost)}</h3>
                    </div>
                </Card>

                <Card className="!p-6 border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <Info size={20} />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">GST Collected</p>
                        <h3 className="text-3xl font-bold text-purple-600 tracking-tight">{formatCurrency(stats.totalTax)}</h3>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex justify-between items-center px-1">
                        <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
                            <FileText size={16} className="text-gold-500"/> Recent Transactions & Profitability
                        </h3>
                        <p className="text-[10px] text-gray-500 font-bold uppercase">{sales.length} Records found</p>
                    </div>
                    
                    <Card className="!p-0 border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200 text-charcoal-700 font-bold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="py-4 px-6">Bill / Customer</th>
                                        <th className="py-4 px-6">Date</th>
                                        <th className="py-4 px-6 text-right">Revenue</th>
                                        <th className="py-4 px-6 text-right">Profit / Loss</th>
                                        <th className="py-4 px-6 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-gray-400 italic">
                                                <Lucide.RefreshCw className="animate-spin mx-auto mb-2" size={24}/>
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Crunching Numbers...</span>
                                            </td>
                                        </tr>
                                    ) : sales.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-20 text-center text-gray-400 italic">
                                                No transactions found for this period.
                                            </td>
                                        </tr>
                                    ) : sales.map(sale => {
                                        const revenue = sale.grand_total || 0;
                                        let cost = 0;
                                        (sale.bill_items || []).forEach((item: any) => {
                                            cost += ((item.cost_price || 0) + (item.expenses || 0)) * (item.quantity || 0);
                                        });
                                        const profit = revenue - cost;
                                        const isProfit = profit >= 0;

                                        return (
                                            <tr key={sale.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="py-4 px-6">
                                                    <div className="font-mono font-bold text-charcoal-900 text-xs">{sale.bill_no}</div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-medium">{sale.customer?.name || 'Walk-in'}</div>
                                                </td>
                                                <td className="py-4 px-6 text-xs text-gray-600">{formatDate(sale.bill_date)}</td>
                                                <td className="py-4 px-6 text-right font-mono font-bold text-charcoal-900 text-xs">{formatCurrency(revenue)}</td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className={`font-mono font-bold text-xs flex flex-col items-end ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
                                                        <span>{formatCurrency(profit)}</span>
                                                        <span className="text-[8px] opacity-70 uppercase tracking-tighter">
                                                            {revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0}% margin
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${isProfit ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        {isProfit ? <ArrowUpRight size={10}/> : <ArrowDownRight size={10}/>}
                                                        {isProfit ? 'PROFIT' : 'LOSS'}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <div className="px-1 pt-0.5">
                        <h3 className="text-sm font-bold text-charcoal-900 uppercase tracking-wider flex items-center gap-2">
                            <PieChart size={16} className="text-gold-500"/> Insights & Trends
                        </h3>
                    </div>

                    <Card className="shadow-sm border border-gray-200">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-gray-100 pb-3 flex items-center justify-between">
                            <span>Revenue Breakdown</span>
                            <span className="bg-charcoal-100 text-charcoal-600 px-2 rounded-full">ESTIMATED</span>
                        </h4>
                        
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-charcoal-800 mb-2">
                                    <span>Gross Profit</span>
                                    <span>{formatCurrency(stats.totalProfit)}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-green-500 rounded-full transition-all duration-1000" 
                                      style={{ width: `${Math.min(100, Math.max(0, stats.profitMargin))}%` }}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-bold text-charcoal-800 mb-2">
                                    <span>Cost Basis</span>
                                    <span>{formatCurrency(stats.totalCost)}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-charcoal-800 rounded-full transition-all duration-1000" 
                                      style={{ width: `${Math.min(100, 100 - stats.profitMargin)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="bg-charcoal-900 rounded-xl p-4 text-center text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700"/>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Average Order Value</p>
                                    <h5 className="text-2xl font-bold text-gold-500 font-mono">
                                        {formatCurrency(stats.totalRevenue / (stats.count || 1))}
                                    </h5>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-charcoal-900 to-black text-white p-6 shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                          <TrendingUp className="text-gold-500 mb-4" size={32} />
                          <h4 className="text-lg font-bold mb-2 tracking-tight">Generate Final Report</h4>
                          <p className="text-xs text-gray-400 mb-6 leading-relaxed">Download a comprehensive PDF version of your sales analytics and profit/loss statement for financial auditing.</p>
                          <Button fullWidth onClick={() => window.print()} className="bg-gold-500 text-charcoal-900 font-bold border-none hover:bg-gold-600 shadow-lg">
                             <Download size={16} className="mr-2" /> Export to PDF
                          </Button>
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gold-500/10 rounded-full blur-2xl"/>
                    </Card>
                </div>
            </div>
        </div>
      </div>

      {/* ----------------- PROFESSIONAL PRINT VIEW (Hidden on Screen) ----------------- */}
      <div className="hidden print:block p-10 bg-white text-black font-sans w-full min-h-screen">
          <div className="border-b-4 border-black pb-6 mb-8 flex justify-between items-end">
              <div>
                  <h1 className="text-4xl font-black tracking-tighter text-black uppercase">AR FASHION</h1>
                  <p className="text-sm font-bold tracking-widest text-gray-600 uppercase">Statement of Sales & Profitability</p>
              </div>
              <div className="text-right">
                  <p className="text-[10px] font-bold uppercase text-gray-500">Report Range</p>
                  <p className="text-lg font-black uppercase text-black">{range.replace('days', ' Days')}</p>
                  <p className="text-[8px] text-gray-400">Generated on {new Date().toLocaleString()}</p>
              </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-10">
              <div className="border-2 border-black p-4">
                  <p className="text-[8px] font-bold uppercase text-gray-500 mb-1">Gross Revenue</p>
                  <p className="text-xl font-black">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="border-2 border-black p-4">
                  <p className="text-[8px] font-bold uppercase text-gray-500 mb-1">Total Cost Basis</p>
                  <p className="text-xl font-black">{formatCurrency(stats.totalCost)}</p>
              </div>
              <div className="border-2 border-black p-4 bg-gray-50">
                  <p className="text-[8px] font-bold uppercase text-gray-500 mb-1">Net Trading Profit</p>
                  <p className="text-xl font-black">{formatCurrency(stats.totalProfit)}</p>
              </div>
              <div className="border-2 border-black p-4">
                  <p className="text-[8px] font-bold uppercase text-gray-500 mb-1">Performance Margin</p>
                  <p className="text-xl font-black">{stats.profitMargin.toFixed(2)}%</p>
              </div>
          </div>

          <h3 className="text-xs font-black uppercase border-b-2 border-black pb-1 mb-4 italic">Transaction Audit Log</h3>
          <table className="w-full text-xs mb-10 border-collapse">
              <thead>
                  <tr className="border-b-2 border-black text-left">
                      <th className="py-2 px-1">Bill No</th>
                      <th className="py-2 px-1">Date</th>
                      <th className="py-2 px-1">Customer</th>
                      <th className="py-2 px-1 text-right">Revenue</th>
                      <th className="py-2 px-1 text-right">Cost</th>
                      <th className="py-2 px-1 text-right">Profit</th>
                      <th className="py-2 px-1 text-center">Status</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                  {sales.map(sale => {
                      const revenue = sale.grand_total || 0;
                      let cost = 0;
                      (sale.bill_items || []).forEach((item: any) => {
                          cost += ((item.cost_price || 0) + (item.expenses || 0)) * (item.quantity || 0);
                      });
                      const profit = revenue - cost;
                      return (
                          <tr key={sale.id} className="py-2">
                              <td className="py-2 px-1 font-bold">{sale.bill_no}</td>
                              <td className="py-2 px-1 text-gray-600">{formatDate(sale.bill_date)}</td>
                              <td className="py-2 px-1">{sale.customer?.name || 'Walk-in'}</td>
                              <td className="py-2 px-1 text-right font-bold">{formatCurrency(revenue)}</td>
                              <td className="py-2 px-1 text-right">{formatCurrency(cost)}</td>
                              <td className="py-2 px-1 text-right font-bold">{formatCurrency(profit)}</td>
                              <td className="py-2 px-1 text-center font-bold">
                                  {profit >= 0 ? '[ PROFIT ]' : '[ LOSS ]'}
                              </td>
                          </tr>
                      );
                  })}
              </tbody>
          </table>

          <div className="mt-20 border-t border-black pt-10 grid grid-cols-2">
             <div>
                <p className="text-[10px] font-bold uppercase mb-10">Certification</p>
                <div className="w-48 h-px bg-black mb-1"></div>
                <p className="text-[8px] font-bold uppercase">Authorized Signature</p>
             </div>
             <div className="text-right">
                <p className="text-[8px] italic text-gray-500">Document generated via AR ERP Analytic Engine. Integrity of data is based on the system records at the time of export.</p>
             </div>
          </div>
      </div>
    </div>
  );
};
