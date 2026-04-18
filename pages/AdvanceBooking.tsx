
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Printer, 
  Edit2, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  Lock, 
  Unlock,
  User,
  ShoppingBag,
  CreditCard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  UserPlus,
  RefreshCw,
  Eye,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button, Input, Select, Card, toast } from '../components/UIComponents';
import { 
  getAdvanceBookings, 
  createAdvanceBooking, 
  updateAdvanceBooking, 
  deleteAdvanceBooking,
  searchCustomers,
  createCustomer,
  createBill,
  generateBillNo
} from '../db';
import { supabase } from '../supabaseClient';
import { AdvanceBooking as AdvanceBookingType, Customer, BillItem } from '../types';
import { AdvanceBookingPrint } from '../components/AdvanceBookingPrint';
// --- HELPERS ---
const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(val);
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
// --- COMPONENT ---
export const AdvanceBooking: React.FC = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'bookings' | 'ledger'>('bookings');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled' | 'completed'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookingId, setEditingBookingId] = useState<number | null>(null);
  // --- FORM STATE ---
  const [customerSearch, setCustomerSearch] = useState('');
  const [foundCustomers, setFoundCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustomerDetails, setNewCustomerDetails] = useState({ name: '', phone: '', address: '' });
  const [deliveryDate, setDeliveryDate] = useState('');
  const [saleType, setSaleType] = useState<'GST' | 'NON GST'>('NON GST');
  
  const [items, setItems] = useState<any[]>([]);
  const [newItem, setNewItem] = useState({
    item_name: '',
    quantity: 1,
    quantityInput: '1',
    rate: 0,
    rateInput: '',
    hsn_code: '6204',
  });

  const [advanceInput, setAdvanceInput] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  // --- PRINT STATE ---
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [selectedBookingForPrint, setSelectedBookingForPrint] = useState<any>(null);

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAdvanceBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching advance bookings:', error);
      toast({ title: 'Error', description: 'Failed to load bookings.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- DERIVED VALUES & CALCULATIONS ---
  const calculatedTotals = useMemo(() => {
    const itemsSubtotal = items.reduce((sum, item) => sum + (item.line_total || 0), 0);
    const gstRaw = saleType === 'GST' ? itemsSubtotal * 0.05 : 0;
    const gstAmount = Math.round(gstRaw);
    const grandTotal = itemsSubtotal + gstAmount;

    return {
      itemsSubtotal,
      gstAmount,
      grandTotal
    };
  }, [items, saleType]);

  const finalTotal = calculatedTotals.grandTotal;
  const balanceDue = finalTotal - (parseFloat(advanceInput) || 0);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const customerName = b.bills?.customers?.name || '';
      const customerPhone = b.bills?.customers?.phone || '';
      const billNo = b.bills?.bill_no || '';
      const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            customerPhone.includes(searchTerm) || 
                            billNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || b.booking_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const kpiStats = useMemo(() => {
    const totalBookings = bookings.length;
    const totalAdvance = bookings.reduce((sum, b) => sum + (b.advance_amount || 0), 0);
    const totalDue = bookings.reduce((sum, b) => sum + (b.total_amount - b.advance_amount), 0);
    const avgAdvance = totalBookings > 0 ? (totalAdvance / (totalAdvance + totalDue)) * 100 : 0;
    return { totalBookings, totalAdvance, totalDue, avgAdvance };
  }, [bookings]);
  // --- HANDLERS ---
  const handleCustomerSearch = async () => {
    if (!customerSearch) return;
    try {
      const results = await searchCustomers(customerSearch);
      setFoundCustomers(results || []);
      if (results && results.length > 0) {
        setIsAddingCustomer(false);
      } else {
        setIsAddingCustomer(true);
        setNewCustomerDetails({ name: '', phone: customerSearch, address: '' });
      }
    } catch (error) {
      console.error('Error searching customers:', error);
      toast({ title: 'Error', description: 'Search failed.', variant: 'destructive' });
    }
  };
  const handleConfirmNewCustomer = () => {
    if (!newCustomerDetails.name || !newCustomerDetails.phone) {
       toast({ title: 'Incomplete Details', description: 'Name and Phone are required.', variant: 'destructive' });
       return;
    }
    // We will create the customer during booking submission
    setSelectedCustomer({ 
        id: 'new',
        name: newCustomerDetails.name, 
        phone: newCustomerDetails.phone,
        address: newCustomerDetails.address 
    } as any);
    setIsAddingCustomer(false);
  };
  const handleAddItem = () => {
    const qty = parseFloat(newItem.quantityInput) || 1;
    const rate = parseFloat(newItem.rateInput) || 0;

    if (!newItem.item_name || rate <= 0) {
      toast({ title: "Invalid Item", description: "Name and Rate are required", variant: 'destructive' });
      return;
    }

    const lineTotal = qty * rate;
    const item = {
      id: Date.now().toString(),
      item_name: newItem.item_name,
      quantity: qty,
      rate: rate,
      line_total: lineTotal,
      hsn_code: newItem.hsn_code
    };
    setItems([...items, item]);
    setNewItem({
      item_name: '',
      quantity: 1,
      quantityInput: '1',
      rate: 0,
      rateInput: '',
      hsn_code: '6204',
    });
  };

  const handleEditBooking = (booking: any) => {
    setEditingBookingId(booking.id);
    setSelectedCustomer(booking.bills?.customers || null);
    setDeliveryDate(booking.delivery_date);
    setAdvanceInput(booking.advance_amount.toString());
    setNotes(booking.customer_notes || '');
    
    // Normalize sale type for UI compatibility
    const rawType = (booking.bills?.sale_type || '').toUpperCase();
    const normalizedType = (rawType === 'NOGST' || rawType === 'NONGST' || rawType === 'NON_GST') ? 'NON GST' : 'GST';
    setSaleType(normalizedType as 'GST' | 'NON GST');

    const fetchItems = async () => {
      const { data: billItems, error } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', booking.bill_id);
      
      if (!error && billItems) {
        setItems(billItems.map(bi => ({
          id: bi.id.toString(),
          item_name: bi.item_name,
          quantity: bi.quantity,
          rate: bi.rate,
          line_total: bi.line_total,
          hsn_code: bi.hsn_code || '6204'
        })));
      }
    };
    fetchItems();
    setIsModalOpen(true);
  };

  const handleCreateBooking = async () => {
    if (!selectedCustomer || items.length === 0) {
      toast({ title: 'Error', description: 'Customer and items are required', variant: 'destructive' });
      return;
    }
    if (!deliveryDate) {
      toast({ title: 'Error', description: 'Delivery date is required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const billData = {
        subtotal: calculatedTotals.itemsSubtotal,
        gst_amount: calculatedTotals.gstAmount,
        grand_total: calculatedTotals.grandTotal,
        advance_amount: parseFloat(advanceInput) || 0,
        remaining_amount: balanceDue,
        sale_type: saleType === 'NON GST' ? 'nongst' : 'gst',
      };

      if (editingBookingId) {
        await updateAdvanceBooking(editingBookingId, {
          delivery_date: deliveryDate,
          advance_amount: parseFloat(advanceInput) || 0,
          total_amount: finalTotal,
          item_description: items.map(i => `${i.item_name} (${i.quantity} Qty)`).join(', '),
          customer_notes: notes
        });
        
        const booking = bookings.find(b => b.id === editingBookingId);
        if (booking && booking.bill_id) {
           await supabase.from('bills').update({
             ...billData
           }).eq('id', booking.bill_id);

           await supabase.from('bill_items').delete().eq('bill_id', booking.bill_id);
           const itemsToInsert = items.map((item, idx) => ({
              bill_id: booking.bill_id,
              item_name: item.item_name,
              quantity: item.quantity,
              rate: item.rate,
              line_total: item.line_total,
              sl_no: idx + 1,
              hsn_code: item.hsn_code || '6204'
           }));
           await supabase.from('bill_items').insert(itemsToInsert);
        }

        toast({ title: 'Success', description: 'Booking updated successfully.' });
        setIsModalOpen(false);
        setEditingBookingId(null);
        fetchData();
        return;
      }

      let customerId: any = selectedCustomer.id;
      if (customerId === 'new') {
        const newCust = await createCustomer({
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
          address: selectedCustomer.address
        });
        customerId = newCust.id;
      }
      const generatedBillNo = await generateBillNo();
      const bill = await createBill({
        ...billData,
        bill_no: generatedBillNo,
        customer_id: customerId,
        bill_status: 'draft'
      });
      const newBookingRecord = await createAdvanceBooking({
        bill_id: bill.id,
        delivery_date: deliveryDate,
        advance_amount: parseFloat(advanceInput) || 0,
        total_amount: finalTotal,
        item_description: items.map(i => `${i.item_name} (${i.quantity} Qty)`).join(', '),
        customer_notes: notes,
        booking_status: 'active'
      });
      toast({ title: 'Success', description: 'Booking created successfully.' });
      setIsModalOpen(false);
      fetchData();
      const printObj = {
        ...newBookingRecord,
        bills: {
          ...bill,
          customers: selectedCustomer.id === 'new' ? { name: selectedCustomer.name, phone: selectedCustomer.phone } : selectedCustomer
        }
      };
      handleOpenPrintPreview(printObj);
      setSelectedCustomer(null);
      setItems([]);
      setAdvanceInput('');
      setDeliveryDate('');
      setNotes('');
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({ title: 'Error', description: 'Failed to create booking.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await updateAdvanceBooking(id, { booking_status: status });
      toast({ title: 'Status Updated', description: `Booking is now ${status}.` });
      fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Update failed.' });
    }
  };
  const handleOpenPrintPreview = async (booking: any) => {
    setLoading(true);
    try {
      const { data: billItems, error } = await supabase
        .from('bill_items')
        .select('*')
        .eq('bill_id', booking.bill_id)
        .order('sl_no', { ascending: true });
      
      const structuredItems = (billItems || []).map(bi => ({
        id: bi.id.toString(),
        item_name: bi.item_name,
        quantity: bi.quantity,
        rate: bi.rate,
        line_total: bi.line_total,
        hsn_code: bi.hsn_code || '6204'
      }));

      setSelectedBookingForPrint({ ...booking, structuredItems });
      setShowPrintPreview(true);
    } catch (err) {
      console.error("Error fetching items for print:", err);
      toast({ title: "Error", description: "Failed to load booking items for print." });
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteBooking = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      await deleteAdvanceBooking(id);
      toast({ title: 'Booking Deleted' });
      fetchData();
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast({ title: 'Error', description: 'Delete failed.' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden font-sans text-charcoal-900">
      <div className="flex-1 flex flex-col overflow-hidden print-hidden print:hidden">
        {/* KPI SECTION */}
        <div className="p-6 pb-2 grid grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-gold-500 !p-4 flex flex-col justify-between shadow-sm bg-white">
             <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Orders</p>
                <div className="p-1.5 bg-gold-50 rounded text-gold-600"><ShoppingBag size={16}/></div>
             </div>
             <h3 className="text-2xl font-bold mt-2 font-mono text-charcoal-900">{kpiStats.totalBookings}</h3>
          </Card>
          <Card className="border-l-4 border-l-green-500 !p-4 flex flex-col justify-between shadow-sm bg-white">
             <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Advance Recv.</p>
                <div className="p-1.5 bg-green-50 rounded text-green-600"><DollarSign size={16}/></div>
             </div>
             <h3 className="text-2xl font-bold mt-2 font-mono text-charcoal-900">{formatCurrency(kpiStats.totalAdvance)}</h3>
          </Card>
          <Card className="border-l-4 border-l-red-500 !p-4 flex flex-col justify-between shadow-sm bg-white">
             <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Balance Due</p>
                <div className="p-1.5 bg-red-50 rounded text-red-600"><CreditCard size={16}/></div>
             </div>
             <h3 className="text-2xl font-bold mt-2 font-mono text-charcoal-900">{formatCurrency(kpiStats.totalDue)}</h3>
          </Card>
          <Card className="border-l-4 border-l-charcoal-700 !p-4 flex flex-col justify-between shadow-sm bg-white">
             <div className="flex justify-between items-start">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg. Advance</p>
                <div className="p-1.5 bg-gray-100 rounded text-charcoal-700"><TrendingUp size={16}/></div>
             </div>
             <h3 className="text-2xl font-bold mt-2 font-mono text-charcoal-900">{kpiStats.avgAdvance.toFixed(1)}%</h3>
          </Card>
        </div>

        {/* CONTROL BAR */}
        <div className="px-6 py-4 flex flex-col gap-4 border-b border-gray-200 bg-white sticky top-0 z-20">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-4 bg-gray-50 p-1 rounded-md border border-gray-300 shadow-sm w-96">
                <Search className="text-gray-400 ml-2" size={18} />
                <input 
                  type="text" 
                  placeholder="Order No, Customer Mobile, Name..." 
                  className="flex-1 outline-none text-sm py-1 bg-transparent text-charcoal-900 font-medium"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
             </div>
             <Button onClick={() => { setIsModalOpen(true); setEditingBookingId(null); setSelectedCustomer(null); setItems([]); setAdvanceInput(''); setDeliveryDate(''); setNotes(''); }} className="shadow-lg bg-charcoal-900 hover:bg-black border-none gap-2">
               <Plus size={18} /> NEW ORDER BOOKING
             </Button>
          </div>
          <div className="flex gap-4">
            {(['all', 'active', 'delivered', 'cancelled', 'completed'] as const).map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 text-[10px] font-bold rounded-full border transition-all uppercase tracking-[0.1em] ${
                  statusFilter === status 
                  ? 'bg-charcoal-900 text-gold-500 border-charcoal-900 shadow-md' 
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="flex-1 overflow-auto p-6">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-[#F9FAFB] border-b border-gray-200 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
                   <tr>
                     <th className="py-5 px-6">Booking No</th>
                     <th className="py-5 px-6">Customer</th>
                     <th className="py-5 px-6">Delivery Date</th>
                     <th className="py-5 px-6 text-right">Total</th>
                     <th className="py-5 px-6 text-right text-green-600">Paid</th>
                     <th className="py-5 px-6 text-right text-red-600">Balance</th>
                     <th className="py-5 px-6 text-center">Status</th>
                     <th className="py-5 px-6 text-center">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {loading ? (
                      <tr><td colSpan={8} className="py-20 text-center text-gray-400 italic">Retrieving order bookings...</td></tr>
                   ) : filteredBookings.length === 0 ? (
                      <tr><td colSpan={8} className="py-20 text-center text-gray-400 italic">No bookings found.</td></tr>
                   ) : filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-gold-50/20 transition-colors">
                        <td className="py-4 px-6 font-mono font-bold text-gray-400">{b.bills?.bill_no}</td>
                        <td className="py-4 px-6 font-bold text-charcoal-900">{b.bills?.customers?.name}</td>
                        <td className="py-4 px-6 text-gray-600 font-medium">{formatDate(b.delivery_date)}</td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-charcoal-900">{formatCurrency(b.total_amount)}</td>
                        <td className="py-4 px-6 text-right font-mono text-green-700 font-bold">{formatCurrency(b.advance_amount)}</td>
                        <td className="py-4 px-6 text-right font-mono text-red-600 font-bold">{formatCurrency(b.total_amount - b.advance_amount)}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                            b.booking_status === 'active' ? 'bg-gold-50 text-gold-700 border-gold-100' :
                            b.booking_status === 'delivered' ? 'bg-green-50 text-green-700 border-green-100' :
                            b.booking_status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {b.booking_status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center gap-3">
                             <button onClick={() => handleEditBooking(b)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Edit Booking"><Edit2 size={16}/></button>
                             <button onClick={() => handleOpenPrintPreview(b)} className="text-gray-400 hover:text-charcoal-900 transition-colors" title="Print Receipt"><Printer size={16}/></button>
                             <button onClick={() => handleDeleteBooking(b.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete Booking"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                   ))}
                 </tbody>
               </table>
            </div>
        </div>
      </div>

      {/* MODAL: CREATE BOOKING */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal-900/80 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="bg-charcoal-900 text-white px-8 py-5 flex justify-between items-center shrink-0 shadow-lg font-bold tracking-widest uppercase text-sm">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold-500 text-charcoal-900 flex items-center justify-center"><ShoppingBag size={18}/></div>
                    <span>{editingBookingId ? 'Edit Order Booking' : 'New Order Booking'}</span>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-auto p-8 grid grid-cols-12 gap-10">
                 <div className="col-span-7 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                      <section className="space-y-4">
                         <h4 className="text-[10px] font-bold uppercase text-gold-600 tracking-widest">Customer Context</h4>
                         {!selectedCustomer ? (
                           <div className="flex gap-2">
                             <Input 
                               placeholder="Searching Mob..." 
                               value={customerSearch} 
                               onChange={e => setCustomerSearch(e.target.value)} 
                               icon={<Search size={16}/>}
                             />
                             <Button onClick={handleCustomerSearch} className="bg-charcoal-800">Find</Button>
                           </div>
                         ) : (
                           <div className="p-4 bg-gold-50 rounded-xl border border-gold-200 flex justify-between items-center shadow-sm">
                             <div>
                               <p className="font-bold text-charcoal-900 tracking-tight">{selectedCustomer.name}</p>
                               <p className="text-xs font-mono text-gray-500 mt-1 uppercase tracking-tighter">{selectedCustomer.phone}</p>
                             </div>
                             <button onClick={() => setSelectedCustomer(null)} className="text-[10px] bg-white px-2 py-1 rounded border border-gold-200 text-red-500 font-bold uppercase hover:bg-red-50 transition-colors shadow-sm">Change</button>
                           </div>
                         )}
                         {isAddingCustomer && (
                           <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4 shadow-inner animate-in slide-in-from-top-2">
                             <h5 className="text-[10px] font-bold text-gray-500 uppercase">Quick Add Customer</h5>
                             <Input placeholder="Full Name" value={newCustomerDetails.name} onChange={e => setNewCustomerDetails({...newCustomerDetails, name: e.target.value})} />
                             <Button fullWidth size="sm" onClick={handleConfirmNewCustomer} className="bg-charcoal-900">Add Customer</Button>
                           </div>
                         )}
                      </section>

                      <section className="space-y-4">
                         <h4 className="text-[10px] font-bold uppercase text-gold-600 tracking-widest">Delivery Schedule</h4>
                         <Input type="date" label="Expected Delivery" isMonospaced value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} />
                         <Select 
                            label="Invoice Type" 
                            value={saleType} 
                            onChange={(e) => setSaleType(e.target.value as any)} 
                            options={[{ value: 'GST', label: 'GST Invoice' }, { value: 'NON GST', label: 'Estimate / Non-GST' }]} 
                          />
                      </section>
                    </div>

                    <section className="space-y-4 pt-4 border-t border-gray-100">
                       <h4 className="text-[10px] font-bold uppercase text-gold-600 tracking-widest">Particulars (Add Items)</h4>
                       <div className="grid grid-cols-12 gap-3 items-end">
                          <div className="col-span-6"><Input label="Description" placeholder="Cotton Shirt..." value={newItem.item_name} onChange={e => setNewItem({...newItem, item_name: e.target.value})} /></div>
                          <div className="col-span-2"><Input label="Qty" type="number" isMonospaced value={newItem.quantityInput} onChange={e => setNewItem({...newItem, quantityInput: e.target.value})} /></div>
                          <div className="col-span-3"><Input label="Rate (₹)" type="number" isMonospaced value={newItem.rateInput} onChange={e => setNewItem({...newItem, rateInput: e.target.value})} /></div>
                          <div className="col-span-1 flex justify-end"><Button onClick={handleAddItem} className="!px-3 bg-charcoal-900 border-none hover:bg-black"><Plus size={20}/></Button></div>
                       </div>

                       <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <table className="w-full text-left text-[11px]">
                             <thead className="bg-charcoal-900 text-white font-bold uppercase tracking-widest">
                                <tr>
                                   <th className="py-3 px-4">Item</th>
                                   <th className="py-3 px-4 text-center">Qty</th>
                                   <th className="py-3 px-4 text-right">Rate</th>
                                   <th className="py-3 px-4 text-right">Total</th>
                                   <th className="py-3 px-4 text-center"></th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                {items.length === 0 ? (
                                   <tr><td colSpan={5} className="py-8 text-center text-gray-400 italic">No items added to booking list.</td></tr>
                                ) : items.map(item => (
                                   <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                      <td className="py-3 px-4 font-bold text-charcoal-900 uppercase">{item.item_name}</td>
                                      <td className="py-3 px-4 text-center font-mono">{item.quantity}</td>
                                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.rate)}</td>
                                      <td className="py-3 px-4 text-right font-mono font-bold text-charcoal-900">{formatCurrency(item.line_total)}</td>
                                      <td className="py-3 px-4 text-center">
                                         <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="text-gray-300 hover:text-red-500 transition-colors"><X size={14}/></button>
                                      </td>
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                       </div>
                    </section>
                 </div>

                 <div className="col-span-5 flex flex-col">
                    <div className="flex-1 bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden flex flex-col shadow-inner">
                        <div className="p-6 border-b border-gray-200 bg-white">
                           <h4 className="text-[10px] font-bold uppercase text-charcoal-400 tracking-widest mb-4">Internal Notes</h4>
                           <textarea 
                             className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-all font-medium" 
                             placeholder="Special instructions or alterations..." 
                             value={notes} 
                             onChange={e => setNotes(e.target.value)}
                           />
                        </div>
                        
                        <div className="p-8 bg-charcoal-900 text-white space-y-6 flex-1 flex flex-col justify-end">
                           <div className="space-y-3">
                              <div className="flex justify-between items-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                 <span>Subtotal</span>
                                 <span className="font-mono text-sm">{formatCurrency(calculatedTotals.itemsSubtotal)}</span>
                              </div>
                              <div className="flex justify-between items-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                                 <span>GST (5%)</span>
                                 <span className="font-mono text-sm text-gold-500">{formatCurrency(calculatedTotals.gstAmount)}</span>
                              </div>
                              <div className="flex justify-between items-end pt-4 border-t border-white/10">
                                 <span className="text-xs uppercase tracking-widest text-gold-500 font-bold">Total Payable</span>
                                 <span className="text-3xl font-bold font-mono tracking-tighter">{formatCurrency(finalTotal)}</span>
                              </div>
                           </div>

                           <div className="space-y-2 pt-4">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Advance Received (₹)</label>
                              <div className="relative">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-500 font-bold">₹</span>
                                 <input 
                                   type="number" 
                                   className="w-full bg-white/10 hover:bg-white/15 border-none rounded-xl py-4 pl-10 pr-6 text-2xl font-mono font-bold text-green-500 outline-none transition-all shadow-inner" 
                                   placeholder="0.00"
                                   value={advanceInput} 
                                   onChange={e => setAdvanceInput(e.target.value)} 
                                 />
                              </div>
                           </div>

                           <div className="flex justify-between items-center py-4 px-6 bg-white/5 rounded-xl border border-white/10">
                              <span className="text-[10px] font-bold uppercase text-gray-400">Balance Due</span>
                              <span className="text-xl font-bold font-mono text-red-500">{formatCurrency(balanceDue)}</span>
                           </div>

                           <Button 
                             fullWidth 
                             onClick={handleCreateBooking} 
                             className="h-16 font-bold tracking-[0.2em] bg-gold-500 text-charcoal-900 border-none shadow-[0_10px_30px_rgba(234,179,8,0.3)] hover:bg-gold-600 hover:scale-[1.01] transition-all" 
                             disabled={loading}
                           >
                             {editingBookingId ? 'UPDATE BOOKING' : 'CONFIRM ORDER'}
                           </Button>
                        </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* PRINT PREVIEW */}
      {/* 5. PRINT COMPONENTS (STRICTLY FOR PRINTER) */}
      <div className="hidden print:block print-block">
        {selectedBookingForPrint && (
          <AdvanceBookingPrint 
            bookingNo={selectedBookingForPrint.bills?.bill_no || '-'} 
            bookingDate={selectedBookingForPrint.booking_date} 
            deliveryDate={selectedBookingForPrint.delivery_date} 
            customerName={selectedBookingForPrint.bills?.customers?.name || 'Unknown'} 
            customerPhone={selectedBookingForPrint.bills?.customers?.phone || '-'} 
            items={selectedBookingForPrint.structuredItems || []} 
            saleType={selectedBookingForPrint.bills?.sale_type?.toUpperCase() === 'GST' ? 'GST' : 'NON GST'}
            totalAmount={selectedBookingForPrint.total_amount} 
            advanceAmount={selectedBookingForPrint.advance_amount} 
            balanceDue={selectedBookingForPrint.total_amount - selectedBookingForPrint.advance_amount} 
            notes={selectedBookingForPrint.customer_notes} 
          />
        )}
      </div>

      {/* 6. ON-SCREEN PREVIEW MODAL */}
      {showPrintPreview && selectedBookingForPrint && (
        <div className="fixed inset-0 z-[100] bg-charcoal-900/80 backdrop-blur-md flex items-center justify-center p-8 print-hidden print:hidden">
           <div className="bg-gray-100 w-full max-w-[1000px] h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
              <div className="bg-charcoal-900 px-8 py-5 flex justify-between items-center text-white shrink-0 shadow-lg">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-gold-500 text-charcoal-900 flex items-center justify-center font-bold"><Eye size={20}/></div>
                   <div>
                     <h3 className="font-bold text-lg tracking-wide uppercase">Order Preview</h3>
                     <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Verifying order booking before printing</p>
                   </div>
                 </div>
                 <div className="flex gap-4">
                    <Button onClick={handleActualPrint} variant="secondary" className="bg-gold-500 text-charcoal-900 border-none hover:bg-gold-600 shadow-xl"><Printer size={18} className="mr-2"/> Send to Printer</Button>
                    <button onClick={() => setShowPrintPreview(false)} className="p-2 text-gray-400 hover:text-white transition-colors bg-white/10 rounded-full"><X size={24}/></button>
                 </div>
              </div>
              <div className="flex-1 overflow-auto bg-gray-200 p-8 custom-scrollbar">
                <div className="scale-90 origin-top">
                    <AdvanceBookingPrint 
                      isScreenPreview 
                      bookingNo={selectedBookingForPrint.bills?.bill_no || '-'} 
                      bookingDate={selectedBookingForPrint.booking_date} 
                      deliveryDate={selectedBookingForPrint.delivery_date} 
                      customerName={selectedBookingForPrint.bills?.customers?.name || 'Unknown'} 
                      customerPhone={selectedBookingForPrint.bills?.customers?.phone || '-'} 
                      items={selectedBookingForPrint.structuredItems || []} 
                      saleType={selectedBookingForPrint.bills?.sale_type?.toUpperCase() === 'GST' ? 'GST' : 'NON GST'}
                      totalAmount={selectedBookingForPrint.total_amount} 
                      advanceAmount={selectedBookingForPrint.advance_amount} 
                      balanceDue={selectedBookingForPrint.total_amount - selectedBookingForPrint.advance_amount} 
                      notes={selectedBookingForPrint.customer_notes} 
                    />
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
