-- Add deleted flag to products tables to enable soft delete functionality
-- This allows us to hide deleted products from the UI while preserving sales records

-- Add deleted column to wholesale_products table
ALTER TABLE public.wholesale_products 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Add deleted column to retail_products table
ALTER TABLE public.retail_products 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Add indexes for better query performance on deleted products
CREATE INDEX IF NOT EXISTS idx_wholesale_products_deleted ON public.wholesale_products(deleted);
CREATE INDEX IF NOT EXISTS idx_retail_products_deleted ON public.retail_products(deleted);

-- Add comments to document the columns
COMMENT ON COLUMN public.wholesale_products.deleted IS 'Soft delete flag - when true, product is hidden from UI but sales records preserved';
COMMENT ON COLUMN public.retail_products.deleted IS 'Soft delete flag - when true, product is hidden from UI but sales records preserved';