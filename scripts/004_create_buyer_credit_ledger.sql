-- Create buyer credit ledger table (Accounts Receivable)
-- This tracks what buyers owe us (opposite of supplier credit ledger)
CREATE TABLE IF NOT EXISTS public.buyer_credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL, -- debit (sale/invoice), credit (payment received)
  amount DECIMAL(12, 2) NOT NULL,
  reference_id UUID, -- links to wholesale_sale or buyer_payment
  reference_type TEXT, -- wholesale_sale, buyer_payment
  description TEXT,
  balance_after DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buyer payments table (payments received from buyers)
CREATE TABLE IF NOT EXISTS public.buyer_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  method TEXT NOT NULL, -- cash, bank_transfer, cheque, upi, etc.
  reference_no TEXT,
  wholesale_sale_id UUID REFERENCES public.wholesale_sales(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update wholesale_sales to properly link to customers
-- Add customer_id if it doesn't exist (it might be using supplier_id or customer_name)
ALTER TABLE public.wholesale_sales
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.buyer_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for buyer_credit_ledger
CREATE POLICY "Enable read access for authenticated users" ON public.buyer_credit_ledger
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.buyer_credit_ledger
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.buyer_credit_ledger
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.buyer_credit_ledger
  FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for buyer_payments
CREATE POLICY "Enable read access for authenticated users" ON public.buyer_payments
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.buyer_payments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.buyer_payments
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.buyer_payments
  FOR DELETE USING (auth.role() = 'authenticated');




