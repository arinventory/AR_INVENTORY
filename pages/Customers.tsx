
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Edit2, 
  Trash2,
  ChevronRight,
  User,
  X,
  Save,
  RefreshCw,
  FileText,
  Clock,
  Users,
  ChevronLeft
} from 'lucide-react';
import { Button, Input, Card, toast } from '../components/UIComponents';
import { Customer } from '../types';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, getCustomerHistory, getCustomerBookings, getCustomerLayaways } from '../db';

export const Customers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // History State
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [customerHistory, setCustomerHistory] = useState<any[]>([]);
  const [customerBookings, setCustomerBookings] = useState<any[]>([]);
  const [customerLayaways, setCustomerLayaways] = useState<any[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const initialFormState: Partial<Customer> = {
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- FETCH DATA ---
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({ title: 'Error', description: 'Failed to load customers.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // --- HANDLERS ---
  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({ ...customer });
    } else {
      setEditingCustomer(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast({ title: 'Validation Error', description: 'Name and Phone are required.', variant: 'destructive' });
      return;
    }

    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
        toast({ title: 'Success', description: 'Customer updated successfully.' });
      } else {
        await createCustomer(formData);
        toast({ title: 'Success', description: 'Customer created successfully.' });
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save customer.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return;
    try {
      await deleteCustomer(id);
      toast({ title: 'Success', description: 'Customer deleted successfully.' });
      fetchCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast({ title: 'Error', description: error.message || 'Failed to delete customer.', variant: 'destructive' });
    }
  };

  const handleViewHistory = async (customer: Customer) => {
    setSelectedCustomerForHistory(customer);
    setHistoryLoading(true);
    try {
      const [history, bookings, layaways] = await Promise.all([
        getCustomerHistory(customer.id),
        getCustomerBookings(customer.id),
        getCustomerLayaways(customer.id)
      ]);
      setCustomerHistory(history || []);
      setCustomerBookings(bookings || []);
      setCustomerLayaways(layaways || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({ title: 'Error', description: 'Failed to load customer history.' });
    } finally {
      setHistoryLoading(false);
    }
  };

  // --- DERIVED STATE ---
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.phone.includes(searchTerm) ||
      (c.customer_code && c.customer_code.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [customers, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = useMemo(() => {
    const total = customers.length;
    const newThisMonth = customers.filter(c => {
      if (!c.created_at) return false;
      const date = new Date(c.created_at);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length;
    return { total, newThisMonth };
  }, [customers]);

  return (
    <div className="h-full flex flex-col bg-app-bg overflow-hidden relative font-sans">
      
      {/* 1. KPI SECTION */}
      <div className="p-6 pb-2 grid grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-gold-500 !p-4 flex items-center justify-between shadow-sm bg-white">
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Clients</p>
              <h3 className="text-2xl font-bold text-charcoal-900 mt-1">{stats.total}</h3>
           </div>
           <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center text-gold-600">
             <Users size={20} />
           </div>
        </Card>

        <Card className="border-l-4 border-l-green-500 !p-4 flex items-center justify-between shadow-sm bg-white">
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">New This Month</p>
              <h3 className="text-2xl font-bold text-charcoal-900 mt-1">+{stats.newThisMonth}</h3>
           </div>
           <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-600">
             <User size={20} />
           </div>
        </Card>

        <Card className="border-l-4 border-l-charcoal-700 !p-4 flex items-center justify-between shadow-sm bg-white">
           <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Search</p>
              <h3 className="text-2xl font-bold text-charcoal-900 mt-1">{searchTerm ? filteredCustomers.length : '-'}</h3>
           </div>
           <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-charcoal-700">
             <Search size={20} />
           </div>
        </Card>
      </div>

      {/* 2. CONTROL BAR */}
      <div className="px-6 py-4 flex justify-between items-center bg-transparent">
        <div className="relative w-96">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
           <input 
             type="text"
             placeholder="Search by name, phone or code..."
             className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 shadow-sm transition-all"
             value={searchTerm}
             onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
           />
        </div>
        <div className="flex gap-3">
           <Button variant="outline" onClick={fetchCustomers} className="bg-white">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
           </Button>
           <Button onClick={() => handleOpenModal()} className="bg-charcoal-900 text-white hover:bg-black shadow-lg">
              <Plus size={16} className="mr-2" /> Add New Client
           </Button>
        </div>
      </div>

      {/* 3. DATA TABLE */}
      <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-full">
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-charcoal-700 font-bold uppercase text-[11px] tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-4 px-6">Code</th>
                  <th className="py-4 px-6">Customer Name</th>
                  <th className="py-4 px-6">Phone Number</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Joined Date</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-gray-400">
                      <RefreshCw className="animate-spin mx-auto mb-2" size={24}/>
                      <span className="text-xs font-bold uppercase tracking-widest">Loading Client Database...</span>
                    </td>
                  </tr>
                ) : paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-gray-400 italic">
                      No clients found matching your search criteria.
                    </td>
                  </tr>
                ) : paginatedCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gold-50/10 transition-colors group">
                    <td className="py-4 px-6 font-mono font-bold text-gold-600 text-xs uppercase">
                      {customer.customer_code || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-charcoal-900">{customer.name}</div>
                    </td>
                    <td className="py-4 px-6 font-mono text-gray-600">
                      {customer.phone}
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-xs">
                      {customer.email || '-'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <MapPin size={12} />
                        <span className="truncate max-w-[150px]">{customer.address || '-'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-400 font-medium">
                      {customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-GB') : '-'}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button 
                          onClick={() => handleViewHistory(customer)}
                          className="px-3 py-1 bg-gold-50 text-gold-600 text-[10px] font-bold uppercase rounded border border-gold-200 hover:bg-gold-500 hover:text-white hover:border-gold-500 transition-all"
                        >
                          View Orders
                        </button>
                        <button 
                          onClick={() => handleOpenModal(customer)}
                          className="p-1.5 hover:bg-gold-50 rounded text-gold-600 transition-colors"
                          title="Edit Profile"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(customer.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-colors"
                          title="Delete Client"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="bg-gray-50 border-t border-gray-200 p-3 px-6 flex justify-between items-center text-xs">
             <div className="text-gray-500 font-medium">
               Showing <span className="font-bold text-charcoal-700">{paginatedCustomers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-bold text-charcoal-700">{Math.min(currentPage * itemsPerPage, filteredCustomers.length)}</span> of <span className="font-bold text-charcoal-700">{filteredCustomers.length}</span> clients
             </div>
             
             <div className="flex items-center gap-3">
               <button 
                 onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                 disabled={currentPage === 1}
                 className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               >
                 <ChevronLeft size={16} />
               </button>
               
               <span className="font-mono font-bold text-charcoal-700 text-[11px] bg-white px-3 py-1 rounded border border-gray-200 shadow-sm">
                 Page {currentPage} / {totalPages || 1}
               </span>

               <button 
                 onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                 disabled={currentPage === totalPages || totalPages === 0}
                 className="p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
               >
                 <ChevronRight size={16} />
               </button>
             </div>
          </div>
        </div>
      </div>

      {/* 4. ADD/EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#2D2A26]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-lg shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="bg-charcoal-900 text-white px-6 py-4 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold-500 text-charcoal-900 flex items-center justify-center">
                       {editingCustomer ? <Edit2 size={18}/> : <Plus size={18}/>}
                    </div>
                    <h3 className="font-bold text-lg tracking-wide uppercase">{editingCustomer ? 'Edit Client Profile' : 'Register New Client'}</h3>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                    <X size={24}/>
                 </button>
              </div>
              <div className="p-6 space-y-4 bg-gray-50/50">
                 <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Full Name *" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter customer name"
                    />
                    <Input 
                      label="Phone Number *" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                 </div>
                 <Input 
                   label="Email Address" 
                   value={formData.email} 
                   onChange={e => setFormData({...formData, email: e.target.value})}
                   placeholder="example@mail.com"
                 />
                 <Input 
                   label="Address" 
                   value={formData.address} 
                   onChange={e => setFormData({...formData, address: e.target.value})}
                   placeholder="Enter physical address"
                   icon={<MapPin size={14}/>}
                 />
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-charcoal-700 uppercase flex items-center gap-2">
                       <FileText size={12}/> Internal Notes
                    </label>
                    <textarea 
                      className="w-full bg-white border border-gray-300 rounded-md p-3 text-sm min-h-[100px] focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all resize-none shadow-sm"
                      value={formData.notes || ''}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="Special preferences, family details, or sizes..."
                    />
                 </div>
              </div>
              <div className="p-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                 <Button variant="outline" onClick={() => setIsModalOpen(false)} className="border-gray-300">Cancel</Button>
                 <Button onClick={handleSave} className="bg-gold-500 text-white hover:bg-gold-600 px-8 shadow-lg">
                    <Save size={18} className="mr-2"/> {editingCustomer ? 'Update Profile' : 'Save Client'}
                 </Button>
              </div>
           </div>
        </div>
      )}

      {/* 5. HISTORY DRAWER/MODAL */}
      {selectedCustomerForHistory && (
        <div className="fixed inset-0 z-50 bg-[#2D2A26]/60 backdrop-blur-sm flex items-center justify-end animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="bg-charcoal-900 text-white px-6 py-5 flex justify-between items-center shrink-0">
                 <div>
                    <h3 className="font-bold text-xl uppercase tracking-tight">{selectedCustomerForHistory.name}</h3>
                    <p className="text-xs text-gold-500 font-mono">{selectedCustomerForHistory.customer_code || 'REGULAR CLIENT'}</p>
                 </div>
                 <button onClick={() => setSelectedCustomerForHistory(null)} className="text-gray-400 hover:text-white transition-colors">
                    <X size={28}/>
                 </button>
              </div>
              
              <div className="flex-1 overflow-auto p-6 space-y-8 bg-gray-50">
                 {historyLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                       <RefreshCw className="animate-spin mb-4" size={32}/>
                       <p className="font-bold uppercase tracking-widest text-xs">Fetching Transaction History...</p>
                    </div>
                 ) : (
                    <>
                       {/* Section: Bills */}
                       <section>
                          <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                             <FileText size={18} className="text-gold-600"/>
                             <h4 className="font-bold uppercase text-sm text-charcoal-900">Purchase History</h4>
                          </div>
                          {customerHistory.length === 0 ? (
                             <p className="text-sm text-gray-400 italic bg-white p-4 rounded border border-dashed">No past purchases found.</p>
                          ) : (
                             <div className="space-y-3">
                                {customerHistory.map(bill => (
                                   <div key={bill.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex justify-between items-center hover:border-gold-300 transition-colors group">
                                      <div>
                                         <p className="font-mono font-bold text-charcoal-900">{bill.bill_no}</p>
                                         <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(bill.bill_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                      </div>
                                      <div className="text-right">
                                         <p className="font-bold text-charcoal-900">₹{bill.grand_total.toLocaleString()}</p>
                                         <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${bill.bill_status === 'final' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{bill.bill_status}</span>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          )}
                       </section>

                       {/* Section: Bookings */}
                       <section>
                          <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                             <Clock size={18} className="text-blue-600"/>
                             <h4 className="font-bold uppercase text-sm text-charcoal-900">Active Bookings</h4>
                          </div>
                          {customerBookings.length === 0 ? (
                             <p className="text-sm text-gray-400 italic bg-white p-4 rounded border border-dashed">No active bookings found.</p>
                          ) : (
                             <div className="space-y-3">
                                {customerBookings.map(booking => (
                                   <div key={booking.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-blue-300 transition-colors">
                                      <div className="flex justify-between items-start mb-2">
                                         <p className="text-[10px] font-bold text-blue-600 uppercase">Delivery: {new Date(booking.delivery_date).toLocaleDateString()}</p>
                                         <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600`}>{booking.booking_status}</span>
                                      </div>
                                      <p className="text-xs text-charcoal-800 font-medium mb-3 line-clamp-1">{booking.item_description}</p>
                                      
                                      <div className="mb-2">
                                         <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-gold-600 uppercase">
                                               {Math.min(Math.round(((booking.advance_amount || 0) / (booking.total_amount || 1)) * 100), 100)}% Paid
                                            </span>
                                            <span className="text-[10px] font-mono text-gray-400">₹{booking.total_amount.toLocaleString()}</span>
                                         </div>
                                         <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                               className="bg-gold-500 h-full rounded-full transition-all duration-500" 
                                               style={{ width: `${Math.min(Math.round(((booking.advance_amount || 0) / (booking.total_amount || 1)) * 100), 100)}%` }}
                                            />
                                         </div>
                                      </div>

                                      <div className="flex justify-between items-end">
                                         <p className="text-[10px] text-gray-400 font-mono">Balance Due: ₹{(booking.total_amount - booking.advance_amount).toLocaleString()}</p>
                                         <p className="text-sm font-bold text-green-600">Advance: ₹{booking.advance_amount.toLocaleString()}</p>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          )}
                       </section>

                       {/* Section: Layaway */}
                       <section>
                          <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                             <RefreshCw size={18} className="text-purple-600"/>
                             <h4 className="font-bold uppercase text-sm text-charcoal-900">Layaway Payments</h4>
                          </div>
                          {customerLayaways.length === 0 ? (
                             <p className="text-sm text-gray-400 italic bg-white p-4 rounded border border-dashed">No layaway transactions found.</p>
                          ) : (
                             <div className="space-y-3">
                                {customerLayaways.map(txn => (
                                   <div key={txn.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:border-purple-300 transition-colors">
                                      <div className="flex justify-between items-start mb-1">
                                         <p className="text-xs font-bold text-charcoal-900 font-mono">{txn.bills?.bill_no}</p>
                                         <span className="text-[10px] text-gray-400">{new Date(txn.payment_date).toLocaleDateString()}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                         <p className="text-xs text-gray-500 capitalize">{txn.payment_method} - {txn.notes || 'Payment'}</p>
                                         <p className="text-sm font-bold text-purple-700">₹{parseFloat(txn.amount).toLocaleString()}</p>
                                      </div>
                                   </div>
                                ))}
                             </div>
                          )}
                       </section>
                    </>
                 )}
              </div>
              
              <div className="p-6 border-t border-gray-100 bg-white shrink-0">
                 <Button fullWidth onClick={() => setSelectedCustomerForHistory(null)} variant="outline">Close Records</Button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};
