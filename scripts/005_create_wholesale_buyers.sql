-- Create wholesale_buyers table
CREATE TABLE IF NOT EXISTS public.wholesale_buyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update buyer_credit_ledger to reference wholesale_buyers instead of customers
ALTER TABLE public.buyer_credit_ledger
DROP CONSTRAINT IF EXISTS buyer_credit_ledger_customer_id_fkey;

ALTER TABLE public.buyer_credit_ledger
ADD CONSTRAINT buyer_credit_ledger_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES public.wholesale_buyers(id) ON DELETE CASCADE;

-- Update buyer_payments to reference wholesale_buyers instead of customers
ALTER TABLE public.buyer_payments
DROP CONSTRAINT IF EXISTS buyer_payments_customer_id_fkey;

ALTER TABLE public.buyer_payments
ADD CONSTRAINT buyer_payments_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES public.wholesale_buyers(id) ON DELETE CASCADE;

-- Update wholesale_sales to reference wholesale_buyers instead of customers
ALTER TABLE public.wholesale_sales
DROP CONSTRAINT IF EXISTS wholesale_sales_customer_id_fkey;

ALTER TABLE public.wholesale_sales
ADD CONSTRAINT wholesale_sales_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES public.wholesale_buyers(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.wholesale_buyers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wholesale_buyers
CREATE POLICY "Enable read access for authenticated users" ON public.wholesale_buyers
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable insert for authenticated users" ON public.wholesale_buyers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.wholesale_buyers
  FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.wholesale_buyers
  FOR DELETE USING (auth.role() = 'authenticated');










