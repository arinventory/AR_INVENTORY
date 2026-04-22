export type StockStatus = 'in_stock' | 'out_of_stock' | 'sold';

export interface InventoryItem {
  id: string;
  barcode: string;
  item_name: string;
  category?: string;
  rate: number;
  quantity: number;
  size?: string;
  color?: string;
  hsn_code?: string;
  supplier_code?: string;
  cost_price?: number;
  expenses?: number;
  stock_status?: StockStatus;
  location?: string;
  remarks?: string;
  created_at?: string;
}

export interface BillItem {
  id: string;
  barcode?: string;
  item_name: string;
  quantity: number;
  rate: number;
  cost_price?: number;
  expenses?: number;
  line_total: number;
  hsn_code?: string;
  sl_no?: number;
}


export type PaymentMethodType = 'cash' | 'card' | 'upi' | 'cheque' | 'bank_transfer' | 'other';

export interface PaymentRecord {
  id: string;
  type: PaymentMethodType;
  amount: string;
  reference: string;
}

export interface Customer {
  id: number;
  customer_code?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at?: string;
}

export interface LayawayTransaction {
  id: number;
  bill_id: number;
  payment_date: string;
  amount: number;
  payment_method: string;
  reference_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdvanceBooking {
  id: number;
  bill_id: number;
  booking_date: string;
  delivery_date: string;
  advance_amount: number;
  total_amount: number;
  remaining_amount?: number;
  item_description: string;
  customer_notes: string;
  booking_status: 'active' | 'delivered' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}
