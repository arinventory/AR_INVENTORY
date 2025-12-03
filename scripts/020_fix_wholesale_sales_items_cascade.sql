-- Fix wholesale_sales_items cascade delete constraints
-- This script ensures that when a product is deleted, all related sales items are also deleted

-- Fix wholesale_sales_items table to add ON DELETE CASCADE for product_id
ALTER TABLE public.wholesale_sales_items
DROP CONSTRAINT IF EXISTS wholesale_sales_items_product_id_fkey;

ALTER TABLE public.wholesale_sales_items
ADD CONSTRAINT wholesale_sales_items_product_id_fkey
FOREIGN KEY (product_id) REFERENCES public.wholesale_products(id) ON DELETE CASCADE;