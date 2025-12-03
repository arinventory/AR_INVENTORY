-- Rename sku column to size in retail_products table
ALTER TABLE public.retail_products 
RENAME COLUMN sku TO size;

-- Add product_type column to categorize products
ALTER TABLE public.retail_products 
ADD COLUMN IF NOT EXISTS product_type TEXT;

-- Update the unique constraint to be on (product_type, size) instead of just size
-- First drop the old constraint
ALTER TABLE public.retail_products 
DROP CONSTRAINT IF EXISTS retail_products_sku_key;

-- Add new unique constraint for product_type + size combination
ALTER TABLE public.retail_products 
ADD CONSTRAINT retail_products_product_type_size_key UNIQUE (product_type, size);










