-- Add missing customer address columns to wholesale_sales table
ALTER TABLE public.wholesale_sales
ADD COLUMN IF NOT EXISTS customer_phone TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_address TEXT,
ADD COLUMN IF NOT EXISTS customer_city TEXT,
ADD COLUMN IF NOT EXISTS customer_state TEXT,
ADD COLUMN IF NOT EXISTS customer_postal_code TEXT,
ADD COLUMN IF NOT EXISTS customer_country TEXT;