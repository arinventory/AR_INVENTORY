-- Allow deletion of retail products even if they're used in sales
-- This migration makes product_id nullable and sets ON DELETE SET NULL
-- so sales records are preserved but product reference is cleared

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.sales_items
DROP CONSTRAINT IF EXISTS sales_items_product_id_fkey;

-- Step 2: Make product_id nullable (so it can be set to NULL when product is deleted)
ALTER TABLE public.sales_items
ALTER COLUMN product_id DROP NOT NULL;

-- Step 3: Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.sales_items
ADD CONSTRAINT sales_items_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES public.retail_products(id) 
ON DELETE SET NULL;










