-- Add expenses column to retail_products table
-- This allows tracking additional costs for retail products
-- Total cost = cost_price + expenses

-- Add expenses column (default 0)
ALTER TABLE public.retail_products 
ADD COLUMN IF NOT EXISTS expenses DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add a computed column comment to document the calculation
COMMENT ON COLUMN public.retail_products.expenses IS 'Additi    onal expenses on top of cost price (transport, handling, etc.)';
COMMENT ON COLUMN public.retail_products.cost_price IS 'Base cost price';

-- Update existing records to set default expenses to 0 if NULL
UPDATE public.retail_products 
SET expenses = 0 
WHERE expenses IS NULL;