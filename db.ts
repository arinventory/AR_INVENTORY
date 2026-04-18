import { supabase } from './supabaseClient';

// --- BILLS ---

export const generateBillNo = async () => {
  // Check both bills and exchanges to find the absolute latest number
  const { data: bills } = await supabase.from('bills').select('bill_no').order('created_at', { ascending: false }).limit(20);

  let maxNum = 0;

  const extractNumber = (str: string) => {
    if (!str) return;
    const match = str.match(/AR-(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    }
  };

  bills?.forEach(b => extractNumber(b.bill_no));

  const nextNum = maxNum + 1;
  // Pad to 4 digits (0001), but allow it to grow naturally (10000+)
  const padded = nextNum.toString().padStart(Math.max(4, nextNum.toString().length), '0');
  return `AR-${padded}`;
};

export const deleteBill = async (id: number) => {
  // Items will be deleted by CASCADE if set up, or manually
  const { error: itemsError } = await supabase
    .from('bill_items')
    .delete()
    .eq('bill_id', id);
  
  if (itemsError) throw itemsError;

  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getCustomerHistory = async (customerId: number) => {
  const { data, error } = await supabase
    .from('bills')
    .select('*, bill_items(*)')
    .eq('customer_id', customerId)
    .order('bill_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getCustomerBookings = async (customerId: number) => {
  const { data, error } = await supabase
    .from('advance_bookings')
    .select('*, bills(*)')
    .eq('bills.customer_id', customerId)
    .order('booking_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const getCustomerLayaways = async (customerId: number) => {
  const { data, error } = await supabase
    .from('layaway_transactions')
    .select('*, bills(*)')
    .eq('bills.customer_id', customerId)
    .order('payment_date', { ascending: false });

  if (error) throw error;
  return data;
};

export const createBill = async (billData: any) => {
  const { data, error } = await supabase
    .from('bills')
    .insert(billData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateBill = async (id: number, billData: any) => {
  const { data, error } = await supabase
    .from('bills')
    .update(billData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBillById = async (id: number) => {
  const { data, error } = await supabase
    .from('bills')
    .select('*, customers(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

// --- BILL ITEMS ---

export const createBillItems = async (billId: number, items: any[]) => {
  const itemsWithBillId = items.map(item => ({ ...item, bill_id: billId }));
  
  const { data, error } = await supabase
    .from('bill_items')
    .insert(itemsWithBillId)
    .select();

  if (error) throw error;
  return data;
};

export const getBillItems = async (billId: number) => {
  const { data, error } = await supabase
    .from('bill_items')
    .select('*')
    .eq('bill_id', billId)
    .order('sl_no', { ascending: true });

  if (error) throw error;
  return data;
};

// --- CUSTOMERS ---

export const searchCustomers = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .or(`phone.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
    .limit(10);

  if (error) throw error;
  return data;
};

export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
};

export const createCustomer = async (customerData: any) => {
  const { data, error } = await supabase
    .from('customers')
    .insert(customerData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateCustomer = async (id: number, customerData: any) => {
  const { data, error } = await supabase
    .from('customers')
    .update(customerData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCustomer = async (id: number) => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// --- ITEMS (INVENTORY) ---

export const getInventoryItems = async () => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createInventoryItem = async (itemData: any) => {
  const { data, error } = await supabase
    .from('items')
    .insert(itemData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateInventoryItem = async (id: string, itemData: any) => {
  const { data, error } = await supabase
    .from('items')
    .update(itemData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteInventoryItem = async (id: string) => {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getItemByBarcode = async (barcode: string) => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('barcode', barcode)
    .single();

  if (error) throw error;
  return data;
};



// --- LAYAWAY TRANSACTIONS ---

export const getLayawayTransactions = async (billId?: number) => {
  let query = supabase
    .from('layaway_transactions')
    .select('*')
    .order('payment_date', { ascending: false });

  if (billId) {
    query = query.eq('bill_id', billId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as any[];
};

export const getLayawayTransactionById = async (id: number) => {
  const { data, error } = await supabase
    .from('layaway_transactions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createLayawayTransaction = async (transaction: any) => {
  const { data, error } = await supabase
    .from('layaway_transactions')
    .insert(transaction)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateLayawayTransaction = async (id: number, updates: any) => {
  const { data, error } = await supabase
    .from('layaway_transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteLayawayTransaction = async (id: number) => {
  const { error } = await supabase
    .from('layaway_transactions')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// --- ADVANCE BOOKINGS ---

export const getAdvanceBookings = async () => {
  const { data, error } = await supabase
    .from('advance_bookings')
    .select(`
      *,
      bills (
        *,
        customers (*)
      )
    `)
    .order('booking_date', { ascending: false });

  if (error) throw error;
  return data as any[];
};

export const getAdvanceBookingById = async (id: number) => {
  const { data, error } = await supabase
    .from('advance_bookings')
    .select(`
      *,
      bills (
        *,
        customers (*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createAdvanceBooking = async (booking: any) => {
  const { data, error } = await supabase
    .from('advance_bookings')
    .insert(booking)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateAdvanceBooking = async (id: number, updates: any) => {
  const { data, error } = await supabase
    .from('advance_bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteAdvanceBooking = async (id: number) => {
  const { error } = await supabase
    .from('advance_bookings')
    .delete()
    .eq('id', id);

  if (error) throw error;
};


