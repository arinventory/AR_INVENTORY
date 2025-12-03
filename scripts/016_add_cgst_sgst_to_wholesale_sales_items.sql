-- Add CGST and SGST columns to wholesale_sales_items table
-- This allows tracking separate CGST and SGST values for each item

-- Add CGST amount column (default 0)
ALTER TABLE public.wholesale_sales_items 
ADD COLUMN IF NOT EXISTS cgst_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add SGST amount column (default 0)
ALTER TABLE public.wholesale_sales_items 
ADD COLUMN IF NOT EXISTS sgst_amount DECIMAL(10, 2) DEFAULT 0 NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN public.wholesale_sales_items.cgst_amount IS 'CGST amount for this item (default 0)';
COMMENT ON COLUMN public.wholesale_sales_items.sgst_amount IS 'SGST amount for this item (default 0)';

-- Update existing records to set default amounts to 0 if NULL
UPDATE public.wholesale_sales_items 
SET cgst_amount = 0 
WHERE cgst_amount IS NULL;

UPDATE public.wholesale_sales_items 
SET sgst_amount = 0 
WHERE sgst_amount IS NULL;