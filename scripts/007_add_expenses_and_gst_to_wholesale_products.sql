-- Add expenses and GST columns to wholesale_products table
-- This allows tracking additional costs and tax percentage for wholesale products
-- Total cost = cost_price + expenses, with GST applied at 5%

-- Add expenses column (default 0)
ALTER TABLE public.wholesale_products 
ADD COLUMN IF NOT EXISTS expenses DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add GST percentage column (default 5%)
ALTER TABLE public.wholesale_products 
ADD COLUMN IF NOT EXISTS gst_percentage DECIMAL(5, 2) DEFAULT 5.00 NOT NULL;

-- Add a computed column comment to document the calculation
COMMENT ON COLUMN public.wholesale_products.expenses IS 'Additional expenses on top of cost price (transport, handling, etc.)';
COMMENT ON COLUMN public.wholesale_products.gst_percentage IS 'GST percentage to be applied (default 5%)';
COMMENT ON COLUMN public.wholesale_products.cost_price IS 'Base cost price from supplier';

-- Update existing records to set default expenses to 0 if NULL
UPDATE public.wholesale_products 
SET expenses = 0 
WHERE expenses IS NULL;

-- Update existing records to set default GST to 5% if NULL
UPDATE public.wholesale_products 
SET gst_percentage = 5.00 
WHERE gst_percentage IS NULL;
