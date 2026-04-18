
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Search, 
  ScanLine, 
  ChevronDown, 
  ChevronUp, 
  CreditCard,
  Printer,
  X,
  FileText,
  Eye,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { Input, Button, Select, Card, toast } from '../components/UIComponents';
import { BillItem, PaymentRecord, Customer } from '../types';
import { supabase } from '../supabaseClient';
import { generateBillNo, createBill, createBillItems, updateBill, createCustomer, searchCustomers } from '../db';
import { InvoicePrint } from '../components/InvoicePrint';
import { ExchangePrint } from '../components/ExchangePrint';

// --- HELPERS ---

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);

const numberToWords = (num: number): string => {
  if (num === 0) return "Zero Rupees Only";
  return `Rupees ${num.toFixed(0)} Only`; 
};

const roundToWhole = (num: number) => Math.round(num);

interface SalesBillProps {
  billId?: string;
  onClearEdit?: () => void;
}

export const SalesBill: React.FC<SalesBillProps> = ({ billId, onClearEdit }) => {
  // --- AUTH / CONTEXT STATE ---
  const [staffId, setStaffId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        if (user.id) setStaffId(user.id);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  const resetForm = () => {
    setBillNo('');
    setBillDate(new Date().toISOString().split('T')[0]);
    setCustomer(null);
    setItems([]);
    setPaymentMethods([]);
    setAmountPayableInput('');
  };

  useEffect(() => {
    const loadBillData = async () => {
      if (!billId) {
        resetForm();
        try {
          const nextNo = await generateBillNo();
          setBillNo(nextNo);
          const nextVNo = await generateBillNo();
          setVoucherNo(nextVNo);
        } catch (err) {
          console.error("Error fetching bill number:", err);
        }
        return;
      }
      
      try {
        setLoading(true);
        // Load bill
        const { data: bill, error: billError } = await supabase
          .from('bills')
          .select('*, customers(*)')
          .eq('id', billId)
          .single();
        
        if (billError) throw billError;


        // Set state
        setBillNo(bill.bill_no);
        setBillDate(bill.bill_date);
        
        // Normalize sale type for UI compatibility
        const rawType = (bill.sale_type || '').toUpperCase();
        const normalizedType = (rawType === 'NOGST' || rawType === 'NONGST' || rawType === 'NON_GST') ? 'NON GST' : rawType;
        setSaleType(normalizedType as 'GST' | 'NON GST');

        setCustomer(bill.customers as Customer);
        
        // Load items
        const { data: billItems, error: itemsError } = await supabase
          .from('bill_items')
          .select('*')
          .eq('bill_id', billId)
          .order('sl_no', { ascending: true });

        if (itemsError) throw itemsError;

        // Handle items
        const formattedItems: BillItem[] = (billItems || [])
          .map(item => ({
            id: item.id,
            barcode: item.barcode || '',
            item_name: item.item_name,
            quantity: item.quantity,
            rate: item.rate,
            line_total: item.line_total,
            hsn_code: item.hsn_code || '6204'
          }));
        setItems(formattedItems);

        // Handle Payments
        if (bill.payment_method) {
          try {
            const payments = JSON.parse(bill.payment_method);
            setPaymentMethods(payments);
          } catch (e) {
            console.error("Error parsing payments", e);
          }
        }

        toast({ title: "Bill Loaded", description: `Editing ${bill.bill_no}` });
      } catch (err: any) {
        console.error("Error loading bill:", err);
        toast({ title: "Error", description: "Failed to load bill data", variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };

    loadBillData();
  }, [billId]);

  // --- PRINT / PREVIEW STATE ---
  const [activePrintView, setActivePrintView] = useState<'invoice'>('invoice');
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // --- CUSTOMER STATE ---
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerMatches, setCustomerMatches] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', address: '' });



  // --- BILL ITEM STATE ---
  const [items, setItems] = useState<BillItem[]>([]);
  const [newItem, setNewItem] = useState({
    item_name: '',
    quantity: 1,
    quantityInput: '1',
    rate: 0,
    rateInput: '',
    hsn_code: '6204',
  });
  const [isLoadingItem, setIsLoadingItem] = useState(false);

  // --- BILL META STATE ---
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [billNo, setBillNo] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [saleType, setSaleType] = useState<'GST' | 'NON GST'>('GST');
  const GST_RATE = 0.05; // Standard 5% for Apparel
  


  // --- PAYMENT STATE ---
  const [paymentMethods, setPaymentMethods] = useState<PaymentRecord[]>([]);
  const [currentPayment, setCurrentPayment] = useState<{type: string, amount: string, reference: string}>({
    type: 'cash', amount: '', reference: ''
  });

  // --- TOTALS STATE ---
  const [amountPayableInput, setAmountPayableInput] = useState<string>(''); 
  const [calculatedTotals, setCalculatedTotals] = useState({
    itemsSubtotal: 0,
    baseTaxable: 0,
    gstAmount: 0,
    grandTotal: 0
  });

  const isReverseCalculating = useRef(false);

  // --- EFFECTS ---
  


  // --- CALCULATION ---

  useEffect(() => {
    if (isReverseCalculating.current) return;

    const itemsSubtotal = items.reduce((sum, item) => sum + item.line_total, 0);
    const preGstTotal = itemsSubtotal;

    // GST is 5% for clothes usually, but keeping user's GST_RATE or making it selectable
    // User image says "ESTIMATE" sometimes, but let's stick to simple GST math if active
    const gstRaw = saleType === 'GST' ? preGstTotal * GST_RATE : 0; 
    const gstAmount = roundToWhole(gstRaw);
    const grandTotal = itemsSubtotal + gstAmount;

    setCalculatedTotals({
      itemsSubtotal,
      baseTaxable: itemsSubtotal, 
      gstAmount,
      grandTotal
    });

    if (Math.abs(grandTotal - (parseFloat(amountPayableInput) || 0)) > 1) {
       setAmountPayableInput(grandTotal > 0 ? grandTotal.toFixed(0) : '');
    }
  }, [items, saleType]);

  const handleAmountPayableChange = (val: string) => {
    setAmountPayableInput(val);
    const targetAmount = parseFloat(val);
    if (isNaN(targetAmount)) return;
    // No reverse calculation for fashion store yet, keep it simple
  };

  // --- ACTIONS ---

  useEffect(() => {
    if (!customerSearch.trim()) {
      setCustomerMatches([]);
      setShowCustomerDropdown(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchCustomers(customerSearch);
        setCustomerMatches(data || []);
        setShowCustomerDropdown(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  const handleAddItem = () => {
    const qty = parseFloat(newItem.quantityInput) || 1;
    const rate = parseFloat(newItem.rateInput) || 0;

    if (!newItem.item_name || rate <= 0) {
      toast({ title: "Invalid Item", description: "Name and Rate are required", variant: 'destructive' });
      return;
    }

    const lineTotal = qty * rate;
    setItems([...items, {
      id: Date.now().toString(),
      item_name: newItem.item_name,
      quantity: qty,
      rate: rate,
      line_total: lineTotal,
      hsn_code: newItem.hsn_code
    }]);
    
    setNewItem({
      item_name: '',
      quantity: 1,
      quantityInput: '1',
      rate: 0,
      rateInput: '',
      hsn_code: '6204',
    });
  };

  const handleRemoveItem = (id: string) => setItems(items.filter(i => i.id !== id));


  const handleAddPayment = () => {
    const amt = parseFloat(currentPayment.amount);
    if (isNaN(amt) || amt <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid payment amount", variant: 'destructive' });
      return;
    }
    setPaymentMethods([...paymentMethods, {
      id: Date.now().toString(),
      type: currentPayment.type as any,
      amount: currentPayment.amount,
      reference: currentPayment.reference
    }]);
    setCurrentPayment({ ...currentPayment, amount: '', reference: '' });
  };

  const handleRemovePayment = (id: string) => setPaymentMethods(paymentMethods.filter(p => p.id !== id));

  // --- PRINT / PREVIEW LOGIC ---

  const handleOpenPreview = (type: 'invoice' | 'exchange') => {
    setActivePrintView(type);
    setShowPreviewModal(true);
  };

  const handleActualPrint = () => {
    setShowPreviewModal(false);
    setTimeout(() => window.print(), 100);
  };

  const handleSaveBill = async () => {
    if (!customer || items.length === 0 || !staffId) {
      toast({ 
        title: "Error", 
        description: !staffId ? "Session expired. Please re-login." : "Please check items and customer details.", 
        variant: 'destructive' 
      });
      return;
    }
    setLoading(true);
    try {
      const billData = {
        bill_no: billNo || await generateBillNo(),
        bill_date: billDate,
        customer_id: customer.id,
        staff_id: staffId,
        sale_type: saleType === 'NON GST' ? 'nongst' : 'gst',
        subtotal: calculatedTotals.itemsSubtotal,
        gst_amount: calculatedTotals.gstAmount,
        grand_total: calculatedTotals.grandTotal,
        discount: 0,
        payment_method: JSON.stringify(paymentMethods),
        bill_status: 'final'
      };

      let savedBill;
      if (billId) {
        savedBill = await updateBill(parseInt(billId), billData);
        await supabase.from('bill_items').delete().eq('bill_id', billId);
      } else {
        savedBill = await createBill(billData);
        setBillNo(billData.bill_no);
      }
      
      const billItems = items.map((item, idx) => ({
        bill_id: savedBill.id, 
        item_name: item.item_name,
        quantity: item.quantity,
        rate: item.rate,
        line_total: item.line_total,
        sl_no: idx + 1,
        hsn_code: item.hsn_code || '6204'
      }));

      await createBillItems(savedBill.id, billItems);
      toast({ title: "Success", description: billId ? "Bill updated successfully!" : "Bill saved successfully!" });
      handleOpenPreview('invoice');
    } catch (err: any) {
      toast({ title: "Error Saving", description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const totalPaid = paymentMethods.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const balanceDue = calculatedTotals.grandTotal - totalPaid;

  return (
    <div className="flex h-full bg-app-bg relative">
      
      {/* 1. PRINT COMPONENTS */}
      <div className="print-block">
        {activePrintView === 'invoice' ? (
          <InvoicePrint 
            billNo={billNo} billDate={billDate} saleType={saleType}
            customer={customer} items={items}
            totals={calculatedTotals} paymentMethods={paymentMethods}
          />
        ) : (
          <ExchangePrint
            billNo={billNo} billDate={billDate} saleType={saleType}
            customer={customer} items={items}
            totals={calculatedTotals}
          />
        )}
      </div>

      {/* 2. ON-SCREEN PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[100] bg-charcoal-900/80 backdrop-blur-md flex items-center justify-center p-8 print:hidden">
           <div className="bg-gray-100 w-full max-w-[1000px] h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
              <div className="bg-charcoal-900 px-8 py-5 flex justify-between items-center text-white shrink-0 shadow-lg">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-gold-500 text-charcoal-900 flex items-center justify-center font-bold">
                     <Eye size={20}/>
                   </div>
                   <div>
                     <h3 className="font-bold text-lg tracking-wide uppercase">Print Preview</h3>
                     <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Verifying details before final print</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                    <Button onClick={handleActualPrint} variant="secondary" className="bg-gold-500 text-charcoal-900 border-none hover:bg-gold-600 shadow-xl">
                       <Printer size={18} className="mr-2"/> Send to Printer
                    </Button>
                    <button onClick={() => setShowPreviewModal(false)} className="p-2 text-gray-400 hover:text-white transition-colors bg-white/10 rounded-full">
                       <X size={24}/>
                    </button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto bg-gray-200 p-8 custom-scrollbar">
                <div className="scale-90 origin-top">
                  {activePrintView === 'invoice' ? (
                    <InvoicePrint 
                      isScreenPreview
                      billNo={billNo} billDate={billDate} saleType={saleType}
                      customer={customer} items={items}
                      totals={calculatedTotals} paymentMethods={paymentMethods}
                    />
                  ) : (
                    <ExchangePrint
                      isScreenPreview
                      billNo={billNo} billDate={billDate} saleType={saleType}
                      customer={customer} items={items}
                      totals={calculatedTotals}
                    />
                  )}
                </div>
              </div>
           </div>
        </div>
      )}
      
      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 p-6 overflow-y-auto pb-32 space-y-6 print:hidden">
        {/* Customer & Meta */}
        <div className="grid grid-cols-2 gap-6">
          <Card className="shadow-sm">
             {!showAddCustomerForm ? (
               <div className="flex items-end gap-3 relative">
                  <div className="flex-1 relative">
                    <Input 
                      label="Customer Name / Mobile" 
                      icon={isSearching ? <div className="animate-spin w-4 h-4 border-2 border-gold-500 rounded-full border-t-transparent"/> : <Search size={16} />} 
                      placeholder="M/s..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onFocus={() => setShowCustomerDropdown(true)}
                    />
                    {showCustomerDropdown && customerMatches.length > 0 && (
                      <div className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-lg rounded-md mt-1 z-50 max-h-48 overflow-auto">
                        {customerMatches.map(cust => (
                          <div key={cust.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0" onClick={() => handleSelectCustomer(cust)}>
                            <div className="flex justify-between items-center">
                              <p className="font-bold text-sm text-charcoal-900">{cust.name}</p>
                            </div>
                            <p className="text-xs text-gray-500">{cust.phone}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="secondary" onClick={() => setShowAddCustomerForm(true)} className="mb-[1px]">+ New</Button>
               </div>
             ) : (
               <div className="space-y-3 p-1">
                 <h4 className="text-xs font-bold uppercase text-gold-600">Add New Customer</h4>
                 <div className="flex gap-2">
                   <Input placeholder="Name" value={newCustomerData.name} onChange={e => setNewCustomerData({...newCustomerData, name: e.target.value})} />
                   <Input placeholder="Phone" value={newCustomerData.phone} onChange={e => setNewCustomerData({...newCustomerData, phone: e.target.value})} />
                 </div>
                 <Input placeholder="GSTIN (Optional)" value={newCustomerData.address} onChange={e => setNewCustomerData({...newCustomerData, address: e.target.value})} />
                 <div className="flex gap-2">
                   <Button size="sm" onClick={handleAddNewCustomer}>Save</Button>
                   <Button size="sm" variant="ghost" onClick={() => setShowAddCustomerForm(false)}>Cancel</Button>
                 </div>
               </div>
             )}
             {customer && !showAddCustomerForm && (
               <div className="mt-3 p-3 bg-gold-100/50 rounded border border-gold-500/20 flex justify-between items-center">
                 <div>
                   <p className="font-bold text-charcoal-900">{customer.name}</p>
                   <p className="text-xs text-gray-600 font-mono">{customer.phone}</p>
                 </div>
                 <button onClick={() => setCustomer(null)} className="text-xs text-red-500 hover:underline font-bold">Change</button>
               </div>
             )}
          </Card>
          <Card className="shadow-sm">
              <div className="flex gap-4">
                <div className="flex-1"><Input type="date" label="Memo Date" value={billDate} isMonospaced onChange={(e) => setBillDate(e.target.value)} /></div>
                <div className="flex-1"><Select label="Bill Type" value={saleType} onChange={(e) => setSaleType(e.target.value as any)} options={[{ value: 'GST', label: 'Cash Memo' }, { value: 'NON GST', label: 'Estimate' }]} /></div>
              </div>
          </Card>
        </div>

        {/* Add Items */}
        <Card title="Add Particulars">
          <div className="grid grid-cols-12 gap-3 items-end mb-6">
            <div className="col-span-6"><Input label="Particulars (Description)" placeholder="e.g. Cotton Shirt - Blue" value={newItem.item_name} onChange={(e) => setNewItem({...newItem, item_name: e.target.value})} /></div>
            <div className="col-span-2"><Input label="Qnty" type="number" isMonospaced value={newItem.quantityInput} onChange={(e) => setNewItem({...newItem, quantityInput: e.target.value})} /></div>
            <div className="col-span-3"><Input label="Rate (₹)" type="number" isMonospaced value={newItem.rateInput} onChange={(e) => setNewItem({...newItem, rateInput: e.target.value})} /></div>
            <div className="col-span-1 flex justify-end"><Button onClick={handleAddItem} className="!px-3 bg-charcoal-900 text-white hover:bg-black"><Plus size={20} /></Button></div>
          </div>
          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-charcoal-900 text-white font-bold uppercase text-xs">
                <tr>
                  <th className="py-3 px-4 w-12">No.</th>
                  <th className="py-3 px-4">Particulars</th>
                  <th className="py-3 px-4 text-center w-24">Qnty</th>
                  <th className="py-3 px-4 text-right w-32">Rate</th>
                  <th className="py-3 px-4 text-right w-40">Amount</th>
                  <th className="py-3 px-4 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {items.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-400 italic font-medium">No items added to this memo yet.</td></tr>
                ) : items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors text-charcoal-900 font-medium">
                    <td className="py-3 px-4 text-gray-400">{idx + 1}</td>
                    <td className="py-3 px-4 uppercase">{item.item_name}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.rate)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{formatCurrency(item.line_total)}</td>
                    <td className="py-3 px-4 text-center"><button onClick={() => handleRemoveItem(item.id)} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Action Panel */}
      <div className="w-[420px] bg-white border-l border-gray-300 flex flex-col z-40 h-full shadow-lg print:hidden">
        <div className="p-5 border-b border-gray-200 bg-charcoal-900 text-white font-bold uppercase tracking-wider text-sm flex justify-between items-center">
          <span>{billId ? `Memo: ${billNo}` : 'Bill Summary'}</span>
        </div>
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Totals */}
          <div className="space-y-4 pb-6 border-b border-gray-200">
             <div className="flex justify-between items-center text-gray-500 font-medium"><span>Subtotal Amount</span><span className="font-mono font-bold text-charcoal-900">{formatCurrency(calculatedTotals.itemsSubtotal)}</span></div>
             <div className="flex justify-between items-center text-gray-500 font-medium"><span>GST (5%)</span><span className="font-mono font-bold text-charcoal-900">{formatCurrency(calculatedTotals.gstAmount)}</span></div>
             <div className="bg-charcoal-900 rounded-xl p-6 text-center shadow-lg border-2 border-gold-500/20">
               <p className="text-xs text-gold-500 font-bold uppercase mb-4 tracking-[0.2em]">Grand Total</p>
               <div className="inline-flex items-center gap-3"><span className="text-4xl text-white font-bold">{formatCurrency(calculatedTotals.grandTotal)}</span></div>
               <p className="text-[10px] text-gray-400 mt-4 uppercase font-bold tracking-tight">{numberToWords(calculatedTotals.grandTotal)}</p>
             </div>
          </div>

          {/* Payment */}
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
             <h4 className="text-xs font-bold uppercase flex items-center gap-2 text-charcoal-700">Payment Details</h4>
             <div className="grid grid-cols-2 gap-3">
               <Select value={currentPayment.type} onChange={e => setCurrentPayment({...currentPayment, type: e.target.value})} options={[{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }, { value: 'card', label: 'Card' }]} />
               <Input type="number" placeholder="Enter Amount" value={currentPayment.amount} onChange={e => setCurrentPayment({...currentPayment, amount: e.target.value})} />
             </div>
             <Button fullWidth onClick={handleAddPayment} className="bg-charcoal-900 text-gold-500 border-none shadow-lg font-bold">Add Payment</Button>
          </div>

          {/* Payment List */}
          {paymentMethods.length > 0 && (
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
               <table className="w-full text-xs divide-y divide-gray-100">
                 <tbody>
                   {paymentMethods.map(p => (<tr key={p.id} className="bg-white hover:bg-gray-50"><td className="p-3 font-bold uppercase text-charcoal-700">{p.type}</td><td className="p-3 text-right font-mono font-bold text-charcoal-900">{formatCurrency(parseFloat(p.amount))}</td><td className="p-3 text-center w-8"><button onClick={() => handleRemovePayment(p.id)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={14}/></button></td></tr>))}
                   <tr className="bg-charcoal-900 text-white font-bold"> <td className="p-3">Total Paid</td><td className="p-3 text-right font-mono">{formatCurrency(totalPaid)}</td><td></td></tr>
                 </tbody>
               </table>
            </div>
          )}

          <div className={`p-4 rounded-xl border-2 flex justify-between items-center font-bold uppercase text-xs shadow-sm ${balanceDue > 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'}`}>
             <span>{balanceDue > 0.9 ? 'Remaining' : 'Invoice Paid'}</span><span className="font-mono text-sm">{formatCurrency(Math.max(0, balanceDue))}</span>
          </div>
        </div>

        <div className="p-6 bg-white border-t border-gray-200 grid grid-cols-2 gap-3">
           <Button variant="secondary" onClick={() => handleOpenPreview('invoice')} className="h-14 font-bold tracking-widest bg-gray-50 border-gray-200 text-gray-600"><Eye size={20} className="mr-2"/> View</Button>
           <Button onClick={handleSaveBill} className="h-14 font-bold tracking-widest shadow-xl" disabled={loading}>
             {loading ? <RefreshCw className="animate-spin mr-2" size={20} /> : <Printer size={20} className="mr-2" />}
             SAVE & PRINT
           </Button>
        </div>
      </div>
    </div>
  );
};
